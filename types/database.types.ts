// ============================================================
// Supabase Database 型定義
// ------------------------------------------------------------
// このファイルは Supabase CLI で自動生成できます:
//   npm run types:gen
// （実体は `supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID"`）
//
// まだ gen していない間のプレースホルダとして、
// 本プロジェクトで実際に使う最小限の型を手書きしています。
// ============================================================

export type Role = "admin" | "respondent";

export interface ProfileRow {
  id: string;
  email: string;
  role: Role;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

// ResponseRow:
//   - access_token   : 回答者用 URL に埋める推測困難な文字列（ユニーク）
//   - label          : 管理画面で表示する任意のラベル（メモ）
//   - user_id        : 旧スキーマで残った admin 用紐付け。回答者用は null
//   - is_revoked     : 管理者が無効化したフラグ
//   - created_by     : 発行した admin の profile id
export interface ResponseRow {
  id: string;
  access_token: string;
  label: string | null;
  user_id: string | null;
  data: AssessmentState;
  is_submitted: boolean;
  is_revoked: boolean;
  created_by: string | null;
  started_at: string;
  updated_at: string;
  submitted_at: string | null;
}

// ------------------------------------------------------------
// `responses.data` の JSONB 中身。UI 側の state と一致させる。
// ここは質問を増減するたびにキーを足すのではなく、
// 「自由入力できる dict」として緩めに持っておく。
// ------------------------------------------------------------
export interface AssessmentState {
  orgs: {
    past: string[]; // 長さ 3
    current: string[]; // 長さ 3
  };
  frequencies: {
    past: Record<string, number>;
    current: Record<string, number>;
  };
  dimensions: {
    past: Record<string, Record<string, number>>;
    current: Record<string, Record<string, number>>;
  };
  identityStrength: {
    past: Record<string, Record<string, number>>;
    current: Record<string, Record<string, number>>;
  };
  dialogue: Record<string, string>;
  actions: {
    craftExperiments: string;
    shiftConnections: string;
    makeSense: string;
  };
  meta: {
    step: number;
    subStep: number;
    updatedAt: string;
  };
}

// ------------------------------------------------------------
// Supabase JS client 用の Database 型
// （自動生成後はこのブロックを差し替え）
// ------------------------------------------------------------
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & Pick<ProfileRow, "id" | "email">;
        Update: Partial<ProfileRow>;
      };
      responses: {
        Row: ResponseRow;
        Insert: Partial<ResponseRow> & Pick<ResponseRow, "access_token">;
        Update: Partial<ResponseRow>;
      };
    };
    Functions: {
      is_admin: {
        Args: { uid?: string };
        Returns: boolean;
      };
    };
  };
};
