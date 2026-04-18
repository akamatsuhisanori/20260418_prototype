-- ============================================================
-- Re:roots — initial schema
--   * profiles          : 1 row per auth.user (role = 'admin' | 'respondent')
--   * invitations       : 招待メール単位（Magic Link）
--   * responses         : 回答は JSONB 1 行（UI の state を丸ごと保存）
--
-- 方針:
--   - 回答フォームは自然言語で頻繁に書き換えたいので、
--     answers を列として正規化せず JSONB で保持する。
--     CSV/Excel 出力時に JSONB を展開する。
--   - すべてのテーブルで Row Level Security を有効化する。
--   - admin 判定は profiles.role = 'admin' を見る is_admin() に集約。
--   - 初回サインアップ時は trigger で profile を作り、
--     メールアドレスが ADMIN_EMAIL と一致する場合だけ admin に昇格する。
-- ============================================================

-- ------------------------------------------------------------
-- extensions
-- ------------------------------------------------------------
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- profiles
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text unique not null,
  role        text not null default 'respondent' check (role in ('admin', 'respondent')),
  display_name text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);

-- ------------------------------------------------------------
-- invitations
--   admin だけが発行する。status の遷移:
--     pending -> accepted (ログインされたとき)
--     pending -> revoked  (admin が取り消したとき)
-- ------------------------------------------------------------
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  email       text unique not null,
  status      text not null default 'pending' check (status in ('pending','accepted','revoked')),
  note        text,
  invited_by  uuid references public.profiles(id) on delete set null,
  invited_at  timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists invitations_status_idx on public.invitations (status);

-- ------------------------------------------------------------
-- responses
--   1 人 1 行。自分の data を上書きしながら保存していく。
--   data の中身は UI の state JSON（orgs / frequencies / dimensions / dialogue / actions ...）
-- ------------------------------------------------------------
create table if not exists public.responses (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique not null references public.profiles(id) on delete cascade,
  data         jsonb not null default '{}'::jsonb,
  is_submitted boolean not null default false,
  started_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists responses_submitted_idx on public.responses (is_submitted);

-- ------------------------------------------------------------
-- updated_at を自動更新するトリガ
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_responses_updated on public.responses;
create trigger trg_responses_updated
  before update on public.responses
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- is_admin() — RLS ポリシーから呼ぶユーティリティ
-- SECURITY DEFINER で profiles を参照（RLS に遮られないように）
-- ------------------------------------------------------------
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = uid and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- 新規 auth.users 行ができたときに profile を自動作成し、
-- 招待リストに載っていれば accepted に、
-- さらに admin_email と一致すれば admin に昇格させるトリガ。
--
-- admin_email は `supabase_functions.admin_email` という DB カスタム設定に入れる。
-- ローカル/本番のマイグレーション前に
--   alter database postgres set app.admin_email = 'you@example.com';
-- のように設定するか、Nuxt 側サーバー API からのログイン時フォールバックで昇格する。
-- ------------------------------------------------------------
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

  -- 招待テーブルを accepted に
  update public.invitations
     set status = 'accepted',
         accepted_at = now()
   where email = new.email
     and status = 'pending';

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.invitations enable row level security;
alter table public.responses   enable row level security;

-- ----- profiles -----
-- 自分の行は読める / 更新できる（role は変えられない：別ポリシーで弾く）
drop policy if exists "profiles: self can read" on public.profiles;
create policy "profiles: self can read"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles: self can update display_name" on public.profiles;
create policy "profiles: self can update display_name"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

drop policy if exists "profiles: admin can update any" on public.profiles;
create policy "profiles: admin can update any"
  on public.profiles for update
  using (public.is_admin())
  with check (public.is_admin());

-- insert はトリガ経由（security definer）以外禁止。明示的に許可しない。

-- ----- invitations -----
drop policy if exists "invitations: admin full access" on public.invitations;
create policy "invitations: admin full access"
  on public.invitations for all
  using (public.is_admin())
  with check (public.is_admin());

-- 一般ユーザは読み書き不可（admin だけ）

-- ----- responses -----
drop policy if exists "responses: self can read" on public.responses;
create policy "responses: self can read"
  on public.responses for select
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "responses: self can insert" on public.responses;
create policy "responses: self can insert"
  on public.responses for insert
  with check (user_id = auth.uid());

drop policy if exists "responses: self can update" on public.responses;
create policy "responses: self can update"
  on public.responses for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "responses: admin can update any" on public.responses;
create policy "responses: admin can update any"
  on public.responses for update
  using (public.is_admin())
  with check (public.is_admin());

-- 削除は admin のみ
drop policy if exists "responses: admin can delete" on public.responses;
create policy "responses: admin can delete"
  on public.responses for delete
  using (public.is_admin());
