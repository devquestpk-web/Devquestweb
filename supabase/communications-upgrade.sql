-- DevQuest Student Portal communications and reporting upgrade.
-- Review before applying. This migration is additive and does not contact external services.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists student_id text,
  add column if not exists university text,
  add column if not exists degree text,
  add column if not exists semester text,
  add column if not exists profile_completed boolean not null default false,
  add column if not exists email_notifications boolean not null default true,
  add column if not exists marketing_emails boolean not null default false;
alter table public.profiles add column if not exists google_user_resource text;
create unique index if not exists profiles_google_user_resource_idx on public.profiles(google_user_resource) where google_user_resource is not null;

create unique index if not exists profiles_student_id_idx
  on public.profiles(student_id) where student_id is not null;
create unique index if not exists enrollments_unique_course_idx on public.enrollments(user_id, course_id) where item_type = 'COURSE';
create unique index if not exists enrollments_unique_webinar_idx on public.enrollments(user_id, webinar_id) where item_type = 'WEBINAR';
create unique index if not exists tickets_unique_course_idx on public.tickets(user_id, course_id) where item_type = 'COURSE';
create unique index if not exists tickets_unique_webinar_idx on public.tickets(user_id, webinar_id) where item_type = 'WEBINAR';

create sequence if not exists public.student_id_seq start 1000;

create or replace function public.assign_student_id()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'student' and new.student_id is null then
    new.student_id := 'DQ-STU-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.student_id_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists assign_student_id_trigger on public.profiles;
create trigger assign_student_id_trigger before insert or update of role on public.profiles
for each row execute procedure public.assign_student_id();

update public.profiles set student_id = 'DQ-STU-' || to_char(created_at, 'YYYY') || '-' || lpad(nextval('public.student_id_seq')::text, 6, '0')
where role = 'student' and student_id is null;

alter table public.webinars
  add column if not exists status text not null default 'scheduled',
  add column if not exists registration_opens_at timestamptz,
  add column if not exists registration_closes_at timestamptz,
  add column if not exists timezone text not null default 'Asia/Karachi';

create table if not exists public.event_sessions (
  id uuid primary key default gen_random_uuid(),
  webinar_id uuid references public.webinars(id) on delete restrict,
  course_id uuid references public.courses(id) on delete restrict,
  title text not null check (char_length(title) between 2 and 180),
  topic text,
  trainer text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('draft','scheduled','live','completed','cancelled')),
  enrollment_mode text not null default 'mandatory' check (enrollment_mode in ('mandatory','optional')),
  join_url text,
  recording_url text,
  resources jsonb not null default '[]'::jsonb,
  join_releases_at timestamptz,
  published_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check ((webinar_id is not null)::integer + (course_id is not null)::integer = 1)
);

alter table public.event_sessions alter column webinar_id drop not null;
alter table public.event_sessions add column if not exists course_id uuid references public.courses(id) on delete restrict;
alter table public.event_sessions add column if not exists topic text;
alter table public.event_sessions add column if not exists resources jsonb not null default '[]'::jsonb;
alter table public.event_sessions add column if not exists published_at timestamptz;
alter table public.event_sessions add column if not exists cancelled_at timestamptz;
alter table public.event_sessions add column if not exists cancellation_reason text;
alter table public.event_sessions add column if not exists deleted_at timestamptz;
alter table public.event_sessions add column if not exists deleted_by uuid references auth.users(id) on delete set null;
alter table public.event_sessions add column if not exists google_calendar_event_id text;
alter table public.event_sessions add column if not exists google_meet_code text;
alter table public.event_sessions add column if not exists google_conference_record text;
alter table public.event_sessions add column if not exists google_sync_status text;
alter table public.event_sessions add column if not exists google_sync_error text;
do $$ begin
  if not exists(select 1 from pg_constraint where conname = 'event_sessions_single_parent_check') then
    alter table public.event_sessions add constraint event_sessions_single_parent_check
      check ((webinar_id is not null)::integer + (course_id is not null)::integer = 1) not valid;
  end if;
end $$;

create table if not exists public.session_enrollments (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.event_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'enrolled' check (status in ('enrolled','cancelled')),
  registered_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique(session_id, user_id)
);

create table if not exists public.session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.event_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'present' check (status in ('present','late','absent','excused')),
  checked_in_at timestamptz,
  marked_by uuid references auth.users(id) on delete set null,
  notes text,
  updated_at timestamptz not null default now(),
  unique(session_id, user_id)
);
alter table public.session_attendance add column if not exists source text not null default 'manual';
alter table public.session_attendance add column if not exists source_reference text;

create table if not exists public.meet_participant_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.event_sessions(id) on delete cascade,
  conference_record text not null,
  participant_resource text not null,
  google_user_resource text,
  display_name text,
  participant_type text not null check (participant_type in ('signed_in','anonymous','phone','unknown')),
  first_join_at timestamptz,
  last_leave_at timestamptz,
  duration_seconds integer not null default 0,
  matched_user_id uuid references auth.users(id) on delete set null,
  match_status text not null default 'unmatched' check (match_status in ('unmatched','matched','ignored')),
  reconciled_by uuid references auth.users(id) on delete set null,
  reconciled_at timestamptz,
  raw_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, participant_resource)
);
create index if not exists meet_participant_session_status_idx on public.meet_participant_records(session_id, match_status);

create table if not exists public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id text not null,
  entity_version bigint not null default 1,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed','dead')),
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz,
  completed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique(event_type, entity_type, entity_id, entity_version)
);

create index if not exists integration_outbox_pending_idx on public.integration_outbox(status, available_at);

create table if not exists public.sheet_row_mapping (
  entity_type text not null,
  entity_id text not null,
  sheet_name text not null,
  row_number integer,
  last_version bigint not null default 0,
  last_synced_at timestamptz,
  last_error text,
  primary key(entity_type, entity_id, sheet_name)
);

create table if not exists public.email_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text not null,
  name text not null,
  subject text not null,
  html_body text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(template_key, version)
);

create table if not exists public.notification_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  template_key text not null,
  enabled boolean not null default true,
  reminder_minutes integer,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  template_key text not null,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_email text,
  variables jsonb not null default '{}'::jsonb,
  dedupe_key text not null unique,
  status text not null default 'pending' check (status in ('pending','processing','sent','delivered','failed','cancelled','dead')),
  scheduled_for timestamptz not null default now(),
  attempts integer not null default 0,
  provider_message_id text,
  last_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists notification_outbox_pending_idx on public.notification_outbox(status, scheduled_for);

create or replace function public.claim_integration_jobs(p_limit integer default 20)
returns setof public.integration_outbox language plpgsql security definer set search_path = public as $$
begin
  return query update public.integration_outbox jobs
  set status = 'processing', locked_at = now(), attempts = jobs.attempts + 1
  where jobs.id in (select candidate.id from public.integration_outbox candidate
    where candidate.status in ('pending','failed') and candidate.available_at <= now()
    order by candidate.created_at for update skip locked limit greatest(1, least(p_limit, 100)))
  returning jobs.*;
end;
$$;
revoke all on function public.claim_integration_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_integration_jobs(integer) to service_role;

create or replace function public.claim_notification_jobs(p_limit integer default 20)
returns setof public.notification_outbox language plpgsql security definer set search_path = public as $$
begin
  return query update public.notification_outbox jobs
  set status = 'processing', attempts = jobs.attempts + 1
  where jobs.id in (select candidate.id from public.notification_outbox candidate
    where candidate.status in ('pending','failed') and candidate.scheduled_for <= now()
    order by candidate.scheduled_for for update skip locked limit greatest(1, least(p_limit, 100)))
  returning jobs.*;
end;
$$;
revoke all on function public.claim_notification_jobs(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_jobs(integer) to service_role;

create table if not exists public.email_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid references public.notification_outbox(id) on delete set null,
  provider_message_id text,
  recipient_email text not null,
  status text not null,
  provider_event jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.email_suppressions (
  email text primary key,
  reason text not null,
  source text not null default 'provider',
  created_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 3 and 180),
  category text not null default 'general',
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'open' check (status in ('open','in_progress','waiting','resolved','closed')),
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  is_internal boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.complete_free_enrollment(
  p_user_id uuid, p_item_type text, p_item_id uuid, p_ticket_code text, p_qr_payload text
) returns table(enrollment_id uuid, ticket_id uuid, order_id uuid)
language plpgsql security definer set search_path = public as $$
declare v_user uuid := p_user_id; v_price numeric; v_order uuid; v_ticket uuid; v_enrollment uuid;
begin
  if v_user is null then raise exception 'Student is required'; end if;
  if not exists(select 1 from public.profiles where id = v_user and role = 'student' and is_active) then raise exception 'Active student access required'; end if;
  if p_item_type = 'COURSE' then select price into v_price from public.courses where id = p_item_id and is_published;
  elsif p_item_type = 'WEBINAR' then select price into v_price from public.webinars where id = p_item_id and is_published;
  else raise exception 'Invalid item type'; end if;
  if v_price is null then raise exception 'Item not available'; end if;
  if v_price <> 0 then raise exception 'Paid enrollment requires verified payment'; end if;
  insert into public.orders(user_id, item_type, course_id, webinar_id, amount, payment_status)
  values(v_user, p_item_type, case when p_item_type='COURSE' then p_item_id end, case when p_item_type='WEBINAR' then p_item_id end, 0, 'COMPLETED') returning id into v_order;
  insert into public.tickets(ticket_code, order_id, user_id, item_type, course_id, webinar_id, qr_payload)
  values(p_ticket_code, v_order, v_user, p_item_type, case when p_item_type='COURSE' then p_item_id end, case when p_item_type='WEBINAR' then p_item_id end, p_qr_payload) returning id into v_ticket;
  insert into public.enrollments(user_id, item_type, course_id, webinar_id)
  values(v_user, p_item_type, case when p_item_type='COURSE' then p_item_id end, case when p_item_type='WEBINAR' then p_item_id end) returning id into v_enrollment;
  if p_item_type = 'WEBINAR' then
    insert into public.session_enrollments(session_id, user_id)
    select id, v_user from public.event_sessions where webinar_id = p_item_id and enrollment_mode = 'mandatory' and status <> 'cancelled'
    on conflict(session_id, user_id) do update set status = 'enrolled', cancelled_at = null;
  elsif p_item_type = 'COURSE' then
    insert into public.session_enrollments(session_id, user_id)
    select id, v_user from public.event_sessions where course_id = p_item_id and enrollment_mode = 'mandatory' and status <> 'cancelled'
    on conflict(session_id, user_id) do update set status = 'enrolled', cancelled_at = null;
  end if;
  return query select v_enrollment, v_ticket, v_order;
end;
$$;
revoke all on function public.complete_free_enrollment(uuid,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.complete_free_enrollment(uuid,text,uuid,text,text) to service_role;

create or replace function public.enqueue_integration_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare entity text; version bigint;
begin
  if tg_op = 'DELETE' then entity := old.id::text; else entity := new.id::text; end if;
  version := (extract(epoch from clock_timestamp()) * 1000000)::bigint;
  insert into public.integration_outbox(event_type, entity_type, entity_id, entity_version, payload)
  values (lower(tg_op), tg_table_name, entity, version, jsonb_build_object('operation', tg_op))
  on conflict do nothing;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists profiles_integration_outbox on public.profiles;
create trigger profiles_integration_outbox after insert or update on public.profiles
for each row when (new.role = 'student') execute procedure public.enqueue_integration_change();
drop trigger if exists webinars_integration_outbox on public.webinars;
create trigger webinars_integration_outbox after insert or update or delete on public.webinars
for each row execute procedure public.enqueue_integration_change();
drop trigger if exists sessions_integration_outbox on public.event_sessions;
create trigger sessions_integration_outbox after insert or update or delete on public.event_sessions
for each row execute procedure public.enqueue_integration_change();
drop trigger if exists session_enrollments_integration_outbox on public.session_enrollments;
create trigger session_enrollments_integration_outbox after insert or update or delete on public.session_enrollments
for each row execute procedure public.enqueue_integration_change();
drop trigger if exists attendance_integration_outbox on public.session_attendance;
create trigger attendance_integration_outbox after insert or update or delete on public.session_attendance
for each row execute procedure public.enqueue_integration_change();
drop trigger if exists certificates_integration_outbox on public.certificates;
create trigger certificates_integration_outbox after insert or update or delete on public.certificates
for each row execute procedure public.enqueue_integration_change();

create or replace function public.enqueue_event_enrollment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare event_id uuid; version bigint;
begin
  if tg_op = 'DELETE' then event_id := old.webinar_id; else event_id := new.webinar_id; end if;
  if (case when tg_op = 'DELETE' then old.item_type else new.item_type end) = 'WEBINAR' and event_id is not null then
    version := (extract(epoch from clock_timestamp()) * 1000000)::bigint;
    insert into public.integration_outbox(event_type, entity_type, entity_id, entity_version, payload)
    values(lower(tg_op), 'webinars', event_id::text, version, jsonb_build_object('operation', tg_op, 'source', 'enrollments'))
    on conflict do nothing;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists event_enrollments_integration_outbox on public.enrollments;
create trigger event_enrollments_integration_outbox after insert or update or delete on public.enrollments
for each row execute procedure public.enqueue_event_enrollment_change();

alter table public.event_sessions enable row level security;
alter table public.session_enrollments enable row level security;
alter table public.session_attendance enable row level security;
alter table public.meet_participant_records enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.sheet_row_mapping enable row level security;
alter table public.email_templates enable row level security;
alter table public.notification_rules enable row level security;
alter table public.notification_outbox enable row level security;
alter table public.email_delivery_logs enable row level security;
alter table public.email_suppressions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "Students view eligible sessions" on public.event_sessions for select to authenticated using (
  public.is_devquest_admin() or (deleted_at is null and exists (
    select 1 from public.enrollments e where e.user_id = auth.uid() and (
      (e.item_type = 'WEBINAR' and e.webinar_id = event_sessions.webinar_id) or
      (e.item_type = 'COURSE' and e.course_id = event_sessions.course_id)
    )
  ))
);
create policy "Admins manage sessions" on public.event_sessions for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Students view own session enrollments" on public.session_enrollments for select to authenticated using (user_id = auth.uid() or public.is_devquest_admin());
create policy "Admins manage session enrollments" on public.session_enrollments for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Students view own session attendance" on public.session_attendance for select to authenticated using (user_id = auth.uid() or public.is_devquest_admin());
create policy "Admins manage session attendance" on public.session_attendance for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Admins manage Meet participant reconciliation" on public.meet_participant_records for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Admins manage email templates" on public.email_templates for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Admins manage notification rules" on public.notification_rules for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Admins view notifications" on public.notification_outbox for select to authenticated using (public.is_devquest_admin());
create policy "Admins view delivery logs" on public.email_delivery_logs for select to authenticated using (public.is_devquest_admin());
create policy "Students manage own support tickets" on public.support_tickets for select to authenticated using (user_id = auth.uid() or public.is_devquest_admin());
create policy "Students create own support tickets" on public.support_tickets for insert to authenticated with check (user_id = auth.uid());
create policy "Admins update support tickets" on public.support_tickets for update to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Students view public support messages" on public.support_messages for select to authenticated using (
  public.is_devquest_admin() or (not is_internal and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid()))
);
create policy "Students create support replies" on public.support_messages for insert to authenticated with check (
  author_id = auth.uid() and not is_internal and exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
);
create policy "Admins manage support messages" on public.support_messages for all to authenticated using (public.is_devquest_admin()) with check (public.is_devquest_admin());
create policy "Admins view audit logs" on public.admin_audit_logs for select to authenticated using (public.is_devquest_admin());

drop policy if exists "Public can view and verify certificates" on public.certificates;
create policy "Students view own certificates" on public.certificates for select to authenticated using (user_id = auth.uid() or public.is_devquest_admin());

-- External integration/outbox tables intentionally have no browser write policies.
-- They are processed only through the server-side service role.

insert into public.email_templates(template_key, name, subject, html_body, version)
values
  ('enrollment_confirmation', 'Enrollment confirmation', 'Enrollment confirmed: {{event_title}}', '<h2>You are enrolled</h2><p>Hello {{student_name}},</p><p>Your enrollment in <strong>{{event_title}}</strong> is confirmed.</p><p><a href="{{portal_url}}">Open your Student Portal</a></p>', 1),
  ('student_welcome', 'Student welcome', 'Welcome to DevQuest PK', '<h2>Welcome to DevQuest PK</h2><p>Hello {{student_name}},</p><p>Your Student Portal is ready. Complete your profile to receive relevant learning updates.</p><p><a href="{{portal_url}}">Open your Student Portal</a></p>', 1),
  ('session_announcement', 'New session announcement', 'New session: {{session_title}}', '<h2>A new session is available</h2><p>Hello {{student_name}},</p><p><strong>{{session_title}}</strong> for {{event_title}} is scheduled for {{session_date}}.</p><p><a href="{{portal_url}}">View session details</a></p>', 1),
  ('session_update', 'Session schedule update', 'Schedule update: {{session_title}}', '<h2>Session schedule updated</h2><p>Hello {{student_name}},</p><p>{{session_title}} is now scheduled for {{session_date}}. Please review the latest details in your portal.</p><p><a href="{{portal_url}}">View updated schedule</a></p>', 1),
  ('session_cancelled', 'Session cancellation', 'Session cancelled: {{session_title}}', '<h2>Session cancelled</h2><p>Hello {{student_name}},</p><p>{{session_title}} has been cancelled. Review your portal for the latest event schedule.</p><p><a href="{{portal_url}}">Open your Student Portal</a></p>', 1),
  ('session_reminder', 'Session reminder', 'Reminder: {{session_title}}', '<h2>Your session is coming up</h2><p>Hello {{student_name}},</p><p>{{session_title}} starts at {{session_date}}.</p><p><a href="{{portal_url}}">Open your Student Portal</a></p>', 1),
  ('certificate_issued', 'Certificate issued', 'Your DevQuest certificate is ready', '<h2>Certificate earned</h2><p>Hello {{student_name}},</p><p>Your certificate is ready in the Student Portal.</p><p><a href="{{certificate_url}}">View your certificate</a></p>', 1),
  ('support_update', 'Support update', 'Update on: {{support_subject}}', '<h2>Your support request has an update</h2><p>Hello {{student_name}},</p><p>{{support_message}}</p><p><a href="{{portal_url}}">View your support request</a></p>', 1)
on conflict(template_key, version) do nothing;

insert into public.notification_rules(rule_key, template_key, enabled, reminder_minutes)
values
  ('enrollment_confirmation', 'enrollment_confirmation', true, null),
  ('student_welcome', 'student_welcome', true, null),
  ('session_announcement', 'session_announcement', true, null),
  ('session_update', 'session_update', true, null),
  ('session_cancelled', 'session_cancelled', true, null),
  ('session_reminder_24h', 'session_reminder', true, 1440),
  ('session_reminder_1h', 'session_reminder', true, 60),
  ('certificate_issued', 'certificate_issued', true, null),
  ('support_update', 'support_update', true, null)
on conflict(rule_key) do nothing;

create or replace function public.queue_enrollment_confirmation()
returns trigger language plpgsql security definer set search_path = public as $$
declare item_title text; student_name text;
begin
  if new.item_type = 'WEBINAR' then select title into item_title from public.webinars where id = new.webinar_id;
  else select title into item_title from public.courses where id = new.course_id; end if;
  select full_name into student_name from public.profiles where id = new.user_id;
  insert into public.notification_outbox(notification_type, template_key, recipient_user_id, variables, dedupe_key)
  values ('enrollment_confirmation', 'enrollment_confirmation', new.user_id,
    jsonb_build_object('student_name', coalesce(student_name, 'Student'), 'event_title', item_title, 'portal_url', '/portal/student'),
    'enrollment:' || new.id::text)
  on conflict(dedupe_key) do nothing;
  return new;
end;
$$;
drop trigger if exists enrollment_confirmation_notification on public.enrollments;
create trigger enrollment_confirmation_notification after insert on public.enrollments for each row execute procedure public.queue_enrollment_confirmation();

create or replace function public.queue_session_notifications()
returns trigger language plpgsql security definer set search_path = public as $$
declare event_title text; notification_kind text; template_name text; version_key text;
begin
  if new.webinar_id is not null then select title into event_title from public.webinars where id = new.webinar_id;
  else select title into event_title from public.courses where id = new.course_id; end if;
  notification_kind := case
    when new.status = 'cancelled' then 'session_cancelled'
    when tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status = 'draft' and new.status <> 'draft') then 'session_announcement'
    else 'session_update' end;
  template_name := notification_kind;
  version_key := floor(extract(epoch from new.updated_at))::bigint::text;
  if new.status <> 'draft' and (tg_op = 'INSERT' or new.starts_at is distinct from old.starts_at or new.status is distinct from old.status) then
    insert into public.notification_outbox(notification_type, template_key, recipient_user_id, variables, dedupe_key)
    select notification_kind, template_name, e.user_id,
      jsonb_build_object('student_name', coalesce(p.full_name, 'Student'), 'event_title', event_title, 'session_title', new.title, 'session_date', new.starts_at, 'portal_url', '/portal/student'),
      notification_kind || ':' || new.id::text || ':' || e.user_id::text || ':' || version_key
    from public.enrollments e left join public.profiles p on p.id = e.user_id
    where ((e.item_type = 'WEBINAR' and e.webinar_id = new.webinar_id) or (e.item_type = 'COURSE' and e.course_id = new.course_id)) and p.email_notifications is true
      and (notification_kind = 'session_announcement' or exists(select 1 from public.session_enrollments se where se.session_id = new.id and se.user_id = e.user_id and se.status = 'enrolled'))
    on conflict(dedupe_key) do nothing;
  end if;
  delete from public.notification_outbox where status = 'pending' and notification_type like 'session_reminder_%' and variables->>'session_id' = new.id::text;
  if new.status = 'scheduled' then
    insert into public.notification_outbox(notification_type, template_key, recipient_user_id, variables, dedupe_key, scheduled_for)
    select 'session_reminder_' || r.reminder_minutes::text, 'session_reminder', e.user_id,
      jsonb_build_object('student_name', coalesce(p.full_name, 'Student'), 'event_title', event_title, 'session_title', new.title, 'session_date', new.starts_at, 'session_id', new.id, 'portal_url', '/portal/student'),
      'session-reminder:' || new.id::text || ':' || e.user_id::text || ':' || r.reminder_minutes::text || ':' || version_key,
      new.starts_at - make_interval(mins => r.reminder_minutes)
    from public.enrollments e join public.profiles p on p.id = e.user_id
    cross join public.notification_rules r
    where ((e.item_type = 'WEBINAR' and e.webinar_id = new.webinar_id) or (e.item_type = 'COURSE' and e.course_id = new.course_id)) and p.email_notifications is true
      and exists(select 1 from public.session_enrollments se where se.session_id = new.id and se.user_id = e.user_id and se.status = 'enrolled')
      and r.template_key = 'session_reminder' and r.enabled and r.reminder_minutes is not null
      and new.starts_at - make_interval(mins => r.reminder_minutes) > now()
    on conflict(dedupe_key) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists session_notification_trigger on public.event_sessions;
create trigger session_notification_trigger after insert or update of starts_at, status, title on public.event_sessions
for each row execute procedure public.queue_session_notifications();

create or replace function public.protect_session_history()
returns trigger language plpgsql security definer set search_path = public as $$
declare has_history boolean; target_id uuid; target_webinar uuid; target_course uuid;
begin
  if tg_op = 'DELETE' then target_id := old.id; target_webinar := old.webinar_id; target_course := old.course_id;
  else target_id := new.id; target_webinar := new.webinar_id; target_course := new.course_id; end if;
  select exists(select 1 from public.session_enrollments where session_id = target_id)
      or exists(select 1 from public.session_attendance where session_id = target_id)
      or exists(select 1 from public.certificates where webinar_id = target_webinar or course_id = target_course)
    into has_history;
  if tg_op = 'DELETE' and has_history then
    update public.event_sessions set deleted_at = now(), status = 'cancelled', cancelled_at = coalesce(cancelled_at, now()) where id = old.id;
    return null;
  end if;
  if tg_op = 'UPDATE' and has_history and (new.webinar_id is distinct from old.webinar_id or new.course_id is distinct from old.course_id) then
    raise exception 'A session with history cannot be moved to a different event or course';
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;
drop trigger if exists protect_session_history_trigger on public.event_sessions;
create trigger protect_session_history_trigger before update or delete on public.event_sessions
for each row execute procedure public.protect_session_history();

create or replace function public.queue_certificate_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare student_name text;
begin
  select full_name into student_name from public.profiles where id = new.user_id;
  insert into public.notification_outbox(notification_type, template_key, recipient_user_id, variables, dedupe_key)
  values ('certificate_issued', 'certificate_issued', new.user_id,
    jsonb_build_object('student_name', coalesce(student_name, 'Student'), 'certificate_url', '/portal/student', 'portal_url', '/portal/student'),
    'certificate:' || new.id::text)
  on conflict(dedupe_key) do nothing;
  return new;
end;
$$;
drop trigger if exists certificate_notification_trigger on public.certificates;
create trigger certificate_notification_trigger after insert on public.certificates for each row execute procedure public.queue_certificate_notification();

create or replace function public.queue_support_notification()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid; ticket_subject text; student_name text;
begin
  select user_id, subject into owner_id, ticket_subject from public.support_tickets where id = new.ticket_id;
  if new.author_id <> owner_id and not new.is_internal then
    select full_name into student_name from public.profiles where id = owner_id;
    insert into public.notification_outbox(notification_type, template_key, recipient_user_id, variables, dedupe_key)
    values ('support_update', 'support_update', owner_id,
      jsonb_build_object('student_name', coalesce(student_name, 'Student'), 'support_subject', ticket_subject, 'support_message', new.body, 'portal_url', '/portal/student'),
      'support-message:' || new.id::text)
    on conflict(dedupe_key) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists support_notification_trigger on public.support_messages;
create trigger support_notification_trigger after insert on public.support_messages for each row execute procedure public.queue_support_notification();

create or replace function public.queue_student_welcome()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role = 'student' then
    insert into public.notification_outbox(notification_type, template_key, recipient_user_id, variables, dedupe_key)
    values ('student_welcome', 'student_welcome', new.id,
      jsonb_build_object('student_name', coalesce(new.full_name, 'Student'), 'student_id', new.student_id, 'portal_url', '/portal/student'),
      'student-welcome:' || new.id::text)
    on conflict(dedupe_key) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists student_welcome_notification on public.profiles;
create trigger student_welcome_notification after insert on public.profiles for each row execute procedure public.queue_student_welcome();

