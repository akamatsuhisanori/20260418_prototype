// ============================================================
// /api/import/xlsx
//   admin が、過去の Excel エクスポートを取り込み、
//   1 行目の「回答者」（旧「回答者メール」）をキーに
//   responses 行を作成 / 上書きする。
//
//   ログイン廃止後の仕様:
//     - 同じラベルの既存 responses があれば上書き
//     - 無ければ新規 access_token を発行して作成（作った URL は admin 画面で確認）
// ============================================================
import * as XLSX from "xlsx";
import { CONTENT } from "~/content/assessment";
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";
import { generateAccessToken } from "~/server/utils/token";
import type { AssessmentState } from "~/types/database.types";

const RESPONDENT_KEYS = ["回答者", "回答者メール"] as const;
const respondentOf = (r: Record<string, unknown>): string => {
  for (const k of RESPONDENT_KEYS) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
};

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event);

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

  // label -> AssessmentState の部分集合 を組み立てる
  const merged: Record<string, AssessmentState> = {};

  const getOrInit = (key: string): AssessmentState => {
    if (!merged[key]) {
      merged[key] = {
        orgs: { past: ["", "", ""], current: ["", "", ""] },
        frequencies: { past: {}, current: {} },
        dimensions: { past: {}, current: {} },
        identityStrength: { past: {}, current: {} },
        dialogue: {},
        actions: { craftExperiments: "", shiftConnections: "", makeSense: "" },
        meta: { step: 5, subStep: 4, updatedAt: new Date().toISOString() },
      };
    }
    return merged[key];
  };

  // ---- 組織データ ----
  const orgSheet = wb.Sheets[CONTENT.excel.sheets.orgs];
  if (orgSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(orgSheet, { defval: "" });
    for (const r of rows) {
      const key = respondentOf(r);
      if (!key) continue;
      const state = getOrInit(key);
      const phase: "past" | "current" =
        String(r["種別(現在/過去)"] ?? "").includes("現在") ? "current" : "past";
      const name = String(r["組織名"] ?? "").trim();
      if (!name) continue;
      const slot = state.orgs[phase].findIndex((x) => !x);
      if (slot >= 0) state.orgs[phase][slot] = name;
      state.frequencies[phase][name] = Number(r["関わり頻度(1-5)"]) || 0;
      const formation = Number(r["人格形成度(0-100%)"]) || 0;
      const tenScale = Math.round((formation / 100) * 10);
      state.dimensions[phase][name] = {};
      for (const d of dims) state.dimensions[phase][name][d.id] = tenScale;
    }
  }

  // ---- 自分らしさの解体 ----
  const idSheet = wb.Sheets[CONTENT.excel.sheets.identity];
  if (idSheet) {
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(idSheet, { defval: "" });
    for (const r of rows) {
      const key = respondentOf(r);
      if (!key) continue;
      const state = getOrInit(key);
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
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(dialogSheet, { defval: "" });
    for (const r of rows) {
      const key = respondentOf(r);
      if (!key) continue;
      const state = getOrInit(key);
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
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(actSheet, { defval: "" });
    for (const r of rows) {
      const key = respondentOf(r);
      if (!key) continue;
      const state = getOrInit(key);
      const kind = String(r["戦略/項目"] ?? "").trim();
      const content = String(r["内容"] ?? "");
      if (kind.startsWith("Craft")) state.actions.craftExperiments = content;
      else if (kind.startsWith("Shift")) state.actions.shiftConnections = content;
      else if (kind.startsWith("Make")) state.actions.makeSense = content;
      else if (kind === CONTENT.excel.weeklyRowLabel)
        state.dialogue["step5:week"] = content;
    }
  }

  // ---- responses に書き戻す（label でマッチ → 無ければ新規発行）----
  const admin = getSupabaseAdmin();
  let imported = 0;

  for (const [label, stateData] of Object.entries(merged)) {
    const { data: existing } = await admin
      .from("responses")
      .select("id")
      .eq("label", label)
      .maybeSingle();

    if (existing) {
      await admin
        .from("responses")
        .update({ data: stateData })
        .eq("id", existing.id);
    } else {
      await admin.from("responses").insert({
        access_token: generateAccessToken(),
        label,
        data: stateData,
        created_by: adminUser.id,
      });
    }
    imported += 1;
  }

  return { ok: true, imported };
});
