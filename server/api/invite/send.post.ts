// ============================================================
// /api/invite/send
//   admin が特定メールに Magic Link を送る。
//   Supabase の admin API `inviteUserByEmail` を使う。
//   （Magic Link とは別に、ログインページから各自 signInWithOtp しても OK）
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);
  const body = await readBody<{ email?: string }>(event);
  const email = (body.email || "").trim().toLowerCase();
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "email が必要です" });
  }

  const admin = getSupabaseAdmin();

  // 招待リストに無い場合は拒否
  const { data: inv } = await admin
    .from("invitations")
    .select("status")
    .eq("email", email)
    .maybeSingle();
  if (!inv || inv.status === "revoked") {
    throw createError({ statusCode: 400, statusMessage: "招待されていないアドレスです" });
  }

  // Supabase Auth の invite API
  const origin = getRequestURL(event).origin;
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${origin}/confirm`,
  });
  if (error) {
    // 既存ユーザだった場合は signInWithOtp にフォールバック
    const { error: otpErr } = await admin.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${origin}/confirm` },
    });
    if (otpErr) {
      throw createError({ statusCode: 500, statusMessage: otpErr.message });
    }
  }

  return { ok: true };
});
