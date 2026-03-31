-- ProjectTrack - project_notes status business rule
-- Date: 2026-03-10
-- Rule:
-- Solo el creador de una nota, una persona asignada en la nota
-- (via project_note_assignees o assigned_to legacy) o un asignado del cambio
-- puede cambiar el estado (columna status) de la nota.

begin;

create extension if not exists pgcrypto;

-- 1) Campos necesarios para aplicar la regla por cambio/usuario.
alter table public.project_notes
  add column if not exists change_id uuid null,
  add column if not exists created_by uuid null,
  add column if not exists assigned_to uuid null;

-- 2) Foreign keys (idempotentes).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_notes_change_id_fkey'
      and conrelid = 'public.project_notes'::regclass
  ) then
    alter table public.project_notes
      add constraint project_notes_change_id_fkey
      foreign key (change_id)
      references public.changes(id)
      on delete cascade;
  end if;
end $$;

-- 2b) Tabla puente para multi-asignacion real por nota (permite repetidos).
create table if not exists public.project_note_assignees (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.project_notes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  mention_order integer not null default 0,
  assigned_at timestamptz not null default now()
);

insert into public.project_note_assignees (note_id, user_id, mention_order)
select pn.id, pn.assigned_to, 0
from public.project_notes pn
where pn.assigned_to is not null
  and not exists (
    select 1
    from public.project_note_assignees pna
    where pna.note_id = pn.id
      and pna.user_id = pn.assigned_to
      and pna.mention_order = 0
  );

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_notes_created_by_fkey'
      and conrelid = 'public.project_notes'::regclass
  ) then
    alter table public.project_notes
      add constraint project_notes_created_by_fkey
      foreign key (created_by)
      references auth.users(id)
      on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'project_notes_assigned_to_fkey'
      and conrelid = 'public.project_notes'::regclass
  ) then
    alter table public.project_notes
      add constraint project_notes_assigned_to_fkey
      foreign key (assigned_to)
      references public.users(id)
      on delete set null;
  end if;
end $$;

-- 3) Defaults y backfill.
alter table public.project_notes
  alter column created_by set default auth.uid();

update public.project_notes pn
set created_by = p.created_by
from public.projects p
where pn.created_by is null
  and pn.project_id is not null
  and p.id::text = pn.project_id::text
  and p.created_by is not null;

-- 4) Indices utiles.
create index if not exists idx_project_notes_change_id
  on public.project_notes(change_id);

create index if not exists idx_project_notes_created_by
  on public.project_notes(created_by);

create index if not exists idx_project_notes_assigned_to
  on public.project_notes(assigned_to);

create index if not exists idx_project_note_assignees_note_id
  on public.project_note_assignees(note_id);

create index if not exists idx_project_note_assignees_user_id
  on public.project_note_assignees(user_id);

create index if not exists idx_project_note_assignees_note_order
  on public.project_note_assignees(note_id, mention_order, id);

-- 5) Guard de negocio para cambios de status.
create or replace function public.guard_project_note_status_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  actor_id uuid;
  can_change_status boolean;
begin
  -- El trigger se ejecuta solo cuando cambia status.
  actor_id := auth.uid();

  if actor_id is null then
    raise exception
      'No autorizado: se requiere sesion autenticada para cambiar el estado de la nota.'
      using errcode = '42501';
  end if;

  can_change_status := (
    old.created_by = actor_id
    or old.assigned_to = actor_id
    or exists (
      select 1
      from public.project_note_assignees pna
      where pna.note_id = old.id
        and pna.user_id = actor_id
    )
    or (
      old.change_id is not null
      and exists (
        select 1
        from public.change_assignees ca
        where ca.change_id = old.change_id
          and ca.user_id = actor_id
      )
    )
  );

  if not can_change_status then
    raise exception
      'No autorizado: solo el creador de la nota, el asignado de la nota o un asignado del cambio puede cambiar el estado de la nota.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_project_note_status_update on public.project_notes;

create trigger trg_guard_project_note_status_update
before update of status
on public.project_notes
for each row
execute function public.guard_project_note_status_update();

commit;
