-- Keep historical sessions, enrollments, attendance, and certificates linked to
-- their original event or course while removing archived programs from new work.
alter table public.webinars
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

alter table public.courses
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references auth.users(id) on delete set null;

create index if not exists webinars_active_programs_idx
  on public.webinars (title) where archived_at is null;

create index if not exists courses_active_programs_idx
  on public.courses (title) where archived_at is null;
