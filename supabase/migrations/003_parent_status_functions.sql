-- Parent accounts may change only their own assessment status.
create or replace function public.set_parent_assessment_status(next_status text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if next_status not in ('in_progress', 'completed') then raise exception 'Invalid status'; end if;
  update public.assessments
    set parent_status = next_status,
        observer_completed_at = case when next_status = 'completed' then now() else observer_completed_at end,
        status = case when next_status = 'completed' and student_status = 'completed' then 'complete' else status end
    where parent_user_id = auth.uid();
  if not found then raise exception 'No parent session found'; end if;
end;
$$;

revoke all on function public.set_parent_assessment_status(text) from public;
grant execute on function public.set_parent_assessment_status(text) to authenticated;
