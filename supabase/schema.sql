-- DevQuest-owned member profile records.
-- Run this in the DevQuest Supabase SQL editor after enabling email/password auth.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'member' check (role in ('member', 'ambassador', 'team', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

alter table public.profiles add column if not exists department text;
alter table public.profiles add column if not exists job_title text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists is_active boolean not null default true;

drop policy if exists "Members can view their own profile" on public.profiles;
create policy "Members can view their own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Members can update their own profile" on public.profiles;
create policy "Members can update their own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create or replace function public.create_member_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.create_member_profile();

-- Shared authorization helpers. Database policies remain the source of truth,
-- so portal access cannot be granted by changing browser code.
create or replace function public.is_devquest_team()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('team', 'admin')
  );
$$;

create or replace function public.is_devquest_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active)
    and not public.is_devquest_admin()
    and current_user not in ('postgres', 'service_role') then
    raise exception 'Only a DevQuest administrator can change member access';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_profile_role_update on public.profiles;
create trigger protect_profile_role_update
before update on public.profiles
for each row execute procedure public.protect_profile_role();

drop policy if exists "Admins can view member profiles" on public.profiles;
create policy "Admins can view member profiles"
on public.profiles for select
using (public.is_devquest_admin());

drop policy if exists "Admins can update member profiles" on public.profiles;
create policy "Admins can update member profiles"
on public.profiles for update
using (public.is_devquest_admin())
with check (public.is_devquest_admin());

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 180),
  description text,
  assignee_name text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed')),
  due_date date,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_tasks add column if not exists assignee_id uuid references auth.users(id) on delete set null;

create index if not exists team_tasks_status_idx on public.team_tasks(status);
create index if not exists team_tasks_due_date_idx on public.team_tasks(due_date);
alter table public.team_tasks enable row level security;

drop policy if exists "Team members can view tasks" on public.team_tasks;
drop policy if exists "Team members can create tasks" on public.team_tasks;
drop policy if exists "Team members can update tasks" on public.team_tasks;
drop policy if exists "Team members can view assigned tasks" on public.team_tasks;
drop policy if exists "Admins can view all tasks" on public.team_tasks;
drop policy if exists "Admins can create tasks" on public.team_tasks;
drop policy if exists "Members can update assigned task status" on public.team_tasks;

create policy "Team members can view assigned tasks"
on public.team_tasks for select
using (assignee_id = auth.uid() or public.is_devquest_admin());

create policy "Admins can create tasks"
on public.team_tasks for insert
with check (public.is_devquest_admin() and created_by = auth.uid());

create policy "Members can update assigned task status"
on public.team_tasks for update
using (assignee_id = auth.uid() or public.is_devquest_admin())
with check (assignee_id = auth.uid() or public.is_devquest_admin());

drop policy if exists "Admins can delete tasks" on public.team_tasks;
create policy "Admins can delete tasks"
on public.team_tasks for delete
using (public.is_devquest_admin());

create or replace function public.protect_team_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_devquest_admin()
    and current_user not in ('postgres', 'service_role')
    and (new.title, new.description, new.assignee_id, new.assignee_name, new.priority, new.due_date, new.created_by)
      is distinct from
      (old.title, old.description, old.assignee_id, old.assignee_name, old.priority, old.due_date, old.created_by) then
    raise exception 'Team members can only update task status';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists protect_team_task_assignment_update on public.team_tasks;
create trigger protect_team_task_assignment_update
before update on public.team_tasks
for each row execute procedure public.protect_team_task_assignment();

create table if not exists public.team_attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attendance_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  status text not null default 'present' check (status in ('present', 'late', 'absent', 'leave')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, attendance_date),
  check (check_out is null or check_in is not null),
  check (check_out is null or check_out >= check_in)
);

create index if not exists team_attendance_date_idx on public.team_attendance(attendance_date desc);
alter table public.team_attendance enable row level security;

drop policy if exists "Members can view own attendance" on public.team_attendance;
create policy "Members can view own attendance"
on public.team_attendance for select
using (user_id = auth.uid() or public.is_devquest_admin());

drop policy if exists "Team members can check in" on public.team_attendance;
create policy "Team members can check in"
on public.team_attendance for insert
with check (user_id = auth.uid() and public.is_devquest_team());

drop policy if exists "Members can update own attendance" on public.team_attendance;
create policy "Members can update own attendance"
on public.team_attendance for update
using (user_id = auth.uid() or public.is_devquest_admin())
with check (user_id = auth.uid() or public.is_devquest_admin());

create table if not exists public.team_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_type text not null default 'weekly' check (report_type in ('daily', 'weekly', 'monthly')),
  summary text not null check (char_length(summary) between 2 and 5000),
  achievements text,
  blockers text,
  next_steps text,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_reports_user_date_idx on public.team_reports(user_id, submitted_at desc);
alter table public.team_reports enable row level security;

drop policy if exists "Members can view own reports" on public.team_reports;
create policy "Members can view own reports"
on public.team_reports for select
using (user_id = auth.uid() or public.is_devquest_admin());

drop policy if exists "Team members can submit reports" on public.team_reports;
create policy "Team members can submit reports"
on public.team_reports for insert
with check (user_id = auth.uid() and public.is_devquest_team());

drop policy if exists "Members can update own reports" on public.team_reports;
create policy "Members can update own reports"
on public.team_reports for update
using (user_id = auth.uid() or public.is_devquest_admin())
with check (user_id = auth.uid() or public.is_devquest_admin());
