// ============================================================
// /api/export/xlsx
//   全回答者の responses.data を 1 シート wide 形式で Excel に書き出す。
//   仕様書 v1（6 ブロック）に対応。
// ============================================================
import * as XLSX from "xlsx";
import { AXIS_KEYS } from "~/content/assessment";
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";
import type { AssessmentState, Organization } from "~/types/database.types";

const MAX_ORGS = 8;

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

  const header: string[] = [
    "回答者",
    "提出状態",
    "送信日時",
    "更新日時",
    ...Array.from({ length: MAX_ORGS }, (_, i) => [
      `組織${i + 1}_名前`,
      `組織${i + 1}_区分(過去/現在)`,
    ]).flat(),
    ...Array.from({ length: MAX_ORGS }, (_, i) => [
      ...[1, 2, 3, 4, 5, 6].map((q) => `組織${i + 1}_Q${q}(1-5)`),
      `組織${i + 1}_平均`,
    ]).flat(),
    "重要組織_名前",
    "重要組織_選定方法",
    ...AXIS_KEYS.flatMap((k) => [`B4_${k}_詳細`, `B4_${k}_一言`]),
    "B5_核",
    ...AXIS_KEYS.flatMap((k) => [`B6_現在_${k}_詳細`, `B6_現在_${k}_一言`]),
    ...AXIS_KEYS.flatMap((k) => [`B6_未来_${k}_詳細`, `B6_未来_${k}_一言`]),
    ...AXIS_KEYS.flatMap((k) => [`B6_${k}_ギャップ有無`, `B6_${k}_行動`]),
  ];

  const aoa: (string | number)[][] = [header];

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
      aoa.push(cells);
      continue;
    }

    const orgs = (d.organizations ?? []) as Organization[];
    for (let i = 0; i < MAX_ORGS; i++) {
      const o = orgs[i];
      cells.push(o?.name ?? "");
      cells.push(o ? (o.tag === "current" ? "現在" : "過去") : "");
    }
    for (let i = 0; i < MAX_ORGS; i++) {
      const o = orgs[i];
      const arr = o ? d.scores?.[String(o.id)] ?? [] : [];
      for (let q = 0; q < 6; q++) cells.push(arr[q] ?? "");
      const filled = arr.filter((v) => v > 0);
      const avg =
        filled.length === 0
          ? ""
          : Number((filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(2));
      cells.push(avg);
    }
    const sel = orgs.find((o) => o.id === d.selectedOrgId) ?? null;
    cells.push(sel?.name ?? "");
    cells.push(d.selectedOrgManual ? "手動" : sel ? "自動" : "");
    for (const k of AXIS_KEYS) {
      cells.push(d.block4?.[k]?.detail ?? "");
      cells.push(d.block4?.[k]?.summary ?? "");
    }
    cells.push(d.coreStatement ?? "");
    for (const k of AXIS_KEYS) {
      cells.push(d.block6?.current?.[k]?.detail ?? "");
      cells.push(d.block6?.current?.[k]?.summary ?? "");
    }
    for (const k of AXIS_KEYS) {
      cells.push(d.block6?.future?.[k]?.detail ?? "");
      cells.push(d.block6?.future?.[k]?.summary ?? "");
    }
    for (const k of AXIS_KEYS) {
      const g = d.block6?.gaps?.[k];
      cells.push(g?.hasGap == null ? "" : g.hasGap ? "あり" : "なし");
      cells.push(g?.action ?? "");
    }

    aoa.push(cells);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, "回答");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  setResponseHeader(
    event,
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="reroots_responses_${todayStamp()}.xlsx"`,
  );
  return buf;
});

function todayStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
