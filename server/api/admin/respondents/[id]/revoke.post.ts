// ============================================================
// POST /api/admin/respondents/[id]/revoke
//   トークンを無効化する（行は残すが回答者からアクセス不可に）。
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("responses")
    .update({ is_revoked: true })
    .eq("id", id);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true };
});
