-- Let the parent save their relationship without gaining access to student-owned invitation data.
create or replace function public.set_parent_relationship(next_relationship text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.invitations i
    set relationship = nullif(trim(next_relationship), '')
    from public.assessments a
    where i.assessment_id = a.id and a.parent_user_id = auth.uid();
  if not found then raise exception 'No parent session found'; end if;
end;
$$;

revoke all on function public.set_parent_relationship(text) from public;
grant execute on function public.set_parent_relationship(text) to authenticated;
