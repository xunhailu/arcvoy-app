-- Run this in Supabase → SQL Editor

create table if not exists bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  job_id     integer not null,
  created_at timestamptz default now(),
  unique (user_id, job_id)
);

alter table bookmarks enable row level security;

create policy "Users manage own bookmarks"
  on bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
