-- ProjectTrack - logical delete hierarchy (projects -> changes -> notes)
-- Date: 2026-03-10
-- Rule:
-- 1) Borrar Proyecto => borrado logico de proyecto + cambios + notas.
-- 2) Borrar Cambio => borrado logico de cambio + notas de ese cambio.
-- 3) Borrar Nota => borrado logico solo de esa nota.
--
-- Nota: este script NO hace hard delete. Las queries de hard delete
-- estan documentadas en Runbook_Supabase_RLS.md.

begin;

-- 1) Columnas de borrado logico.
alter table public.projects
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by uuid null;

alter table public.changes
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by uuid null;

alter table public.project_notes
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_at timestamptz null,
  add column if not exists deleted_by uuid null;

-- 2) FK deleted_by -> auth.users (idempotente).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'projects_deleted_by_fkey'
      and conrelid = 'public.projects'::regclass
  ) then
    alter table public.projects
      add constraint projects_deleted_by_fkey
      foreign key (deleted_by)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'changes_deleted_by_fkey'
      and conrelid = 'public.changes'::regclass
  ) then
    alter table public.changes
      add constraint changes_deleted_by_fkey
      foreign key (deleted_by)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_notes_deleted_by_fkey'
      and conrelid = 'public.project_notes'::regclass
  ) then
    alter table public.project_notes
      add constraint project_notes_deleted_by_fkey
      foreign key (deleted_by)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

-- 3) Indices.
create index if not exists idx_projects_is_deleted
  on public.projects(is_deleted);

create index if not exists idx_changes_project_is_deleted
  on public.changes(project_id, is_deleted);

create index if not exists idx_changes_is_deleted
  on public.changes(is_deleted);

create index if not exists idx_project_notes_project_is_deleted
  on public.project_notes(project_id, is_deleted);

create index if not exists idx_project_notes_change_is_deleted
  on public.project_notes(change_id, is_deleted);

create index if not exists idx_project_notes_is_deleted
  on public.project_notes(is_deleted);

-- 4) Funciones de borrado logico jerarquico.
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
end;
$$;

create or replace function public.soft_delete_note(
  p_note_id uuid,
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

  update public.project_notes pn
  set
    is_deleted = true,
    deleted_at = now(),
    deleted_by = v_actor_id
  where pn.id = p_note_id
    and coalesce(pn.is_deleted, false) = false;
end;
$$;

commit;
