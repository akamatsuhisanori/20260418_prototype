// ============================================================
// /api/import/xlsx
//   admin が、過去に reroots v2 (スタンドアロン .jsx) からエクスポートした
//   Excel ファイルを取り込み、responses.data を上書きする。
//
//   1 行目の "回答者メール" をキーに既存ユーザを探す。
//   存在しないメールは invitations に追加だけする（ログインするとプロフィール作成）。
// ============================================================
import { createReadStream } from "node:fs";
import * as XLSX from "xlsx";
import { CONTENT } from "~/content/assessment";
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";
import type { AssessmentState } from "~/types/database.types";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const form = await readMultipartFormData(event);
  if (!form) {
    throw createError({ statusCode: 400, statusMessage: "ファイルが必要です" });
  }
  const file = form.find((p) => p.name === "file");
  if (!file) {
    throw createError({ statusCode: 400, statusMessage: "file フィールドが必要です" });
  }

  const wb = XLSX.read(file.data, { type: "buffer" });
  const dims = CONTENT.questions.dimensions;
  const dialogues = CONTENT.questions.dialogue;

  // email -> AssessmentState の部分集合 を組み立てる
  const merged: Record<string, AssessmentState> = {};

  const getOrInit = (email: string): AssessmentState => {
    if (!merged[email]) {
      merged[email] = {
        orgs: { past: ["", "", ""], current: ["", "", ""] },
        frequencies: { past: {}, current: {} },
        dimensions: { past: {}, current: {} },
        dialogue: {},
        actions: { craftExperiments: "", shiftConnections: "", makeSense: "" },
        meta: { step: 5, subStep: 4, updatedAt: new Date().toISOString() },
      };
    }
    return merged[email];
  };

  // ---- 組織データ ----
  const orgSheet = wb.Sheets[CONTENT.excel.sheets.orgs];
  if (orgSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(orgSheet, { defval: "" });
    for (const r of rows) {
      const email = String(r["回答者メール"] ?? "").trim().toLowerCase();
      if (!email) continue;
      const state = getOrInit(email);
      const phase: "past" | "current" =
        String(r["種別(現在/過去)"] ?? "").includes("現在") ? "current" : "past";
      const name = String(r["組織名"] ?? "").trim();
      if (!name) continue;
      const slot = state.orgs[phase].findIndex((x) => !x);
      if (slot >= 0) state.orgs[phase][slot] = name;
      state.frequencies[phase][name] = Number(r["関わり頻度(1-5)"]) || 0;
      // 人格形成度 0-100 → 10 段階平均に戻す（1 次元ぶんの当てはめで OK）
      const formation = Number(r["人格形成度(0-100%)"]) || 0;
      // ざっくり同値に 3 次元を埋める（情報が足りないので）
      const tenScale = Math.round((formation / 100) * 10);
      state.dimensions[phase][name] = {};
      for (const d of dims) state.dimensions[phase][name][d.id] = tenScale;
    }
  }

  // ---- 自分らしさの解体 ----
  const idSheet = wb.Sheets[CONTENT.excel.sheets.identity];
  if (idSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(idSheet, { defval: "" });
    for (const r of rows) {
      const email = String(r["回答者メール"] ?? "").trim().toLowerCase();
      if (!email) continue;
      const state = getOrInit(email);
      const dimLabel = String(r["次元"] ?? "").trim();
      const dim = dims.find((d) => d.label === dimLabel);
      if (!dim) continue;
      state.dialogue[`step4:${dim.id}:episode`] = String(r["エピソード記述"] ?? "");
      state.dialogue[`step4:${dim.id}:keyword`] = String(r["一言キーワード"] ?? "");
    }
  }

  // ---- 3人の対話 ----
  const dialogSheet = wb.Sheets[CONTENT.excel.sheets.dialogue];
  if (dialogSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(dialogSheet, { defval: "" });
    for (const r of rows) {
      const email = String(r["回答者メール"] ?? "").trim().toLowerCase();
      if (!email) continue;
      const state = getOrInit(email);
      const dimLabel = String(r["次元"] ?? "").trim();
      const dim = dims.find((d) => d.label === dimLabel) || dims[0];
      state.dialogue["step5:selectedDim"] = dim.id;
      const qLabel = String(r["質問"] ?? "").trim();
      const q = dialogues.find((q) => q.label === qLabel);
      if (!q) continue;
      state.dialogue[`step5:dialogue:${dim.id}:${q.id}:past`] = String(r["過去の自分"] ?? "");
      state.dialogue[`step5:dialogue:${dim.id}:${q.id}:present`] = String(r["今の自分"] ?? "");
      state.dialogue[`step5:dialogue:${dim.id}:${q.id}:future`] = String(r["未来の自分"] ?? "");
    }
  }

  // ---- 行動プラン ----
  const actSheet = wb.Sheets[CONTENT.excel.sheets.action];
  if (actSheet) {
    const rows = XLSX.utils.sheet_to_json<any>(actSheet, { defval: "" });
    for (const r of rows) {
      const email = String(r["回答者メール"] ?? "").trim().toLowerCase();
      if (!email) continue;
      const state = getOrInit(email);
      const kind = String(r["戦略/項目"] ?? "").trim();
      const content = String(r["内容"] ?? "");
      if (kind.startsWith("Craft")) state.actions.craftExperiments = content;
      else if (kind.startsWith("Shift")) state.actions.shiftConnections = content;
      else if (kind.startsWith("Make")) state.actions.makeSense = content;
      else if (kind === CONTENT.excel.weeklyRowLabel)
        state.dialogue["step5:week"] = content;
    }
  }

  // ---- responses に書き戻す ----
  const admin = getSupabaseAdmin();
  let imported = 0;

  for (const [email, stateData] of Object.entries(merged)) {
    // 対象ユーザのプロフィールを引く
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profile) {
      // upsert
      const { data: existing } = await admin
        .from("responses")
        .select("id")
        .eq("user_id", profile.id)
        .maybeSingle();
      if (existing) {
        await admin
          .from("responses")
          .update({ data: stateData })
          .eq("id", existing.id);
      } else {
        await admin.from("responses").insert({
          user_id: profile.id,
          data: stateData,
        });
      }
      imported += 1;
    } else {
      // まだログインしていないので招待だけ登録
      await admin
        .from("invitations")
        .upsert(
          { email, status: "pending", note: "imported from legacy xlsx" },
          { onConflict: "email" },
        );
    }
  }

  return { ok: true, imported };
});
