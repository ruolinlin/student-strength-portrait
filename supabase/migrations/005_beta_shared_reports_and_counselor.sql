-- Beta shared-session hardening. Apply after 001–004.
-- Raw answers stay private to their author; shared reports contain only scored profiles.

create table if not exists public.assessment_reports (
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  role text not null check (role in ('self', 'observer')),
  profile jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (assessment_id, role)
);

create table if not exists public.counselor_whitelist (
  email text primary key,
  created_at timestamptz not null default now()
);

create table if not exists public.counselor_cases (
  assessment_id uuid primary key references public.assessments(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  status text not null default 'ready_for_guidance'
    check (status in ('ready_for_guidance', 'in_guidance', 'completed'))
);

alter table public.assessment_reports enable row level security;
alter table public.counselor_whitelist enable row level security;
alter table public.counselor_cases enable row level security;

create or replace function public.is_beta_counselor()
returns boolean
language sql stable security definer set search_path = public
as $$
  select auth.uid() is not null
    and exists (
      select 1 from public.counselor_whitelist
      where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

revoke all on function public.is_beta_counselor() from public;
grant execute on function public.is_beta_counselor() to authenticated;

-- Replace the earlier participant-wide raw-answer read policy.
drop policy if exists "session participants read responses" on public.responses;
create policy "students read own raw responses" on public.responses for select to authenticated
  using (role = 'self' and exists (
    select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()
  ));
create policy "parents read own raw responses" on public.responses for select to authenticated
  using (role = 'observer' and exists (
    select 1 from public.assessments a where a.id = assessment_id and a.parent_user_id = auth.uid()
  ));

create policy "participants read scored reports" on public.assessment_reports for select to authenticated
  using (exists (
    select 1 from public.assessments a where a.id = assessment_id
      and (a.student_user_id = auth.uid() or a.parent_user_id = auth.uid())
  ));
create policy "students write self report" on public.assessment_reports for insert to authenticated
  with check (role = 'self' and exists (
    select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()
  ));
create policy "parents write observer report" on public.assessment_reports for insert to authenticated
  with check (role = 'observer' and exists (
    select 1 from public.assessments a where a.id = assessment_id and a.parent_user_id = auth.uid()
  ));
create policy "authors update own scored report" on public.assessment_reports for update to authenticated
  using ((role = 'self' and exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()))
      or (role = 'observer' and exists (select 1 from public.assessments a where a.id = assessment_id and a.parent_user_id = auth.uid())))
  with check ((role = 'self' and exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()))
      or (role = 'observer' and exists (select 1 from public.assessments a where a.id = assessment_id and a.parent_user_id = auth.uid())));

create policy "students submit own counselor case" on public.counselor_cases for insert to authenticated
  with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()));
create policy "students read own counselor case" on public.counselor_cases for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()));
create policy "whitelisted counselors read cases" on public.counselor_cases for select to authenticated
  using (public.is_beta_counselor());
create policy "whitelisted counselors update cases" on public.counselor_cases for update to authenticated
  using (public.is_beta_counselor()) with check (public.is_beta_counselor());

create policy "counselors read submitted assessments" on public.assessments for select to authenticated
  using (public.is_beta_counselor() and exists (select 1 from public.counselor_cases c where c.assessment_id = id));
create policy "counselors read submitted reports" on public.assessment_reports for select to authenticated
  using (public.is_beta_counselor() and exists (select 1 from public.counselor_cases c where c.assessment_id = assessment_reports.assessment_id));
create policy "counselors read submitted briefs" on public.professional_briefs for select to authenticated
  using (public.is_beta_counselor() and exists (select 1 from public.counselor_cases c where c.assessment_id = professional_briefs.assessment_id));
create policy "counselors update submitted briefs" on public.professional_briefs for update to authenticated
  using (public.is_beta_counselor() and exists (select 1 from public.counselor_cases c where c.assessment_id = professional_briefs.assessment_id))
  with check (public.is_beta_counselor() and exists (select 1 from public.counselor_cases c where c.assessment_id = professional_briefs.assessment_id));

create or replace function public.submit_counselor_case(target_assessment_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.assessments
    where id = target_assessment_id and student_user_id = auth.uid() and basic_info_status = 'completed'
  ) then raise exception 'Complete student basic information before submitting'; end if;
  insert into public.counselor_cases (assessment_id)
  values (target_assessment_id)
  on conflict (assessment_id) do nothing;
  update public.assessments set guidance_status = 'ready_for_counselor'
    where id = target_assessment_id and student_user_id = auth.uid();
end;
$$;

revoke all on function public.submit_counselor_case(uuid) from public;
grant execute on function public.submit_counselor_case(uuid) to authenticated;
