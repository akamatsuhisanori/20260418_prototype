// ============================================================
// POST /api/respondent/[token]/submit
//   最終提出。is_submitted=true にロックし、submitted_at を打つ。
// ============================================================
import { getSupabaseAdmin } from "~/server/utils/supabase-admin";
import type { AssessmentState } from "~/types/database.types";

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");
  if (!token || token.length < 16) {
    throw createError({ statusCode: 400, statusMessage: "invalid token" });
  }
  const body = await readBody<{ data?: AssessmentState }>(event);

  const admin = getSupabaseAdmin();
  const { data: row, error: lookupErr } = await admin
    .from("responses")
    .select("id, is_revoked, is_submitted")
    .eq("access_token", token)
    .maybeSingle();
  if (lookupErr) {
    throw createError({ statusCode: 500, statusMessage: lookupErr.message });
  }
  if (!row || row.is_revoked) {
    throw createError({ statusCode: 404, statusMessage: "not found" });
  }
  if (row.is_submitted) {
    return { ok: true, alreadySubmitted: true };
  }

  const update: Record<string, unknown> = {
    is_submitted: true,
    submitted_at: new Date().toISOString(),
  };
  if (body?.data && typeof body.data === "object") {
    update.data = body.data;
  }

  const { error } = await admin
    .from("responses")
    .update(update)
    .eq("id", row.id);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true };
});
