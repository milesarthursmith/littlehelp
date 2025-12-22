-- Password Locker Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- PASSWORD VAULTS TABLE
-- ============================================
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

-- ============================================
-- SCHEDULED UNLOCKS TABLE
-- ============================================
-- Allows users to set time windows when passwords can be retrieved without challenge
create table if not exists scheduled_unlocks (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references password_vaults on delete cascade not null,
  user_id uuid references auth.users not null,
  day_of_week int not null check (day_of_week >= 0 and day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
  start_time time not null,
  end_time time not null,
  enabled boolean default true,
  created_at timestamptz default now()
);

alter table scheduled_unlocks enable row level security;

create policy "Users can view own schedules"
  on scheduled_unlocks for select
  using (auth.uid() = user_id);

create policy "Users can insert own schedules"
  on scheduled_unlocks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own schedules"
  on scheduled_unlocks for update
  using (auth.uid() = user_id);

create policy "Users can delete own schedules"
  on scheduled_unlocks for delete
  using (auth.uid() = user_id);

create index if not exists scheduled_unlocks_vault_id_idx on scheduled_unlocks(vault_id);

-- ============================================
-- EMERGENCY ACCESS REQUESTS TABLE
-- ============================================
-- Tracks emergency access requests with a delay period
create table if not exists emergency_access_requests (
  id uuid primary key default gen_random_uuid(),
  vault_id uuid references password_vaults on delete cascade not null,
  user_id uuid references auth.users not null,
  requested_at timestamptz default now(),
  unlock_at timestamptz not null, -- When the password becomes available
  completed_at timestamptz, -- When user actually retrieved it
  cancelled boolean default false,
  created_at timestamptz default now()
);

alter table emergency_access_requests enable row level security;

create policy "Users can view own emergency requests"
  on emergency_access_requests for select
  using (auth.uid() = user_id);

create policy "Users can insert own emergency requests"
  on emergency_access_requests for insert
  with check (auth.uid() = user_id);

create policy "Users can update own emergency requests"
  on emergency_access_requests for update
  using (auth.uid() = user_id);

create index if not exists emergency_access_vault_id_idx on emergency_access_requests(vault_id);

-- ============================================
-- USER SUBSCRIPTIONS TABLE (for Stripe)
-- ============================================
create table if not exists user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free', -- 'free', 'premium'
  status text default 'active', -- 'active', 'cancelled', 'past_due'
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table user_subscriptions enable row level security;

create policy "Users can view own subscription"
  on user_subscriptions for select
  using (auth.uid() = user_id);

-- Only allow inserts/updates via service role (Stripe webhooks)
-- No insert/update policies for regular users

create index if not exists user_subscriptions_user_id_idx on user_subscriptions(user_id);
create index if not exists user_subscriptions_stripe_customer_idx on user_subscriptions(stripe_customer_id);
