// ============================================================
// PUT /api/respondent/[token]
//   回答途中の state を debounce で保存する。
//   - is_revoked の場合は 404
//   - is_submitted の場合は step7（1週間ワーク記録）だけマージして保存し、
//     他フィールドは破棄。これにより /review 提出後でも過去日の追記が可能。
// ============================================================
import { getSupabaseAdmin } from "~/server/utils/supabase-admin";
import type { AssessmentState } from "~/types/database.types";

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  if (!token || token.length < 16) {
    throw createError({ statusCode: 400, statusMessage: "invalid token" });
  }
  const body = await readBody<{ data: AssessmentState }>(event);
  if (!body?.data || typeof body.data !== "object") {
    throw createError({ statusCode: 400, statusMessage: "invalid body" });
  }

  const admin = getSupabaseAdmin();
  const { data: row, error: lookupErr } = await admin
    .from("responses")
    .select("id, is_revoked, is_submitted, data")
    .eq("access_token", token)
    .maybeSingle();
  if (lookupErr) {
    throw createError({ statusCode: 500, statusMessage: lookupErr.message });
  }
  if (!row || row.is_revoked) {
    throw createError({ statusCode: 404, statusMessage: "not found" });
  }

  // 提出後は step7（1週間ワーク）だけ受け付け、他は既存値を維持する。
  // これにより参加者は /daily からいつでも過去日の追記・修正ができる。
  let nextData: AssessmentState;
  if (row.is_submitted) {
    const existing =
      (row.data as Partial<AssessmentState> | null) ?? ({} as Partial<AssessmentState>);
    nextData = {
      ...(existing as AssessmentState),
      step7: body.data.step7 ?? (existing as AssessmentState).step7,
    };
  } else {
    nextData = body.data;
  }

  const { error } = await admin
    .from("responses")
    .update({ data: nextData })
    .eq("id", row.id);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true, scope: row.is_submitted ? "step7-only" : "full" };
});
