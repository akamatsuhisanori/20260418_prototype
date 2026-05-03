-- ============================================================
-- 0002_remove_respondent_login
--   回答者ログインを廃止し、トークン付き URL 方式に移行する。
--
--   変更点:
--     * invitations テーブルを廃止（メール招待をやめる）
--     * responses に access_token / label / is_revoked を追加
--     * responses.user_id を nullable に変更（回答者は auth.users に紐付かない）
--     * responses の unique(user_id) を解除（同一 admin が複数行を発行しうる）
--     * RLS は admin フルアクセスのみ。回答者は service_role 経由のサーバー API でアクセス
--     * handle_new_user トリガから invitations 連動部分を除去
-- ============================================================

-- ---- 既存ポリシー破棄 -------------------------------------
drop policy if exists "responses: self can read"        on public.responses;
drop policy if exists "responses: self can insert"      on public.responses;
drop policy if exists "responses: self can update"      on public.responses;
drop policy if exists "responses: admin can update any" on public.responses;
drop policy if exists "responses: admin can delete"     on public.responses;
drop policy if exists "invitations: admin full access"  on public.invitations;

-- ---- invitations 廃止 ------------------------------------
drop table if exists public.invitations cascade;

-- ---- handle_new_user から invitations 参照を削除 ---------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_email text := coalesce(current_setting('app.admin_email', true), '');
  v_role text := 'respondent';
begin
  if v_admin_email <> '' and new.email = v_admin_email then
    v_role := 'admin';
  end if;

  insert into public.profiles (id, email, role)
  values (new.id, new.email, v_role)
  on conflict (id) do nothing;

  return new;
end;
$$;

-- ---- responses スキーマ更新 -------------------------------
alter table public.responses
  add column if not exists access_token text,
  add column if not exists label        text,
  add column if not exists is_revoked   boolean not null default false,
  add column if not exists created_by   uuid references public.profiles(id) on delete set null;

-- 既存行に token を埋める（プロトタイプ移行のため適当な値で OK）
update public.responses
   set access_token = encode(gen_random_bytes(24), 'hex')
 where access_token is null;

-- 制約を更新
alter table public.responses
  alter column access_token set not null;

-- user_id は nullable に（回答者用の行は user_id なし）
alter table public.responses
  alter column user_id drop not null;

-- 旧 unique(user_id) 制約を解除（自動付与名は環境依存。情報スキーマから探して落とす）
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.responses'::regclass
       and contype = 'u'
       and pg_get_constraintdef(oid) ilike '%(user_id)%'
  loop
    execute format('alter table public.responses drop constraint %I', c.conname);
  end loop;
end$$;

create unique index if not exists responses_access_token_uidx
  on public.responses (access_token);

create index if not exists responses_is_revoked_idx
  on public.responses (is_revoked);

-- ---- RLS（admin だけ。回答者は service_role 経由で API 利用）----
drop policy if exists "responses: admin full access" on public.responses;
create policy "responses: admin full access"
  on public.responses for all
  using (public.is_admin())
  with check (public.is_admin());
