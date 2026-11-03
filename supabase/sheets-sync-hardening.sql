-- Adds course enrollment reporting to the existing integration outbox.
-- Apply after communications-upgrade.sql; safe to run once in staging before production.
begin;

create or replace function public.enqueue_event_enrollment_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare item_id uuid; entity_kind text; version bigint;
begin
  if tg_op = 'DELETE' then
    entity_kind := old.item_type;
    item_id := case when old.item_type = 'WEBINAR' then old.webinar_id else old.course_id end;
  else
    entity_kind := new.item_type;
    item_id := case when new.item_type = 'WEBINAR' then new.webinar_id else new.course_id end;
  end if;
  if entity_kind in ('WEBINAR', 'COURSE') and item_id is not null then
    version := (extract(epoch from clock_timestamp()) * 1000000)::bigint;
    insert into public.integration_outbox(event_type, entity_type, entity_id, entity_version, payload)
    values(lower(tg_op), case when entity_kind = 'WEBINAR' then 'webinars' else 'courses' end, item_id::text, version, jsonb_build_object('operation', tg_op, 'source', 'enrollments'))
    on conflict do nothing;
  end if;
  if tg_op = 'DELETE' then return old; else return new; end if;
end;
$$;

drop trigger if exists courses_integration_outbox on public.courses;
create trigger courses_integration_outbox after insert or update or delete on public.courses
for each row execute procedure public.enqueue_integration_change();

commit;
