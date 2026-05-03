// ============================================================
// /api/export/csv
//   全回答者の responses.data を wide 形式の CSV にまとめて返す。
//   admin 専用。Excel で開きやすいよう UTF-8 BOM 付き。
//   仕様書 v1（6 ブロック）に対応。
// ============================================================
import { CONTENT, AXIS_KEYS } from "~/content/assessment";
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";
import type { AssessmentState, Organization } from "~/types/database.types";

const MAX_ORGS = 8; // CONTENT.block1.maxOrgs と同期

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const admin = getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from("responses")
    .select("label, access_token, data, is_submitted, submitted_at, updated_at")
    .eq("is_revoked", false)
    .order("updated_at", { ascending: false });
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  // ---- header ----
  const header: string[] = [
    "回答者",
    "提出状態",
    "送信日時",
    "更新日時",
    // ブロック 1: 組織リスト × 8
    ...Array.from({ length: MAX_ORGS }, (_, i) => [
      `組織${i + 1}_名前`,
      `組織${i + 1}_区分(過去/現在)`,
    ]).flat(),
    // ブロック 2: 各組織の 6 項目スコア + 平均
    ...Array.from({ length: MAX_ORGS }, (_, i) => [
      ...[1, 2, 3, 4, 5, 6].map((q) => `組織${i + 1}_Q${q}(1-5)`),
      `組織${i + 1}_平均`,
    ]).flat(),
    // ブロック 2: 重要組織の確定
    "重要組織_名前",
    "重要組織_選定方法",
    // ブロック 4: 3 軸（Who/Why/What）
    ...AXIS_KEYS.flatMap((k) => [
      `B4_${k}_詳細`,
      `B4_${k}_一言`,
    ]),
    // ブロック 5: 核
    "B5_核",
    // ブロック 6: 9 マス（現在 / 未来 — ナラティブのみ）
    ...AXIS_KEYS.map((k) => `B6_現在_${k}_ナラティブ`),
    ...AXIS_KEYS.map((k) => `B6_未来_${k}_ナラティブ`),
    // ブロック 6: ギャップ判定 + 行動
    ...AXIS_KEYS.flatMap((k) => [
      `B6_${k}_ギャップ有無`,
      `B6_${k}_行動`,
    ]),
  ];

  const lines: string[] = [header.map(csvEscape).join(",")];

  for (const row of rows ?? []) {
    const d = (row.data as AssessmentState) || null;
    const respondent = row.label || `token:${row.access_token.slice(0, 8)}`;

    const cells: (string | number)[] = [
      respondent,
      row.is_submitted ? "提出済" : "未提出",
      row.submitted_at ?? "",
      row.updated_at ?? "",
    ];

    if (!d) {
      while (cells.length < header.length) cells.push("");
      lines.push(cells.map(csvEscape).join(","));
      continue;
    }

    const orgs = (d.organizations ?? []) as Organization[];
    // 組織 1..MAX_ORGS
    for (let i = 0; i < MAX_ORGS; i++) {
      const o = orgs[i];
      cells.push(o?.name ?? "");
      cells.push(o ? (o.tag === "current" ? "現在" : "過去") : "");
    }
    // 各組織のスコア 1..MAX_ORGS
    for (let i = 0; i < MAX_ORGS; i++) {
      const o = orgs[i];
      const arr = o ? d.scores?.[String(o.id)] ?? [] : [];
      for (let q = 0; q < 6; q++) cells.push(arr[q] ?? "");
      // 平均
      const filled = arr.filter((v) => v > 0);
      const avg = filled.length === 0 ? "" : (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(2);
      cells.push(avg);
    }
    // 重要組織
    const sel = orgs.find((o) => o.id === d.selectedOrgId) ?? null;
    cells.push(sel?.name ?? "");
    cells.push(d.selectedOrgManual ? "手動" : sel ? "自動" : "");
    // ブロック 4
    for (const k of AXIS_KEYS) {
      cells.push(d.block4?.[k]?.detail ?? "");
      cells.push(d.block4?.[k]?.summary ?? "");
    }
    // ブロック 5
    cells.push(d.coreStatement ?? "");
    // ブロック 6: 現在（ナラティブのみ）
    for (const k of AXIS_KEYS) {
      cells.push(d.block6?.current?.[k]?.detail ?? "");
    }
    // ブロック 6: 未来（ナラティブのみ）
    for (const k of AXIS_KEYS) {
      cells.push(d.block6?.future?.[k]?.detail ?? "");
    }
    // ギャップ + 行動
    for (const k of AXIS_KEYS) {
      const g = d.block6?.gaps?.[k];
      cells.push(g?.hasGap == null ? "" : g.hasGap ? "あり" : "なし");
      cells.push(g?.action ?? "");
    }

    lines.push(cells.map(csvEscape).join(","));
  }

  const body = "﻿" + lines.join("\r\n");
  setResponseHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="reroots_responses_${todayStamp()}.csv"`,
  );
  return body;
});

function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
