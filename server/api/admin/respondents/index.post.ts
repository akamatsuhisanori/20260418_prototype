// ============================================================
// POST /api/admin/respondents
//   新規回答者用トークンを発行する。
//   body: { label?: string }
//   response: { id, access_token, label, ... }
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";
import { generateAccessToken } from "~/server/utils/token";

export default defineEventHandler(async (event) => {
  const adminUser = await requireAdmin(event);
  const body = await readBody<{ label?: string }>(event).catch(() => ({}));
  const label = body?.label?.trim() || null;

  const admin = getSupabaseAdmin();
  const token = generateAccessToken();
  const { data, error } = await admin
    .from("responses")
    .insert({
      access_token: token,
      label,
      created_by: adminUser.id,
      data: {},
    })
    .select("id, access_token, label, is_submitted, is_revoked, started_at, updated_at, submitted_at")
    .single();
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return data;
});
