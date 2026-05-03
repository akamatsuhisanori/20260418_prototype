// ============================================================
// supabase-admin.ts
//   service_role key を使った Supabase クライアントを作る。
//   これはサーバー側でしか使ってはいけない（RLS をバイパスするため）。
//
//   env:
//     SUPABASE_URL                — anon と共用
//     SUPABASE_SERVICE_ROLE_KEY   — server only
// ============================================================
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverSupabaseUser } from "#supabase/server";
import type { Database } from "~/types/database.types";

let cached: SupabaseClient<Database> | null = null;

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  if (cached) return cached;
  const config = useRuntimeConfig();
  const url = process.env.SUPABASE_URL || (config as any).public?.supabase?.url || "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    (config.supabaseServiceRoleKey as string) ||
    "";
  if (!url) {
    throw createError({
      statusCode: 500,
      statusMessage: "config: SUPABASE_URL が未設定です",
    });
  }
  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage:
        "config: SUPABASE_SERVICE_ROLE_KEY が未設定です（Vercel 環境変数を確認）",
    });
  }
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
  if (error) {
    console.error("[requireAdmin] profiles lookup error:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `requireAdmin db: ${error.message}`,
    });
  }
  if (data?.role !== "admin") {
    throw createError({
      statusCode: 403,
      statusMessage: "管理者のみアクセス可能です",
    });
  }
  return user;
};
