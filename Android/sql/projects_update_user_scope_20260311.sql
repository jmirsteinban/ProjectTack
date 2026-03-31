-- ProjectTrack - habilitar UPDATE de projects para owner o usuario asignado en cambios del proyecto
-- Fecha: 2026-03-11
--
-- Contexto:
-- - CU-010-P02 devolvia: UPDATE 0 filas (bloqueo RLS).
-- - La policy previa `projects_update_own` solo permitia update al owner.
--
-- Resultado:
-- - Permite actualizar projects a:
--   1) owner del proyecto, o
--   2) usuario que tenga al menos un change asignado en ese proyecto.
--   3) fallback legacy: usuario en changes.assigned_to (si change_assignees no esta sincronizada).

begin;

drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_update_user_scope on public.projects;

create policy projects_update_user_scope
on public.projects
for update
to authenticated
using (
  created_by::text = auth.uid()::text
  or exists (
    select 1
    from public.changes c
    join public.change_assignees ca on ca.change_id = c.id
    where c.project_id::text = projects.id::text
      and ca.user_id::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.changes c
    where c.project_id::text = projects.id::text
      and c.assigned_to is not null
      and c.assigned_to::text = auth.uid()::text
  )
)
with check (
  created_by::text = auth.uid()::text
  or exists (
    select 1
    from public.changes c
    join public.change_assignees ca on ca.change_id = c.id
    where c.project_id::text = projects.id::text
      and ca.user_id::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.changes c
    where c.project_id::text = projects.id::text
      and c.assigned_to is not null
      and c.assigned_to::text = auth.uid()::text
  )
);

commit;
