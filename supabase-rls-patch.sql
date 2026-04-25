-- =============================================
-- RLS SECURITY PATCH — run this in Supabase → SQL Editor
-- Fixes: all authenticated users could read all applications
-- =============================================

-- Drop the over-broad policies
drop policy if exists "Admin can read all"  on applications;
drop policy if exists "Admin can update"    on applications;
drop policy if exists "Admin can delete"    on applications;

-- Admin-only policies (scoped to admin@arcvoy.com)
create policy "Admin can read all"
  on applications for select
  using (auth.email() = 'admin@arcvoy.com');

create policy "Admin can update"
  on applications for update
  using (auth.email() = 'admin@arcvoy.com');

create policy "Admin can delete"
  on applications for delete
  using (auth.email() = 'admin@arcvoy.com');

-- Candidates can only see their own applications
create policy "Candidates read own"
  on applications for select
  using (email = auth.email());
