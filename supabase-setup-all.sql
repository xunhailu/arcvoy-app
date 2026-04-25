-- =============================================
-- ARCVOY — FULL DATABASE SETUP
-- Paste this entire file into Supabase → SQL Editor → Run
-- =============================================


-- ── APPLICATIONS TABLE ──────────────────────

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  first_name text not null,
  last_name text not null,
  email text not null,
  dob date,
  address text,
  city text,
  state text,
  zip text,
  country text,
  linkedin text,
  lang1 text,
  lang2 text,
  job_id integer not null,
  job_title text not null,
  job_dept text not null,
  job_type text not null,
  cv_path text,
  cv_filename text,
  status text default 'applied' check (
    status in ('applied','reviewing','interviewed','offered','hired','rejected')
  ),
  notes text default '',
  confirmation_sent boolean default false,
  status_email_sent boolean default false
);

alter table applications enable row level security;

drop policy if exists "Anyone can apply"       on applications;
drop policy if exists "Admin can read all"      on applications;
drop policy if exists "Admin can update"        on applications;
drop policy if exists "Admin can delete"        on applications;
drop policy if exists "Candidates read own"     on applications;

create policy "Anyone can apply"
  on applications for insert
  with check (true);

create policy "Admin can read all"
  on applications for select
  using (auth.email() = 'admin@arcvoy.com');

create policy "Admin can update"
  on applications for update
  using (auth.email() = 'admin@arcvoy.com');

create policy "Admin can delete"
  on applications for delete
  using (auth.email() = 'admin@arcvoy.com');

create policy "Candidates read own"
  on applications for select
  using (email = auth.email());


-- ── STORAGE: CV UPLOADS ──────────────────────

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

drop policy if exists "Anyone can upload CV" on storage.objects;
drop policy if exists "Admin can view CVs"   on storage.objects;

create policy "Anyone can upload CV"
  on storage.objects for insert
  with check (bucket_id = 'cvs');

create policy "Admin can view CVs"
  on storage.objects for select
  using (bucket_id = 'cvs' and auth.role() = 'authenticated');


-- ── TICKETS TABLE ────────────────────────────

create table if not exists tickets (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name       text not null,
  email      text not null,
  category   text not null,
  subject    text not null,
  message    text not null,
  status     text not null default 'open'
);

alter table tickets enable row level security;

drop policy if exists "Public can insert tickets" on tickets;
drop policy if exists "Admin can read tickets"    on tickets;
drop policy if exists "Admin can update tickets"  on tickets;

create policy "Public can insert tickets"
  on tickets for insert
  with check (true);

create policy "Admin can read tickets"
  on tickets for select
  using (auth.email() = 'admin@arcvoy.com');

create policy "Admin can update tickets"
  on tickets for update
  using (auth.email() = 'admin@arcvoy.com');


-- ── SUBSCRIBERS TABLE ────────────────────────

create table if not exists subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz default now()
);

alter table subscribers enable row level security;

drop policy if exists "Anyone can subscribe"       on subscribers;
drop policy if exists "Admin can read subscribers" on subscribers;

create policy "Anyone can subscribe"
  on subscribers for insert
  with check (true);

create policy "Admin can read subscribers"
  on subscribers for select
  using (auth.email() = 'admin@arcvoy.com');


-- ── BOOKMARKS TABLE ──────────────────────────

create table if not exists bookmarks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  job_id     integer not null,
  created_at timestamptz default now(),
  unique (user_id, job_id)
);

alter table bookmarks enable row level security;

drop policy if exists "Users manage own bookmarks" on bookmarks;

create policy "Users manage own bookmarks"
  on bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
