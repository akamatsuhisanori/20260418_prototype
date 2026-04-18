// ============================================================
// /api/export/csv
//   全回答者の responses.data を wide 形式の CSV にまとめて返す。
//   admin 専用。Excel で開きやすいよう UTF-8 BOM 付き。
// ============================================================
import { CONTENT } from "~/content/assessment";
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";
import type { AssessmentState } from "~/types/database.types";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const admin = getSupabaseAdmin();

  const { data: rows, error } = await admin
    .from("responses")
    .select("user_id, data, is_submitted, submitted_at, updated_at, profiles:profiles!inner(email)")
    .order("updated_at", { ascending: false });
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const dims = CONTENT.questions.dimensions;
  const dialogues = CONTENT.questions.dialogue;

  // ---- header ----
  const header: string[] = [
    "回答者メール",
    "提出状態",
    "送信日時",
    "更新日時",
    // orgs × 2 phase × 3 slot
    ...["past", "current"].flatMap((p) =>
      [1, 2, 3].map((n) => `${p === "past" ? "過去" : "現在"}組織${n}`),
    ),
    // identity 3 dim × 2 phase × org1-3
    ...["past", "current"].flatMap((p) =>
      [1, 2, 3].flatMap((n) =>
        dims.map(
          (d) =>
            `${p === "past" ? "過去" : "現在"}組織${n}_${d.label}(0-10)`,
        ),
      ),
    ),
    // frequency × 2 phase × org1-3
    ...["past", "current"].flatMap((p) =>
      [1, 2, 3].map(
        (n) => `${p === "past" ? "過去" : "現在"}組織${n}_関わり頻度(1-5)`,
      ),
    ),
    // dimension keywords & episodes
    ...dims.flatMap((d) => [
      `${d.label}_エピソード`,
      `${d.label}_キーワード`,
    ]),
    // dialogue 3x3 (question × tense)
    ...dialogues.flatMap((q) =>
      ["past", "present", "future"].map(
        (t) => `対話_${q.label}_${CONTENT.step5.personShort[t as "past" | "present" | "future"]}`,
      ),
    ),
    // actions
    "行動_CraftExperiments",
    "行動_ShiftConnections",
    "行動_MakeSense",
    "今週のプラン",
  ];

  const lines: string[] = [header.map(csvEscape).join(",")];

  for (const row of rows ?? []) {
    const d = (row.data as AssessmentState) || null;
    const email = Array.isArray(row.profiles)
      ? (row.profiles[0] as any)?.email
      : (row.profiles as any)?.email;

    const cells: (string | number)[] = [
      email ?? "",
      row.is_submitted ? "提出済" : "未提出",
      row.submitted_at ?? "",
      row.updated_at ?? "",
    ];

    if (!d) {
      // blank row for users who never started
      const fillCount = header.length - cells.length;
      for (let i = 0; i < fillCount; i++) cells.push("");
      lines.push(cells.map(csvEscape).join(","));
      continue;
    }

    // orgs
    for (const phase of ["past", "current"] as const) {
      for (let i = 0; i < 3; i++) cells.push(d.orgs[phase][i] ?? "");
    }
    // identity dimensions
    for (const phase of ["past", "current"] as const) {
      for (let i = 0; i < 3; i++) {
        const name = d.orgs[phase][i];
        for (const dim of dims) {
          cells.push(name ? d.dimensions[phase]?.[name]?.[dim.id] ?? "" : "");
        }
      }
    }
    // frequency
    for (const phase of ["past", "current"] as const) {
      for (let i = 0; i < 3; i++) {
        const name = d.orgs[phase][i];
        cells.push(name ? d.frequencies[phase][name] ?? "" : "");
      }
    }
    // dim episodes/keywords
    for (const dim of dims) {
      cells.push(d.dialogue[`step4:${dim.id}:episode`] ?? "");
      cells.push(d.dialogue[`step4:${dim.id}:keyword`] ?? "");
    }
    // dialogue
    const selectedDim = d.dialogue["step5:selectedDim"] || dims[0].id;
    for (const q of dialogues) {
      for (const t of ["past", "present", "future"] as const) {
        cells.push(d.dialogue[`step5:dialogue:${selectedDim}:${q.id}:${t}`] ?? "");
      }
    }
    // actions
    cells.push(d.actions.craftExperiments ?? "");
    cells.push(d.actions.shiftConnections ?? "");
    cells.push(d.actions.makeSense ?? "");
    cells.push(d.dialogue["step5:week"] ?? "");

    lines.push(cells.map(csvEscape).join(","));
  }

  const body = "\uFEFF" + lines.join("\r\n");
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
