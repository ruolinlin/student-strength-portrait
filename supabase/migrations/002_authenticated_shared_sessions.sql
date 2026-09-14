-- Production session authorization: students and parents authenticate separately.
-- Apply only to the dedicated Supabase project created for this application.

alter table public.assessments
  add column if not exists student_user_id uuid references auth.users(id),
  add column if not exists parent_user_id uuid references auth.users(id),
  add column if not exists student_status text not null default 'not_started' check (student_status in ('not_started', 'in_progress', 'completed')),
  add column if not exists parent_status text not null default 'not_started' check (parent_status in ('not_started', 'in_progress', 'completed')),
  add column if not exists basic_info_status text not null default 'not_started' check (basic_info_status in ('not_started', 'in_progress', 'completed')),
  add column if not exists guidance_status text not null default 'not_ready' check (guidance_status in ('not_ready', 'ready_for_counselor', 'in_review', 'released')),
  add column if not exists is_test boolean not null default false;

create unique index if not exists assessments_student_user_id_idx on public.assessments(student_user_id) where student_user_id is not null;

drop policy if exists "private beta assessments" on public.assessments;
drop policy if exists "private beta responses" on public.responses;
drop policy if exists "private beta invitations" on public.invitations;
drop policy if exists "private beta briefs" on public.professional_briefs;

create policy "students create own assessment" on public.assessments for insert to authenticated
  with check (student_user_id = auth.uid());
create policy "session participants read assessment" on public.assessments for select to authenticated
  using (student_user_id = auth.uid() or parent_user_id = auth.uid());
create policy "students update own assessment" on public.assessments for update to authenticated
  using (student_user_id = auth.uid()) with check (student_user_id = auth.uid());

create policy "session participants read responses" on public.responses for select to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and (a.student_user_id = auth.uid() or a.parent_user_id = auth.uid())));
create policy "students write self responses" on public.responses for insert to authenticated
  with check (role = 'self' and exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()));
create policy "parents write observer responses" on public.responses for insert to authenticated
  with check (role = 'observer' and exists (select 1 from public.assessments a where a.id = assessment_id and a.parent_user_id = auth.uid()));
create policy "participants update own responses" on public.responses for update to authenticated
  using ((role = 'self' and exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid())) or (role = 'observer' and exists (select 1 from public.assessments a where a.id = assessment_id and a.parent_user_id = auth.uid())))
  with check ((role = 'self' and exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid())) or (role = 'observer' and exists (select 1 from public.assessments a where a.id = assessment_id and a.parent_user_id = auth.uid())));

create policy "students manage invitations" on public.invitations for all to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()))
  with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()));
create policy "students manage professional briefs" on public.professional_briefs for all to authenticated
  using (exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()))
  with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.student_user_id = auth.uid()));

create or replace function public.claim_parent_invitation(invite_code text)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  session_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select assessment_id into session_id from public.invitations where code = upper(trim(invite_code));
  if session_id is null then raise exception 'Invitation not found'; end if;
  update public.assessments
    set parent_user_id = auth.uid()
    where id = session_id and (parent_user_id is null or parent_user_id = auth.uid());
  if not found then raise exception 'Invitation has already been claimed'; end if;
  return session_id;
end;
$$;

revoke all on function public.claim_parent_invitation(text) from public;
grant execute on function public.claim_parent_invitation(text) to authenticated;
