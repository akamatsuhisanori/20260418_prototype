// ============================================================
// /api/admin/check
//   クライアントから現在のユーザが admin か手軽に確認するため。
//   server 側で profiles.role を引く（RLS を気にせずに済む）。
// ============================================================
import { getSupabaseAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  if (!user) return { isAdmin: false, reason: "not_logged_in" };

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) return { isAdmin: false, reason: "error" };
  return { isAdmin: data?.role === "admin" };
});
