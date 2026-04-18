// ============================================================
// auth.global.ts
//   - /login と /confirm 以外は未ログインだと /login に飛ばす
//   - @nuxtjs/supabase の redirectOptions でも同じ挙動になるが、
//     admin 配下の権限チェック等もまとめたいのでグローバルに 1 枚置く
// ============================================================
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser();
  const publicPaths = ["/login", "/confirm"];

  if (publicPaths.includes(to.path)) return;

  if (!user.value) {
    return navigateTo("/login");
  }

  // /admin 配下は is_admin をチェック
  if (to.path.startsWith("/admin")) {
    const { refresh, isAdmin } = useIsAdmin();
    await refresh();
    if (!isAdmin.value) {
      return navigateTo("/");
    }
  }
});
