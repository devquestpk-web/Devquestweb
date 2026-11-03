-- DevQuest PK configurable certificates (apply only after review in Supabase).
begin;

create table if not exists public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  scope_type text not null default 'DEFAULT' check (scope_type in ('DEFAULT', 'COURSE', 'WEBINAR', 'SESSION')),
  course_id uuid references public.courses(id) on delete restrict,
  webinar_id uuid references public.webinars(id) on delete restrict,
  session_id uuid references public.event_sessions(id) on delete restrict,
  config jsonb not null default '{"primaryColor":"#061e3d","accentColor":"#469bff","issuerName":"DevQuest Administration","issuerTitle":"Issued digitally by DevQuest PK"}'::jsonb,
  eligibility_rules jsonb not null default '{"minimumAttendancePercent":100,"requireAllSessions":true}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint certificate_template_scope check (
    (scope_type = 'DEFAULT' and course_id is null and webinar_id is null and session_id is null) or
    (scope_type = 'COURSE' and course_id is not null and webinar_id is null and session_id is null) or
    (scope_type = 'WEBINAR' and webinar_id is not null and course_id is null and session_id is null) or
    (scope_type = 'SESSION' and session_id is not null and course_id is null and webinar_id is null)
  )
);

alter table public.certificates add column if not exists template_id uuid references public.certificate_templates(id) on delete set null;
alter table public.certificates add column if not exists session_id uuid references public.event_sessions(id) on delete restrict;
alter table public.certificates add column if not exists issuance_mode text not null default 'automatic' check (issuance_mode in ('automatic', 'manual'));
alter table public.certificates add column if not exists eligibility_snapshot jsonb not null default '{}'::jsonb;
alter table public.certificates add column if not exists uploaded_by uuid references auth.users(id) on delete set null;
alter table public.certificates add column if not exists revoked_at timestamptz;
alter table public.certificates add column if not exists revoked_by uuid references auth.users(id) on delete set null;
alter table public.certificates add column if not exists revocation_reason text;

create unique index if not exists certificates_unique_course_issue on public.certificates(user_id, course_id) where course_id is not null and session_id is null and revoked_at is null;
create unique index if not exists certificates_unique_webinar_issue on public.certificates(user_id, webinar_id) where webinar_id is not null and session_id is null and revoked_at is null;
create unique index if not exists certificates_unique_session_issue on public.certificates(user_id, session_id) where session_id is not null and revoked_at is null;
create unique index if not exists one_active_default_certificate_template on public.certificate_templates(scope_type) where scope_type = 'DEFAULT' and is_active;

alter table public.certificate_templates enable row level security;
drop policy if exists "Admins manage certificate templates" on public.certificate_templates;
create policy "Admins manage certificate templates" on public.certificate_templates for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());

create or replace function public.protect_issued_certificate_identity() returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if old.user_id is distinct from new.user_id or old.course_id is distinct from new.course_id or old.webinar_id is distinct from new.webinar_id or old.session_id is distinct from new.session_id or old.cert_code is distinct from new.cert_code then
    raise exception 'Issued certificate identity and scope cannot be changed';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_issued_certificate_identity on public.certificates;
create trigger protect_issued_certificate_identity before update on public.certificates for each row execute procedure public.protect_issued_certificate_identity();

insert into public.certificate_templates(name, scope_type)
select 'DevQuest Standard', 'DEFAULT'
where not exists (select 1 from public.certificate_templates where scope_type = 'DEFAULT' and is_active);

commit;
