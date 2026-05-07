-- Add government ID columns to the applications table
-- Run this in the Supabase SQL editor if the table already exists

alter table applications
  add column if not exists id_path text,
  add column if not exists id_filename text;
