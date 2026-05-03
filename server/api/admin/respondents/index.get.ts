// ============================================================
// GET /api/admin/respondents
//   発行済みの回答者リストを返す（admin 専用）。
// ============================================================
import { getSupabaseAdmin, requireAdmin } from "~/server/utils/supabase-admin";

export default defineEventHandler(async (event) => {
  try {
    await requireAdmin(event);
    const admin = getSupabaseAdmin();
    const { data, error } = await admin
      .from("responses")
      .select(
        "id, access_token, label, is_submitted, is_revoked, started_at, updated_at, submitted_at",
      )
      .order("started_at", { ascending: false });
    if (error) {
      console.error("[GET /api/admin/respondents] supabase error:", error);
      throw createError({
        statusCode: 500,
        statusMessage: `db: ${error.message}`,
        data: { code: error.code, details: error.details, hint: error.hint },
      });
    }
    return data ?? [];
  } catch (err: any) {
    // statusCode を持つもの (createError) はそのまま再 throw、
    // それ以外は素の Error なので message を付けて 500 に変換
    if (err?.statusCode) throw err;
    console.error("[GET /api/admin/respondents] unhandled:", err);
    throw createError({
      statusCode: 500,
      statusMessage: `unhandled: ${err?.message || String(err)}`,
    });
  }
});
