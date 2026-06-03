// ============================================================
// auth.global.ts
//   /assessment/* （回答者用トークン URL）はログイン不要で公開。
//   /admin/* と / は admin ログイン必須（admin 以外は /login へ）。
// ============================================================
export default defineNuxtRouteMiddleware(async (to) => {
  // 回答者向け公開ルート
  if (to.path.startsWith("/assessment/")) return;
  // 1 週間ワーク・振り返りワーク（クッキーで参加者識別）も公開
  if (to.path === "/daily" || to.path.startsWith("/daily/")) return;
  if (to.path === "/review" || to.path.startsWith("/review/")) return;

  // 認証関連の公開ルート
  const publicPaths = ["/login", "/confirm", "/emergency-login"];
  if (publicPaths.includes(to.path)) return;

  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo("/login");
  }

  // admin 配下と / は admin 限定
  const { refresh, isAdmin } = useIsAdmin();
  await refresh();
  if (!isAdmin.value) {
    return navigateTo("/login");
  }
});
