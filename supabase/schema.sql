-- ==============================================================================
-- RetailRadar AI — Complete PostgreSQL Database Schema with Row-Level Security
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked to auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text not null,
  role text default 'Retail Entrepreneur',
  org text default 'Independent',
  scoring_weights jsonb default '{"D": 0.30, "C": 0.20, "A": 0.20, "R": 0.20, "P": 0.10}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ANALYSES TABLE
create table if not exists public.analyses (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  status text not null check (status in ('draft', 'active', 'concluded')),
  profile jsonb not null,
  budget jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CANDIDATE LOCATIONS TABLE
create table if not exists public.candidate_locations (
  id text primary key,
  analysis_id text references public.analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  address text not null,
  micro text not null,
  lat double precision not null,
  lng double precision not null,
  metrics jsonb not null,
  financials jsonb not null,
  risks jsonb default '[]'::jsonb,
  missing_info jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. NEARBY BUSINESSES TABLE
create table if not exists public.nearby_businesses (
  id text primary key,
  location_id text references public.candidate_locations(id) on delete cascade not null,
  analysis_id text references public.analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  lat double precision not null,
  lng double precision not null,
  distance_m integer not null default 0,
  source text not null check (source in ('open-data', 'demo-survey', 'user-added')),
  status text not null check (status in ('verified', 'field-observed', 'unverified')),
  competitor boolean not null default false,
  note text,
  added_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. WHAT-IF SCENARIOS TABLE
create table if not exists public.scenarios (
  id text primary key,
  analysis_id text references public.analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  base_location_id text not null,
  name text not null,
  patch jsonb not null,
  note text,
  saved_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. FIELD CHECKLIST ITEMS TABLE
create table if not exists public.checklist_items (
  id text primary key,
  analysis_id text references public.analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  group_name text not null,
  label text not null,
  hint text,
  state text not null check (state in ('pending', 'confirmed', 'issue')),
  note text default '',
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. ACTIVITY LOG TABLE
create table if not exists public.activity_logs (
  id text primary key,
  analysis_id text references public.analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  actor text not null,
  text text not null,
  kind text not null check (kind in ('create', 'edit', 'verify', 'finance', 'report', 'system')),
  at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. SAVED REPORTS TABLE
create table if not exists public.saved_reports (
  id text primary key,
  analysis_id text references public.analyses(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  verdict text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
create index if not exists idx_analyses_user on public.analyses(user_id);
create index if not exists idx_locations_analysis on public.candidate_locations(analysis_id);
create index if not exists idx_locations_user on public.candidate_locations(user_id);
create index if not exists idx_nearby_location on public.nearby_businesses(location_id);
create index if not exists idx_scenarios_analysis on public.scenarios(analysis_id);
create index if not exists idx_checklist_analysis on public.checklist_items(analysis_id);
create index if not exists idx_activity_analysis on public.activity_logs(analysis_id);
create index if not exists idx_reports_user on public.saved_reports(user_id);

-- ==============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- Ensures each authenticated user only accesses their own records.
-- ==============================================================================
alter table public.profiles enable row level security;
alter table public.analyses enable row level security;
alter table public.candidate_locations enable row level security;
alter table public.nearby_businesses enable row level security;
alter table public.scenarios enable row level security;
alter table public.checklist_items enable row level security;
alter table public.activity_logs enable row level security;
alter table public.saved_reports enable row level security;

-- Profiles: user can read and update their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Analyses
create policy "Users can view own analyses" on public.analyses
  for select using (auth.uid() = user_id);

create policy "Users can insert own analyses" on public.analyses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own analyses" on public.analyses
  for update using (auth.uid() = user_id);

create policy "Users can delete own analyses" on public.analyses
  for delete using (auth.uid() = user_id);

-- Candidate Locations
create policy "Users can view own locations" on public.candidate_locations
  for select using (auth.uid() = user_id);

create policy "Users can insert own locations" on public.candidate_locations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own locations" on public.candidate_locations
  for update using (auth.uid() = user_id);

create policy "Users can delete own locations" on public.candidate_locations
  for delete using (auth.uid() = user_id);

-- Nearby Businesses
create policy "Users can view own nearby businesses" on public.nearby_businesses
  for select using (auth.uid() = user_id);

create policy "Users can insert own nearby businesses" on public.nearby_businesses
  for insert with check (auth.uid() = user_id);

create policy "Users can update own nearby businesses" on public.nearby_businesses
  for update using (auth.uid() = user_id);

create policy "Users can delete own nearby businesses" on public.nearby_businesses
  for delete using (auth.uid() = user_id);

-- Scenarios
create policy "Users can view own scenarios" on public.scenarios
  for select using (auth.uid() = user_id);

create policy "Users can insert own scenarios" on public.scenarios
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own scenarios" on public.scenarios
  for delete using (auth.uid() = user_id);

-- Checklist Items
create policy "Users can view own checklist items" on public.checklist_items
  for select using (auth.uid() = user_id);

create policy "Users can insert own checklist items" on public.checklist_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update own checklist items" on public.checklist_items
  for update using (auth.uid() = user_id);

-- Activity Logs
create policy "Users can view own activity logs" on public.activity_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert own activity logs" on public.activity_logs
  for insert with check (auth.uid() = user_id);

-- Saved Reports
create policy "Users can view own saved reports" on public.saved_reports
  for select using (auth.uid() = user_id);

create policy "Users can insert own saved reports" on public.saved_reports
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own saved reports" on public.saved_reports
  for delete using (auth.uid() = user_id);

-- ==============================================================================
-- TRIGGER FOR AUTOMATIC PROFILE CREATION ON SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, role, org)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'Retail Entrepreneur'),
    coalesce(new.raw_user_meta_data->>'org', 'Independent')
  )
  on conflict (id) do update set
    email = excluded.email,
    name = excluded.name;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
