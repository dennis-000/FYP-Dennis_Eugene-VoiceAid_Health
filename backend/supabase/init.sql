-- ==========================================
-- VOICEAID HEALTH - SUPABASE SCHEMA (v1)
-- ==========================================
-- Implements "Netflix-Style" RBAC Hierarchy:
-- Organization -> Therapist -> Patient (Profile)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. ORGANIZATIONS (Hospitals/Clinics)
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  plan text default 'free', -- free, pro, enterprise
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PROFILES (Extends auth.users)
-- Managed by RLS. Therapists & Admins have a profile linked to their auth user.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'therapist', 'independent_patient')),
  organization_id uuid references organizations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. PATIENTS (The "Managed Profiles")
-- These can be linked to a real user (independent) OR managed by a therapist (no auth user initially).
create table patients (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  
  -- Hierarchy Links
  therapist_id uuid references profiles(id), -- The "Parent" profile (Therapist)
  organization_id uuid references organizations(id),
  
  -- If this patient claims their account later, we link to auth.users
  auth_user_id uuid references auth.users(id),
  
  -- Guest / Config
  is_guest boolean default false,
  language_preference text default 'en', -- en, tw, ga
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. THERAPY TASKS (Content)
create table tasks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  category text, -- therapy, medication, exercise
  language text default 'en',
  
  -- Creator (System tasks have null creator, or we check role)
  created_by_therapist_id uuid references profiles(id),
  is_public boolean default false, -- If true, available to all therapists in org (or global)
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ASSIGNMENTS (Linking Tasks to Patients)
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id) on delete cascade,
  task_id uuid references tasks(id) on delete cascade,
  
  -- Scheduling
  scheduled_date date,
  days_of_week int[], -- 0=Sun, 1=Mon...
  
  -- State
  completed boolean default false,
  completed_at timestamp with time zone,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. SPEECH SESSIONS (ASR Results)
create table speech_sessions (
  id uuid primary key default uuid_generate_v4(),
  patient_id uuid references patients(id), -- Can be null for pure guests if we want
  
  audio_url text, -- Storage path
  transcript text,
  confidence_score float,
  wer_score float, -- Word Error Rate (lower is better)
  
  language text,
  duration_seconds float,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table patients enable row level security;
alter table tasks enable row level security;
alter table assignments enable row level security;
alter table speech_sessions enable row level security;

-- POLICIES

-- PROFILES:
-- Users can read their own profile.
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);

-- ORGANIZATIONS:
-- Readable by members.
create policy "Members view org" on organizations
  for select using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.organization_id = organizations.id)
  );

-- PATIENTS:
-- 1. Therapists can view/edit patients they manage.
create policy "Therapists manage their patients" on patients
  for all using (
    therapist_id = auth.uid()
  );

-- 2. Patients (if logged in) can view themselves.
create policy "Patients view self" on patients
  for select using (
    auth_user_id = auth.uid()
  );
  
-- 3. Org Admins can view all patients in org.
create policy "Admins view org patients" on patients
  for select using (
    exists (
      select 1 from profiles 
      where profiles.id = auth.uid() 
      and profiles.role = 'admin' 
      and profiles.organization_id = patients.organization_id
    )
  );

-- TASKS:
-- 1. Therapists can manage tasks they created.
create policy "Therapists manage own tasks" on tasks
  for all using (created_by_therapist_id = auth.uid());

-- 2. Everyone can read public/system tasks.
create policy "View public tasks" on tasks
  for select using (is_public = true);

-- ASSIGNMENTS:
-- 1. Therapists manage assignments for their patients.
create policy "Therapists manage assignments" on assignments
  for all using (
    exists (
        select 1 from patients 
        where patients.id = assignments.patient_id 
        and patients.therapist_id = auth.uid()
    )
  );

-- 2. Patients can view their own assignments.
create policy "Patients view assignments" on assignments
  for select using (
    exists (
        select 1 from patients
        where patients.id = assignments.patient_id
        and patients.auth_user_id = auth.uid()
    )
  );

-- SPEECH SESSIONS:
-- 1. Therapists view their patients' sessions.
create policy "Therapists view patient sessions" on speech_sessions
  for select using (
    exists (
        select 1 from patients 
        where patients.id = speech_sessions.patient_id 
        and patients.therapist_id = auth.uid()
    )
  );

-- 2. Insert accessible to authenticated users (logic handled by backend usually, but for direct client access:)
create policy "Users upload sessions" on speech_sessions
  for insert with check (auth.role() = 'authenticated');


-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'independent_patient'); -- Default role, updated later by admin invitation
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
