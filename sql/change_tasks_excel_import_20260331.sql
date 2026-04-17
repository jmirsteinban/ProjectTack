-- ProjectTrack - change tasks, Excel import and note linking
-- Date: 2026-03-31
-- Scope:
-- 1) Nueva entidad public.change_tasks para registrar tareas importadas por cambio.
-- 2) Tabla puente public.project_note_task_links para vincular notas con tareas.
-- 3) Bitacora public.change_task_events para historico y futuros burndown charts.
-- 4) Ajuste a soft delete jerarquico para incluir tareas.

begin;

create extension if not exists pgcrypto;

create table if not exists public.change_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  change_id uuid not null references public.changes(id) on delete cascade,
  source_file text null,
  source_external_id text null,
  task_key text not null,
  page text null,
  item_number text null,
  document_name text null,
  request_text text not null,
  annotation_type text null,
  status text not null default 'Pendiente',
  assigned_to uuid null references public.users(id) on delete set null,
  created_by uuid null references auth.users(id) on delete set null default auth.uid(),
  imported_by uuid null references auth.users(id) on delete set null default auth.uid(),
  imported_at timestamptz not null default now(),
  completed_at timestamptz null,
  is_deleted boolean not null default false,
  deleted_at timestamptz null,
  deleted_by uuid null references auth.users(id) on delete set null
);

create table if not exists public.project_note_task_links (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.project_notes(id) on delete cascade,
  task_id uuid not null references public.change_tasks(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.change_task_events (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.change_tasks(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  change_id uuid not null references public.changes(id) on delete cascade,
  event_type text not null,
  event_text text not null,
  previous_value text null,
  next_value text null,
  created_by uuid null references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

grant select, insert, update, delete on table public.change_tasks to authenticated;
grant select, insert, update, delete on table public.project_note_task_links to authenticated;
grant select on table public.change_task_events to authenticated;

alter table public.change_tasks enable row level security;
alter table public.project_note_task_links enable row level security;
alter table public.change_task_events enable row level security;

drop policy if exists change_tasks_select_authenticated_all on public.change_tasks;
drop policy if exists change_tasks_insert_authenticated_all on public.change_tasks;
drop policy if exists change_tasks_update_authenticated_all on public.change_tasks;
drop policy if exists change_tasks_delete_authenticated_all on public.change_tasks;

create policy change_tasks_select_authenticated_all
on public.change_tasks
for select
to authenticated
using (true);

create policy change_tasks_insert_authenticated_all
on public.change_tasks
for insert
to authenticated
with check (true);

create policy change_tasks_update_authenticated_all
on public.change_tasks
for update
to authenticated
using (true)
with check (true);

create policy change_tasks_delete_authenticated_all
on public.change_tasks
for delete
to authenticated
using (true);

drop policy if exists project_note_task_links_select_authenticated_all on public.project_note_task_links;
drop policy if exists project_note_task_links_insert_authenticated_all on public.project_note_task_links;
drop policy if exists project_note_task_links_update_authenticated_all on public.project_note_task_links;
drop policy if exists project_note_task_links_delete_authenticated_all on public.project_note_task_links;

create policy project_note_task_links_select_authenticated_all
on public.project_note_task_links
for select
to authenticated
using (true);

create policy project_note_task_links_insert_authenticated_all
on public.project_note_task_links
for insert
to authenticated
with check (true);

create policy project_note_task_links_update_authenticated_all
on public.project_note_task_links
for update
to authenticated
using (true)
with check (true);

create policy project_note_task_links_delete_authenticated_all
on public.project_note_task_links
for delete
to authenticated
using (true);

drop policy if exists change_task_events_select_authenticated_all on public.change_task_events;

create policy change_task_events_select_authenticated_all
on public.change_task_events
for select
to authenticated
using (true);

create unique index if not exists idx_change_tasks_change_key_active
  on public.change_tasks(change_id, task_key)
  where coalesce(is_deleted, false) = false;

create index if not exists idx_change_tasks_change_active
  on public.change_tasks(change_id, is_deleted);

create index if not exists idx_change_tasks_project_active
  on public.change_tasks(project_id, is_deleted);

create index if not exists idx_change_tasks_status
  on public.change_tasks(status);

create index if not exists idx_change_tasks_assigned_to
  on public.change_tasks(assigned_to);

create index if not exists idx_change_tasks_source_external_id
  on public.change_tasks(source_external_id);

create unique index if not exists idx_project_note_task_links_note_task
  on public.project_note_task_links(note_id, task_id);

create index if not exists idx_project_note_task_links_note
  on public.project_note_task_links(note_id);

create index if not exists idx_project_note_task_links_task
  on public.project_note_task_links(task_id);

create index if not exists idx_change_task_events_task_created_at
  on public.change_task_events(task_id, created_at desc);

create index if not exists idx_change_task_events_change_created_at
  on public.change_task_events(change_id, created_at desc);

create or replace function public.sync_change_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'Completado' then
    new.completed_at := coalesce(new.completed_at, now());
  elsif old is null or old.status is distinct from new.status then
    new.completed_at := null;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_change_task_completed_at on public.change_tasks;

create trigger trg_sync_change_task_completed_at
before insert or update of status
on public.change_tasks
for each row
execute function public.sync_change_task_completed_at();

create or replace function public.log_change_task_event()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := coalesce(auth.uid(), new.imported_by, new.created_by, old.created_by);

  if tg_op = 'INSERT' then
    insert into public.change_task_events (
      task_id,
      project_id,
      change_id,
      event_type,
      event_text,
      previous_value,
      next_value,
      created_by
    )
    values (
      new.id,
      new.project_id,
      new.change_id,
      'imported',
      'Task imported from Excel.',
      null,
      new.status,
      v_actor_id
    );

    return new;
  end if;

  if old.status is distinct from new.status then
    insert into public.change_task_events (
      task_id,
      project_id,
      change_id,
      event_type,
      event_text,
      previous_value,
      next_value,
      created_by
    )
    values (
      new.id,
      new.project_id,
      new.change_id,
      'status_changed',
      format('Task status changed from %s to %s.', coalesce(old.status, 'empty'), coalesce(new.status, 'empty')),
      old.status,
      new.status,
      v_actor_id
    );
  end if;

  if old.assigned_to is distinct from new.assigned_to then
    insert into public.change_task_events (
      task_id,
      project_id,
      change_id,
      event_type,
      event_text,
      previous_value,
      next_value,
      created_by
    )
    values (
      new.id,
      new.project_id,
      new.change_id,
      'assignee_changed',
      'Task assignee updated.',
      old.assigned_to::text,
      new.assigned_to::text,
      v_actor_id
    );
  end if;

  if old.is_deleted is distinct from new.is_deleted and coalesce(new.is_deleted, false) = true then
    insert into public.change_task_events (
      task_id,
      project_id,
      change_id,
      event_type,
      event_text,
      previous_value,
      next_value,
      created_by
    )
    values (
      new.id,
      new.project_id,
      new.change_id,
      'deleted',
      'Task was logically deleted.',
      'false',
      'true',
      coalesce(new.deleted_by, v_actor_id)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_log_change_task_event on public.change_tasks;

create trigger trg_log_change_task_event
after insert or update of status, assigned_to, is_deleted
on public.change_tasks
for each row
execute function public.log_change_task_event();

create or replace function public.soft_delete_project(
  p_project_id uuid,
  p_actor_id uuid default auth.uid()
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := coalesce(p_actor_id, auth.uid());

  update public.projects p
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where p.id = p_project_id
    and coalesce(p.is_deleted, false) = false;

  update public.changes c
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where c.project_id::text = p_project_id::text
    and coalesce(c.is_deleted, false) = false;

  update public.project_notes pn
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where pn.project_id::text = p_project_id::text
    and coalesce(pn.is_deleted, false) = false;

  update public.change_tasks ct
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where ct.project_id::text = p_project_id::text
    and coalesce(ct.is_deleted, false) = false;
end;
$$;

create or replace function public.soft_delete_change(
  p_change_id uuid,
  p_actor_id uuid default auth.uid()
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := coalesce(p_actor_id, auth.uid());

  update public.changes c
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where c.id = p_change_id
    and coalesce(c.is_deleted, false) = false;

  update public.project_notes pn
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where pn.change_id::text = p_change_id::text
    and coalesce(pn.is_deleted, false) = false;

  update public.change_tasks ct
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where ct.change_id::text = p_change_id::text
    and coalesce(ct.is_deleted, false) = false;
end;
$$;

commit;
