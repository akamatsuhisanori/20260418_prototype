-- ============================================================
-- 0003_relax_identifier_check
--   responses にあった既存の "responses_identifier_present" CHECK 制約を、
--   access_token だけで一意識別する新仕様に合わせて差し替える。
--
--   旧制約は user_id（または email 等）が必須になっていたため、
--   トークンのみで作る回答者行が CHECK 違反になっていた。
-- ============================================================

-- 旧制約があれば削除
alter table public.responses
  drop constraint if exists responses_identifier_present;

-- 新制約: access_token は必ず存在する
-- （列定義の NOT NULL で担保済みだが念のため CHECK でも明示）
alter table public.responses
  add constraint responses_identifier_present
  check (access_token is not null and length(access_token) >= 16);
