-- Run this in your Supabase SQL editor

create table if not exists tickets (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  name        text not null,
  email       text not null,
  category    text not null,
  subject     text not null,
  message     text not null,
  status      text not null default 'open'  -- open | in_progress | resolved | closed
);

-- Enable RLS
alter table tickets enable row level security;

-- Anyone can submit a ticket
create policy "Public can insert tickets"
  on tickets for insert
  with check (true);

-- Only admin can read tickets
create policy "Admin can read tickets"
  on tickets for select
  using (auth.email() = 'admin@arcvoy.com');

-- Only admin can update ticket status
create policy "Admin can update tickets"
  on tickets for update
  using (auth.email() = 'admin@arcvoy.com');
