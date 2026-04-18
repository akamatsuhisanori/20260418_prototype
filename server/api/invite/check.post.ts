// ============================================================
// /api/invite/check
//   ログインページから呼ばれる「このメール、招待されてる？」判定。
//   RLS 越しだと未ログインユーザは invitations を見られないので、
//   service_role の admin client 経由で存在確認する。
// ============================================================
import { getSupabaseAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string }>(event);
  const email = (body.email || "").trim().toLowerCase();
  if (!email) {
    return { ok: false, reason: "empty" };
  }

  // ADMIN_EMAIL は常に招待不要で通す（初回ブートストラップ用）
  const config = useRuntimeConfig();
  if (config.adminEmail && email === String(config.adminEmail).toLowerCase()) {
    return { ok: true };
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("invitations")
    .select("status")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[invite/check]", error);
    return { ok: false, reason: "error" };
  }
  if (!data || data.status === "revoked") {
    return { ok: false, reason: "not_invited" };
  }
  return { ok: true };
});
