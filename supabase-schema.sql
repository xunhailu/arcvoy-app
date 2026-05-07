-- =============================================
-- ARCVOY ATS DATABASE SCHEMA
-- Run this in Supabase → SQL Editor → New query
-- =============================================

-- Applications table
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- Personal
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

  -- Job info
  job_id integer not null,
  job_title text not null,
  job_dept text not null,
  job_type text not null,

  -- CV file (optional)
  cv_path text,
  cv_filename text,

  -- Government ID (required at upload time)
  id_path text,
  id_filename text,

  -- Status tracking
  status text default 'applied' check (
    status in ('applied','reviewing','interviewed','offered','hired','rejected')
  ),

  -- Admin notes
  notes text default '',

  -- Email flags
  confirmation_sent boolean default false,
  status_email_sent boolean default false
);

-- Enable Row Level Security
alter table applications enable row level security;

-- Allow anyone to INSERT (applicants submitting forms)
create policy "Anyone can apply"
  on applications for insert
  with check (true);

-- Admin (admin@arcvoy.com) can read/update/delete all applications
create policy "Admin can read all"
  on applications for select
  using (auth.email() = 'admin@arcvoy.com');

create policy "Admin can update"
  on applications for update
  using (auth.email() = 'admin@arcvoy.com');

create policy "Admin can delete"
  on applications for delete
  using (auth.email() = 'admin@arcvoy.com');

-- Candidates can only read their own applications
create policy "Candidates read own"
  on applications for select
  using (email = auth.email());

-- =============================================
-- STORAGE: CV uploads bucket
-- =============================================
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- Allow anyone to upload a CV
create policy "Anyone can upload CV"
  on storage.objects for insert
  with check (bucket_id = 'cvs');

-- Only authenticated admin can view/download CVs
create policy "Admin can view CVs"
  on storage.objects for select
  using (bucket_id = 'cvs' and auth.role() = 'authenticated');

-- =============================================
-- ADMIN USER
-- Go to Supabase → Authentication → Users → Add user
-- Email: admin@arcvoy.com  Password: (choose a strong one)
-- =============================================
