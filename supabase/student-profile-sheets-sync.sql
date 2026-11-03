-- Guarantees student registration and later profile updates are projected to Sheets.
-- Apply after communications-upgrade.sql. This does not export credentials or passwords.
begin;

create or replace function public.create_member_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare requested_role text;
begin
  requested_role := new.raw_user_meta_data ->> 'role';
  insert into public.profiles (id, full_name, role, phone, city, university, degree, semester, profile_completed)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    case when requested_role in ('team', 'admin') then 'member' else 'student' end,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'city'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'university'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'degree'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'semester'), ''),
    requested_role = 'student' and nullif(trim(new.raw_user_meta_data ->> 'full_name'), '') is not null and nullif(trim(new.raw_user_meta_data ->> 'university'), '') is not null and nullif(trim(new.raw_user_meta_data ->> 'degree'), '') is not null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.create_member_profile();

create or replace function public.queue_confirmed_student_profile_sync()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles
    set updated_at = now()
    where id = new.id and role = 'student';
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
after update of email_confirmed_at on auth.users
for each row execute procedure public.queue_confirmed_student_profile_sync();

-- The existing profiles_integration_outbox trigger creates one durable job for
-- each row below. The worker upserts the same stable Supabase user ID in Sheets.
update public.profiles
set updated_at = updated_at
where role = 'student';

commit;
