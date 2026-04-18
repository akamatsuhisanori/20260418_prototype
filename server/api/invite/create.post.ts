// ============================================================
// /api/invite/create
//   admin が新しいメールを招待リストに追加する。
//   既に存在していれば note の更新と status のリセットだけ行う。
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const me = await requireAdmin(event);
  const body = await readBody<{ email?: string; note?: string }>(event);
  const email = (body.email || "").trim().toLowerCase();
  const note = (body.note || "").trim();
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "email が必要です" });
  }

  const admin = getSupabaseAdmin();
  const { data: existing } = await admin
    .from("invitations")
    .select("id, status")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    await admin
      .from("invitations")
      .update({ status: "pending", note: note || null })
      .eq("id", existing.id);
    return { ok: true, id: existing.id, updated: true };
  }

  const { data, error } = await admin
    .from("invitations")
    .insert({
      email,
      note: note || null,
      invited_by: me.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw createError({ statusCode: 500, statusMessage: error?.message || "insert failed" });
  }
  return { ok: true, id: data.id };
});
