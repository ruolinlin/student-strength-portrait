-- WARNING: This migration is for controlled development and private-beta use only.
-- Its anonymous policies are intentionally permissive and MUST be replaced with
-- record-level authorization before collecting real student data publicly.

create extension if not exists pgcrypto;

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  student_alias text,
  grade text,
  status text not null default 'self_in_progress'
    check (status in ('self_in_progress', 'awaiting_observer', 'complete')),
  self_completed_at timestamptz,
  observer_completed_at timestamptz,
  assessment_version text not null default '0.2'
);

create table if not exists public.responses (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  role text not null check (role in ('self', 'observer')),
  item_id text not null,
  score smallint not null check (score between 1 and 5),
  item_started_at timestamptz,
  item_answered_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assessment_id, role, item_id)
);

create table if not exists public.invitations (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  code text not null unique,
  relationship text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.professional_briefs (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null unique references public.assessments(id) on delete cascade,
  academic_context jsonb not null default '{}'::jsonb,
  application_context jsonb not null default '{}'::jsonb,
  experience_context text not null default '',
  family_context text not null default '',
  current_major_thoughts text not null default '',
  counselor_observations text not null default '',
  key_question text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists responses_assessment_role_idx
  on public.responses (assessment_id, role);

alter table public.assessments enable row level security;
alter table public.responses enable row level security;
alter table public.invitations enable row level security;
alter table public.professional_briefs enable row level security;

-- Private-beta policy: UUID assessment links and invitation codes act as access keys.
-- Replace with authenticated ownership policies before a public launch.
create policy "private beta assessments" on public.assessments
  for all to anon using (true) with check (true);
create policy "private beta responses" on public.responses
  for all to anon using (true) with check (true);
create policy "private beta invitations" on public.invitations
  for all to anon using (true) with check (true);
create policy "private beta briefs" on public.professional_briefs
  for all to anon using (true) with check (true);
