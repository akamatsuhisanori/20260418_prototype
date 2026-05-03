// ============================================================
// DELETE /api/admin/respondents/[id]
//   トークンと紐付く回答行を物理削除する（admin 専用）。
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "id required" });
  const admin = getSupabaseAdmin();
  const { error } = await admin.from("responses").delete().eq("id", id);
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true };
});
