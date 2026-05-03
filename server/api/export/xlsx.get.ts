// ============================================================
// /api/export/xlsx
//   4 シート構成（組織データ / 自分らしさの解体 / 3人の対話 / 行動プラン）
//   の Excel を返す。reroots v2 (jsx) の layout を踏襲。
// ============================================================
import * as XLSX from "xlsx";
import { CONTENT } from "~/content/assessment";
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";
import type { AssessmentState } from "~/types/database.types";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const admin = getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from("responses")
    .select("label, access_token, data")
    .eq("is_revoked", false)
    .order("updated_at", { ascending: false });

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const dims = CONTENT.questions.dimensions;
  const dialogues = CONTENT.questions.dialogue;

  // ---- Sheet 1: 組織データ ----
  const orgHeaders = CONTENT.excel.orgHeaders;
  const orgRows: (string | number)[][] = [orgHeaders as unknown as string[]];

  // ---- Sheet 2: 自分らしさの解体 ----
  const identityHeaders = CONTENT.excel.identityHeaders;
  const identityRows: (string | number)[][] = [identityHeaders as unknown as string[]];

  // ---- Sheet 3: 3人の対話 ----
  const dialogueHeaders = CONTENT.excel.dialogueHeaders;
  const dialogueRows: (string | number)[][] = [dialogueHeaders as unknown as string[]];

  // ---- Sheet 4: 行動プラン ----
  const actionHeaders = CONTENT.excel.actionHeaders;
  const actionRows: (string | number)[][] = [actionHeaders as unknown as string[]];

  for (const row of rows ?? []) {
    const d = (row.data as AssessmentState) || null;
    const respondent = row.label || `token:${row.access_token.slice(0, 8)}`;
    if (!d) continue;

    // Sheet 1
    for (const phase of ["past", "current"] as const) {
      for (const name of d.orgs[phase].filter(Boolean)) {
        const dims4 = CONTENT.questions.org; // 帰属感/感情的結びつき/... (org Q)
        const dm = d.dimensions[phase]?.[name] ?? {};
        // 人格形成度 = dimensions (affective/relational/agentic) 平均 * 10 = 0-100
        const formation =
          (dims.reduce((a, x) => a + (dm[x.id] ?? 0), 0) / (dims.length * 10)) * 100;
        orgRows.push([
          respondent,
          name,
          phase === "past" ? "過去" : "現在",
          // org-level Qs are not captured in current UI — leave blank
          "",
          "",
          "",
          "",
          Math.round(formation),
          d.frequencies[phase][name] ?? "",
        ]);
      }
    }

    // Sheet 2
    const targetOrg =
      d.orgs.past.filter(Boolean)[0] ?? d.orgs.current.filter(Boolean)[0] ?? "";
    for (const dim of dims) {
      identityRows.push([
        respondent,
        targetOrg,
        dim.label,
        dim.rbs,
        d.dialogue[`step4:${dim.id}:episode`] ?? "",
        d.dialogue[`step4:${dim.id}:keyword`] ?? "",
      ]);
    }

    // Sheet 3
    const selectedDim = d.dialogue["step5:selectedDim"] || dims[0].id;
    const selectedLabel = dims.find((x) => x.id === selectedDim)?.label ?? selectedDim;
    for (const q of dialogues) {
      dialogueRows.push([
        respondent,
        selectedLabel,
        q.label,
        d.dialogue[`step5:dialogue:${selectedDim}:${q.id}:past`] ?? "",
        d.dialogue[`step5:dialogue:${selectedDim}:${q.id}:present`] ?? "",
        d.dialogue[`step5:dialogue:${selectedDim}:${q.id}:future`] ?? "",
      ]);
    }

    // Sheet 4
    actionRows.push([
      respondent,
      CONTENT.excel.actionRows.craftExperiments,
      d.actions.craftExperiments ?? "",
    ]);
    actionRows.push([
      respondent,
      CONTENT.excel.actionRows.shiftConnections,
      d.actions.shiftConnections ?? "",
    ]);
    actionRows.push([
      respondent,
      CONTENT.excel.actionRows.makeSense,
      d.actions.makeSense ?? "",
    ]);
    actionRows.push([respondent, CONTENT.excel.weeklyRowLabel, d.dialogue["step5:week"] ?? ""]);
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(orgRows),
    CONTENT.excel.sheets.orgs,
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(identityRows),
    CONTENT.excel.sheets.identity,
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(dialogueRows),
    CONTENT.excel.sheets.dialogue,
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(actionRows),
    CONTENT.excel.sheets.action,
  );

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  setResponseHeader(
    event,
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  setResponseHeader(
    event,
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(CONTENT.excel.fileName)}"`,
  );
  return buf;
});
