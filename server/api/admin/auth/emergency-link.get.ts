// ============================================================
// GET /api/admin/auth/emergency-link
//   Supabase の組み込みメールのレートリミットに引っかかって
//   マジックリンクが送れなくなった時に使う緊急ログイン手段。
//
//   サービスロールで supabase.auth.admin.generateLink() を呼び、
//   実際にメール送信せずに有効なマジックリンク URL を返す。
//
//   使い方:
//     1. Vercel 環境変数に ADMIN_SETUP_SECRET を設定（長くてランダムに）
//     2. ブラウザで以下を開く:
//        /api/admin/auth/emergency-link
//          ?secret=ここに ADMIN_SETUP_SECRET の値
//          &email=ログインしたい管理者メール
//     3. レスポンスの action_link を別タブで開く → ログイン完了
//
//   セキュリティ:
//     - secret を知っていれば任意のメールアドレス向けにマジックリンクを
//       生成できる。長い秘密文字列を設定し、使い終わったら環境変数を
//       削除する／値を回転させる運用にすること。
// ============================================================
import { getSupabaseAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const secret = typeof q.secret === "string" ? q.secret : "";
  const email = typeof q.email === "string" ? q.email.trim() : "";

  const setupSecret =
    process.env.ADMIN_SETUP_SECRET ||
    process.env.NUXT_ADMIN_SETUP_SECRET ||
    "";

  if (!setupSecret) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "ADMIN_SETUP_SECRET が未設定です。Vercel の環境変数に長いランダム文字列を設定してください。",
    });
  }
  // タイミング攻撃を避けるため定数時間比較を試みる
  const equal =
    secret.length === setupSecret.length &&
    secret.split("").every((c, i) => c === setupSecret[i]);
  if (!equal) {
    throw createError({ statusCode: 401, statusMessage: "invalid secret" });
  }
  if (!email) {
    throw createError({ statusCode: 400, statusMessage: "email query param required" });
  }

  const admin = getSupabaseAdmin();
  const reqUrl = getRequestURL(event);
  const redirectTo = `${reqUrl.origin}/confirm`;

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo },
  });

  if (error) {
    console.error("[emergency-link] generateLink error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `generateLink: ${error.message}`,
    });
  }

  // PKCE フロー有効なプロジェクトでは action_link 単独では機能しない（ブラウザ
  // に code_verifier が無いため）。代わりに email_otp を使う緊急ログインページ
  // への URL を組み立てて返す。これは verifyOtp() を呼ぶだけなので PKCE 非依存。
  const otp = data?.properties?.email_otp ?? null;
  const emergencyLoginUrl = otp
    ? `${reqUrl.origin}/emergency-login?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
    : null;

  return {
    note: "★ emergency_login_url を別タブで開いてください。PKCE フロー有効なプロジェクトでは action_link は使えません。",
    email,
    redirect_to: redirectTo,
    emergency_login_url: emergencyLoginUrl,
    action_link: data?.properties?.action_link ?? null,
    email_otp: otp,
  };
});
