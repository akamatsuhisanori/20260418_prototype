// ============================================================
// useIsAdmin
//   現在ログインしているユーザが profiles.role = 'admin' か判定する
//   Composable。初回呼び出し時に 1 回だけ Supabase に問い合わせ、
//   useState でセッション中にキャッシュする。
// ============================================================
import type { Database } from "~/types/database.types";

export const useIsAdmin = () => {
  const state = useState<boolean | null>("reroots-is-admin", () => null);
  const user = useSupabaseUser();
  const supabase = useSupabaseClient<Database>();

  const refresh = async () => {
    if (!user.value) {
      state.value = false;
      return false;
    }
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.value.id)
      .maybeSingle();
    if (error) {
      console.error("[useIsAdmin]", error);
      state.value = false;
      return false;
    }
    state.value = data?.role === "admin";
    return state.value;
  };

  // auto-fetch 1 回
  if (state.value === null && user.value) {
    refresh();
  }

  return {
    isAdmin: computed(() => state.value === true),
    refresh,
  };
};
