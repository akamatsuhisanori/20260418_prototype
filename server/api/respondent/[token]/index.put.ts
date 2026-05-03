// ============================================================
// PUT /api/respondent/[token]
//   回答途中の state を debounce で保存する。
//   - is_revoked / is_submitted の場合は 403 で拒否
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
    throw createError({ statusCode: 403, statusMessage: "already submitted" });
  }

  const { error } = await admin
    .from("responses")
    .update({ data: body.data })
    .eq("id", row.id);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true };
});
