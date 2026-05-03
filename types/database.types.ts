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

export interface InvitationRow {
  id: string;
  email: string;
  status: "pending" | "accepted" | "revoked";
  note: string | null;
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
}

export interface ResponseRow {
  id: string;
  user_id: string;
  data: AssessmentState;
  is_submitted: boolean;
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
      invitations: {
        Row: InvitationRow;
        Insert: Partial<InvitationRow> & Pick<InvitationRow, "email">;
        Update: Partial<InvitationRow>;
      };
      responses: {
        Row: ResponseRow;
        Insert: Partial<ResponseRow> & Pick<ResponseRow, "user_id">;
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
