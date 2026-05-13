// ============================================================
// Supabase Database 型定義
// ------------------------------------------------------------
// 仕様書 v1 に基づく 6 ブロック構成の AssessmentState を表現する。
// `responses.data` は jsonb で柔軟に保存するため、ここで定義した型は
// あくまで TypeScript 側の補助。
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
// 新仕様 AssessmentState（仕様書 v1）
// ------------------------------------------------------------

// ブロック 1: 所属組織のリスト
export interface Organization {
  id: number;
  name: string;
  tag: "past" | "current";
}

// 詳細記述 + 一言表現
export interface Axis {
  detail: string;
  summary: string;
}

export interface Triad {
  who: Axis;
  why: Axis;
  what: Axis;
}

// ブロック 6 のギャップ判定
export interface GapItem {
  hasGap: boolean | null; // null = 未回答
  action: string;
}

export interface AssessmentState {
  // ---------- ブロック 1 ----------
  organizations: Organization[];

  // ---------- ブロック 2 ----------
  // scores: orgId → 6 項目の 1-5 評価。0 は未回答扱い
  scores: Record<string, number[]>;
  // 重要組織として確定された orgId
  selectedOrgId: number | null;
  // false = 自動選定、true = ユーザが手動で選び直した
  selectedOrgManual: boolean;

  // ---------- ブロック 3 ----------
  // 選んだ写真について書き出す
  //   - photoDescription      : 何が映っているか / 場所 / 状況 / 人 / 気持ち
  //   - photoReason           : なぜその写真を選んだか
  //   - photoHesitation       : 写真選びで迷った度合い（1-7、0 = 未回答）
  //   - photoSelectionSeconds : Step 2 の写真選定画面に滞在した累積秒数
  block3: {
    photoDescription: string;
    photoReason: string;
    photoHesitation: number;
    photoSelectionSeconds: number;
  };

  // ---------- ブロック 4 ----------
  block4: Triad;

  // ---------- ブロック 5 ----------
  coreStatement: string;

  // ---------- ブロック 6 ----------
  block6: {
    current: Triad;
    future: Triad;
    gaps: {
      who: GapItem;
      why: GapItem;
      what: GapItem;
    };
  };

  // ---------- Step 6（明日からの実践シーン） ----------
  step6: {
    scenes: string[]; // 1-10 件
  };
  // Step 6 を完了した日（ISO 文字列）。Step 7 の Day 番号を算出する基準
  step6CompletedAt: string | null;

  // ---------- Step 7（1 週間ワーク） ----------
  step7: {
    records: Step7Record[];
  };

  // ---------- Step 8（振り返りワーク） ----------
  step8: Step8Review;

  // ---------- 進捗 ----------
  meta: {
    step: number; // 0 = イントロ, 1..6 = 各 Step（Step 6 含む）, 7 = 完了画面
    subStep: number;
    updatedAt: string;
  };
}

export interface Step7Record {
  dayNumber: number; // 1..7
  targetDate: string; // YYYY-MM-DD
  q1TodayAchieved: string;
  q1NoneFlag: boolean;
  q2FuturePossible: string;
  q3TomorrowGoal: string;
  firstSubmittedAt: string | null;
  lastUpdatedAt: string | null;
}

export interface Step8Review {
  q1CommonPatterns: string;
  q2NewAwareness: string;
  q3CurrentEnvPossibilities: string;
  q4EnvironmentDesign: string;
  q5NewOpportunities: string;
  q5NoneFlag: boolean;
  q6OneLine: string;
  submittedAt: string | null;
}

// ------------------------------------------------------------
// Supabase JS client 用の Database 型
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
