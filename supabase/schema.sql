-- interview-dojo 学習履歴のテーブル(仕様書「データ設計と同期」)
-- どのテーブルも本人の行しか読み書きできない(RLS)

create table if not exists public.card_states (
  user_id      uuid        not null references auth.users (id) on delete cascade,
  card_id      text        not null,
  status       text        not null default 'new' check (status in ('new', 'learning', 'known')),
  due_on       date,
  streak       integer     not null default 0,
  card_version integer     not null default 1,
  updated_at   timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.reviews (
  id          bigint generated always as identity primary key,
  user_id     uuid        not null references auth.users (id) on delete cascade,
  card_id     text        not null,
  grade       text        not null check (grade in ('good', 'unsure', 'forgot')),
  reviewed_at timestamptz not null default now()
);
create index if not exists reviews_user_time on public.reviews (user_id, reviewed_at desc);

create table if not exists public.attempts (
  id           bigint generated always as identity primary key,
  user_id      uuid        not null references auth.users (id) on delete cascade,
  kind         text        not null check (kind in ('fermi', 'case')),
  question_id  text        not null,
  answer       text,
  self_score   jsonb,
  ai_feedback  text,
  duration_sec integer,
  created_at   timestamptz not null default now()
);
create index if not exists attempts_user_time on public.attempts (user_id, created_at desc);

alter table public.card_states enable row level security;
alter table public.reviews     enable row level security;
alter table public.attempts    enable row level security;

drop policy if exists "own rows" on public.card_states;
create policy "own rows" on public.card_states
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own rows" on public.reviews;
create policy "own rows" on public.reviews
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own rows" on public.attempts;
create policy "own rows" on public.attempts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
