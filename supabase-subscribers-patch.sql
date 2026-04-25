-- =============================================
-- SUBSCRIBERS TABLE — run in Supabase → SQL Editor
-- Stores newsletter sign-ups from the home page
-- =============================================

create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz default now()
);

alter table subscribers enable row level security;

-- Anyone can subscribe (public insert)
create policy "Anyone can subscribe"
  on subscribers for insert
  with check (true);

-- Only admin can read the list
create policy "Admin can read subscribers"
  on subscribers for select
  using (auth.email() = 'admin@arcvoy.com');
