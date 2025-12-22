-- Password Locker Database Schema
-- Run this in your Supabase SQL Editor

-- Create password_vaults table
create table if not exists password_vaults (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  name text not null,
  encrypted_password text not null,
  iv text not null,
  salt text not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table password_vaults enable row level security;

-- RLS Policy: Users can only access their own vaults
create policy "Users can view own vaults"
  on password_vaults for select
  using (auth.uid() = user_id);

create policy "Users can insert own vaults"
  on password_vaults for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vaults"
  on password_vaults for update
  using (auth.uid() = user_id);

create policy "Users can delete own vaults"
  on password_vaults for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists password_vaults_user_id_idx on password_vaults(user_id);

