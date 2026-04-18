// ============================================================
// supabase-admin.ts
//   service_role key を使った Supabase クライアントを作る。
//   これはサーバー側でしか使ってはいけない（RLS をバイパスするため）。
//
//   runtimeConfig.supabaseServiceRoleKey は Nuxt の server-only。
//   SUPABASE_SERVICE_ROLE_KEY 環境変数から Vercel 側でセットする。
// ============================================================
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database.types";

let cached: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (cached) return cached;
  const config = useRuntimeConfig();
  const url = process.env.SUPABASE_URL;
  const key = config.supabaseServiceRoleKey;
  if (!url) throw new Error("SUPABASE_URL が未設定です");
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY が未設定です");
  cached = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
};

// ログインしているユーザが admin かをチェックするユーティリティ
export const requireAdmin = async (event: import("h3").H3Event) => {
  const user = await serverSupabaseUser(event);
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "未ログインです" });
  }
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (error || data?.role !== "admin") {
    throw createError({ statusCode: 403, statusMessage: "管理者のみアクセス可能です" });
  }
  return user;
};
