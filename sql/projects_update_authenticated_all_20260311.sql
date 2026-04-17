-- ProjectTrack - modo equipo: permitir UPDATE de projects para cualquier usuario autenticado
-- Fecha: 2026-03-11
--
-- Contexto:
-- - CU-010-P02 bloqueado por RLS en proyectos visibles para usuarios no owner/asignados.
-- - En modo equipo existe lectura global, pero faltaba policy de UPDATE en public.projects.

begin;

drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_update_user_scope on public.projects;
drop policy if exists projects_update_authenticated_all on public.projects;

create policy projects_update_authenticated_all
on public.projects
for update
to authenticated
using (true)
with check (true);

commit;
