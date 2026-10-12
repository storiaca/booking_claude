create schema if not exists private;

create table public.clinics (
  id bigint generated always as identity primary key,
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null
    constraint clinics_name_length check (char_length(btrim(name)) between 2 and 100),
  created_at timestamptz not null default now()
);

alter table public.clinics enable row level security;

revoke all on public.clinics from anon, authenticated;
grant select on public.clinics to authenticated;
grant select, insert, update, delete on public.clinics to service_role;

create policy "Owners can view their own clinic"
  on public.clinics for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create function private.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.clinics (owner_id, name)
  values (new.id, btrim(new.raw_user_meta_data ->> 'clinic_name'));
  return new;
end;
$$;

revoke execute on function private.handle_new_user()
  from public, anon, authenticated, service_role;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
