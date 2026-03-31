# Runbook Supabase RLS - Guide for Dummies (ProjectTrack)

## 1) Que es este documento
Este runbook explica, paso por paso y sin saltos, como:
- Configurar permisos de datos (RLS) en Supabase.
- Evitar fugas de datos por policies abiertas.
- Dar acceso a nuevas cuentas.
- Diagnosticar errores tipicos que ya nos pasaron.

Si solo vas a hacer una cosa hoy: sigue la seccion **"4) Setup inicial completo (primera vez)"** en orden.

### Referencia de QA funcional (2026-03-11)
- Estado de pruebas funcionales:
  - `Android/Casos_Uso_Pruebas.md`
- Defectos abiertos:
  - `Android/Lista_Errores_Pruebas.md`
- Mejoras solicitadas:
  - `Android/Lista_Mejoras_Pruebas.md`
- Pendientes de verificacion:
  - `Android/Lista_Pendientes_Verificacion.md`

---

## 2) Conceptos basicos (en lenguaje simple)

### 2.1 `auth.users`
Es la tabla de cuentas de login en Supabase Auth.
- Aqui existe el correo y el `id` (UUID) del usuario.
- `auth.uid()` devuelve el UUID del usuario logueado.

### 2.2 `public.projects.created_by`
Es el owner del proyecto.
- Debe guardar un UUID que exista en `auth.users.id`.
- Si esta vacio (`null`), nadie vera ese proyecto cuando RLS este estricto.

### 2.3 Asignacion de cambios (`changes.assigned_to` + `change_assignees`)
- `public.changes.assigned_to`: UUID primario/fallback.
- `public.change_assignees(change_id, user_id)`: relacion N a N para multi-asignacion real.
- La app actual prioriza `change_assignees` y usa `assigned_to` como compatibilidad.

### 2.4 `public.changes.current_environment` y `show_*_links`
Campos para controlar ambientes del cambio:
- `current_environment`: ambiente actual (`QA`, `STG`, `PROD`).
- `show_qa_links`, `show_stg_links`, `show_prod_links`: definen que grupos de URLs mostrar en el detalle.

### 2.5 RLS (Row Level Security)
RLS son reglas que deciden que filas puede ver o editar cada usuario.
- Si RLS esta mal, la app puede mostrar "No hay proyectos visibles".
- Si hay policy abierta tipo `USING (true)` para `anon`, hay fuga de datos.

### 2.6 `public.users` (directorio app)
- Tabla de apoyo para UI (por ejemplo, autocompletado `@` en asignados).
- Debe mantenerse sincronizada con `auth.users` (backfill + trigger).

### 2.7 Terminologia de ambientes (evitar confusion)
- Ambiente de BD/Supabase (infraestructura):
  - Actualmente solo existe `PROD` para este proyecto.
- Ambiente del cambio en la app (funcional):
  - `QA`, `STG`, `PROD` en `changes.current_environment` y visibilidad de links.
- Regla practica:
  - Cuando este runbook habla de ejecutar SQL/migraciones, se refiere a la BD Supabase activa (`prod`), salvo que se indique otro ambiente de infraestructura.

---

## 3) Checklist antes de empezar

1. Entra a Supabase del proyecto correcto.
2. Ve a `SQL Editor`.
3. Confirma que estas usando un rol con permisos de admin SQL.
4. Ten a mano el correo del usuario owner (ejemplo: `jordan.molina@accenture.com`).
5. Ejecuta los bloques en orden. No saltes pasos.

---

## 4) Setup inicial completo (primera vez)

## Paso 1 - Confirmar que el usuario existe en Auth
Ejecuta:

```sql
select id, email
from auth.users
where lower(email) = lower('jordan.molina@accenture.com');
```

Resultado esperado:
- Debe regresar 1 fila con `id` UUID.
- Si no regresa filas, primero crea la cuenta en `Authentication > Users`.

---

## Paso 2 - Verificar FK de `projects.created_by`
Ejecuta:

```sql
select conname, pg_get_constraintdef(c.oid) as def
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'projects'
  and conname = 'projects_created_by_fkey';
```

Resultado correcto:
- Debe decir: `REFERENCES auth.users(id)`.

Si dice `REFERENCES users(id)` (tabla publica), corrige:

```sql
alter table public.projects
drop constraint if exists projects_created_by_fkey;

alter table public.projects
add constraint projects_created_by_fkey
foreign key (created_by)
references auth.users(id)
on delete set null;
```

---

## Paso 3 - Completar `created_by` en proyectos existentes (backfill)
Ejecuta:

```sql
with me as (
  select id
  from auth.users
  where lower(email) = lower('jordan.molina@accenture.com')
  limit 1
)
update public.projects p
set created_by = me.id
from me
where p.created_by is null
returning p.id, p.name, p.created_by;
```

Resultado esperado:
- Regresa filas con `created_by` lleno.
- Si regresa 0 filas, puede significar:
  - Ya estaban llenos.
  - El correo no coincide.

Valida:

```sql
select id, name, created_by
from public.projects
order by name;
```

---

## Paso 4 - Dejar default para nuevos proyectos
Ejecuta:

```sql
alter table public.projects
alter column created_by set default auth.uid();
```

Que logra:
- Si luego insertas proyecto sin `created_by`, toma el usuario logueado.

---

## Paso 4B - Migracion de `changes` para ambientes y visibilidad de links
Ejecuta este bloque para agregar columnas nuevas usadas por la app:
Nota: aqui `QA|STG|PROD` son ambientes del cambio en la app, no ambientes de despliegue de la BD.

```sql
alter table public.changes
  add column if not exists current_environment text not null default 'QA',
  add column if not exists show_qa_links boolean not null default true,
  add column if not exists show_stg_links boolean not null default false,
  add column if not exists show_prod_links boolean not null default false;

alter table public.changes
  drop constraint if exists changes_current_environment_check;

alter table public.changes
  add constraint changes_current_environment_check
  check (upper(current_environment) in ('QA', 'STG', 'PROD'));
```

Validacion rapida:

```sql
select
  id,
  current_environment,
  show_qa_links,
  show_stg_links,
  show_prod_links
from public.changes
limit 20;
```

Resultado esperado:
- `current_environment` con `QA`, `STG` o `PROD`.
- Banderas de visibilidad en `true/false`.

---

## Paso 4C - Sincronizar `public.users` desde `auth.users` (obligatorio para sugerencias `@`)
Ejecuta:

```sql
begin;

insert into public.users (id, email, name)
select
  au.id,
  au.email,
  coalesce(
    nullif(trim(au.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(au.raw_user_meta_data->>'name'), ''),
    split_part(coalesce(au.email, ''), '@', 1)
  ) as name
from auth.users au
on conflict (id) do update
set
  email = excluded.email,
  name  = excluded.name;

alter table public.users enable row level security;

drop policy if exists users_select_authenticated_all on public.users;
create policy users_select_authenticated_all
on public.users
for select
to authenticated
using (true);

create or replace function public.sync_public_users_from_auth()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      split_part(coalesce(new.email, ''), '@', 1)
    )
  )
  on conflict (id) do update
  set
    email = excluded.email,
    name  = excluded.name;

  return new;
end;
$$;

drop trigger if exists trg_sync_public_users_from_auth on auth.users;
create trigger trg_sync_public_users_from_auth
after insert or update of email, raw_user_meta_data
on auth.users
for each row
execute function public.sync_public_users_from_auth();

commit;
```

Validaciones:

```sql
select id, email, name
from public.users
order by email;
```

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgenabled
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and n.nspname = 'auth'
  and c.relname = 'users'
order by t.tgname;
```

Esperado:
- Debes ver filas en `public.users`.
- Debe existir trigger `trg_sync_public_users_from_auth`.

---

## Paso 4D - Crear tabla puente `change_assignees` (multi-asignacion real)
Ejecuta:

```sql
begin;

create table if not exists public.change_assignees (
  change_id uuid not null references public.changes(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid null references public.users(id) on delete set null,
  primary key (change_id, user_id)
);

create index if not exists idx_change_assignees_user_id
  on public.change_assignees(user_id);

create index if not exists idx_change_assignees_change_id
  on public.change_assignees(change_id);

alter table public.change_assignees enable row level security;

drop policy if exists change_assignees_select_authenticated on public.change_assignees;
drop policy if exists change_assignees_insert_authenticated on public.change_assignees;
drop policy if exists change_assignees_delete_authenticated on public.change_assignees;

create policy change_assignees_select_authenticated
on public.change_assignees
for select
to authenticated
using (
  exists (
    select 1
    from public.changes c
    where c.id = change_assignees.change_id
  )
);

create policy change_assignees_insert_authenticated
on public.change_assignees
for insert
to authenticated
with check (
  exists (
    select 1
    from public.changes c
    where c.id = change_assignees.change_id
  )
);

create policy change_assignees_delete_authenticated
on public.change_assignees
for delete
to authenticated
using (
  exists (
    select 1
    from public.changes c
    where c.id = change_assignees.change_id
  )
);

insert into public.change_assignees (change_id, user_id)
select c.id, c.assigned_to
from public.changes c
where c.assigned_to is not null
on conflict (change_id, user_id) do nothing;

commit;
```

Validacion:

```sql
select change_id, user_id
from public.change_assignees
order by change_id, user_id
limit 100;
```

Validacion puntual por cambio:

```sql
select user_id
from public.change_assignees
where change_id = 'CHANGE_UUID'
order by user_id;
```

Nota importante:
- `changes.assigned_to` guarda solo 1 UUID por compatibilidad.
- La multi-asignacion real vive en `change_assignees`.

---

## Paso 4E - Regla de negocio para estado de notas TO-DO (`project_notes.status`)
Objetivo:
- Solo puede cambiar `status` de una nota:
  - El creador de la nota (`project_notes.created_by`)
  - Un asignado de la nota:
    - `project_note_assignees.note_id/user_id` (multi-asignacion real)
    - `project_notes.assigned_to` (fallback legacy)
  - Un usuario asignado al cambio (`change_assignees` del `project_notes.change_id`)
- Regla de UX para asignacion (cambios y notas):
  - Se asigna escribiendo `@`.
  - Formato visual de opciones en lista: `@Nombre (correo)`.
  - Valor persistido al guardar: UUID (`users.id`).
  - En notas:
    - El mismo usuario puede aparecer multiples veces.
    - Una nota puede incluir varias personas.

Incluye:
- Nuevas columnas en `project_notes`: `change_id`, `created_by`, `assigned_to`.
- Nueva tabla puente `project_note_assignees(note_id, user_id, mention_order)`.
- Backfill inicial desde `project_notes.assigned_to` hacia `project_note_assignees`.
- FKs e indices.
- Trigger de guardado para bloquear updates de `status` no autorizados.

Script recomendado (idempotente):
- `Android/sql/project_notes_status_business_rule_20260310.sql`

Ejecuta el contenido completo del script en SQL Editor.

Validaciones:

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'project_notes'
  and column_name in ('change_id', 'created_by', 'assigned_to', 'status')
order by column_name;
```

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'project_note_assignees';
```

```sql
select tgname
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where not t.tgisinternal
  and n.nspname = 'public'
  and c.relname = 'project_notes'
order by tgname;
```

Esperado:
- Existen columnas `change_id`, `created_by`, `assigned_to`.
- Existe tabla `project_note_assignees`.
- Existe trigger `trg_guard_project_note_status_update`.

---

## Paso 4F - Borrado logico jerarquico (Proyecto > Cambio > Nota)
Objetivo:
- Evitar hard delete en operacion normal.
- Aplicar jerarquia de borrado:
  - Proyecto => Proyecto + Cambios + Notas.
  - Cambio => Cambio + Notas del cambio.
  - Nota => solo Nota.

Script recomendado (idempotente):
- `Android/sql/logical_delete_hierarchy_20260310.sql`

Este script agrega en `projects`, `changes`, `project_notes`:
- `is_deleted boolean`
- `deleted_at timestamptz`
- `deleted_by uuid`

Incluye funciones SQL:
- `public.soft_delete_project(p_project_id uuid, p_actor_id uuid default auth.uid())`
- `public.soft_delete_change(p_change_id uuid, p_actor_id uuid default auth.uid())`
- `public.soft_delete_note(p_note_id uuid, p_actor_id uuid default auth.uid())`

### Hard delete controlado (solo mantenimiento excepcional)
Nota: ejecutar con respaldo previo y fuera de horario operativo.

Hard delete de Nota:
```sql
delete from public.project_note_assignees
where note_id = 'NOTE_UUID';

delete from public.project_notes
where id = 'NOTE_UUID';
```

Hard delete de Cambio:
```sql
delete from public.project_note_assignees
where note_id in (
  select pn.id
  from public.project_notes pn
  where pn.change_id::text = 'CHANGE_UUID'
);

delete from public.project_notes
where change_id::text = 'CHANGE_UUID';

delete from public.change_assignees
where change_id::text = 'CHANGE_UUID';

delete from public.changes
where id::text = 'CHANGE_UUID';
```

Hard delete de Proyecto:
```sql
delete from public.project_note_assignees
where note_id in (
  select pn.id
  from public.project_notes pn
  where pn.project_id::text = 'PROJECT_UUID'
);

delete from public.project_notes
where project_id::text = 'PROJECT_UUID';

delete from public.change_assignees
where change_id in (
  select c.id
  from public.changes c
  where c.project_id::text = 'PROJECT_UUID'
);

delete from public.changes
where project_id::text = 'PROJECT_UUID';

delete from public.projects
where id::text = 'PROJECT_UUID';
```

---

## Paso 5 - Activar RLS en tablas clave
Ejecuta:

```sql
alter table public.projects enable row level security;
alter table public.changes enable row level security;
alter table public.project_notes enable row level security;
alter table public.users enable row level security;
alter table public.change_assignees enable row level security;
alter table public.project_note_assignees enable row level security;
```

---

## Paso 6A - Modo estricto por usuario (owner/asignado)
Usa este modo cuando quieres que solo owner/asignados vean datos.
Ejecuta todo este bloque:

```sql
begin;

-- Limpiar policies viejas conocidas
drop policy if exists "anon can read projects" on public.projects;
drop policy if exists "anon can read changes" on public.changes;
drop policy if exists "anon can read project_notes" on public.project_notes;

drop policy if exists projects_select_authenticated on public.projects;
drop policy if exists changes_select_authenticated on public.changes;

drop policy if exists projects_select_user_scope on public.projects;
drop policy if exists projects_insert_own on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_delete_own on public.projects;

drop policy if exists changes_select_user_scope on public.changes;
drop policy if exists changes_insert_owner_project on public.changes;
drop policy if exists changes_update_owner_project on public.changes;
drop policy if exists changes_delete_owner_project on public.changes;

drop policy if exists project_notes_select_user_scope on public.project_notes;
drop policy if exists project_notes_insert_user_scope on public.project_notes;
drop policy if exists project_notes_update_user_scope on public.project_notes;
drop policy if exists project_notes_delete_user_scope on public.project_notes;
drop policy if exists project_note_assignees_select_user_scope on public.project_note_assignees;
drop policy if exists project_note_assignees_insert_user_scope on public.project_note_assignees;
drop policy if exists project_note_assignees_delete_user_scope on public.project_note_assignees;

-- PROJECTS: ver proyectos propios o proyectos donde tengo cambios asignados
create policy projects_select_user_scope
on public.projects
for select
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
);

-- PROJECTS: CRUD solo owner
create policy projects_insert_own
on public.projects
for insert
to authenticated
with check (created_by::text = auth.uid()::text);

create policy projects_update_own
on public.projects
for update
to authenticated
using (created_by::text = auth.uid()::text)
with check (created_by::text = auth.uid()::text);

create policy projects_delete_own
on public.projects
for delete
to authenticated
using (created_by::text = auth.uid()::text);

-- CHANGES: ver cambios asignados o de proyectos propios
create policy changes_select_user_scope
on public.changes
for select
to authenticated
using (
  exists (
    select 1
    from public.change_assignees ca
    where ca.change_id::text = changes.id::text
      and ca.user_id::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.projects p
    where p.id::text = changes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
);

-- CHANGES: CRUD solo owner del proyecto
create policy changes_insert_owner_project
on public.changes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id::text = changes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
);

create policy changes_update_owner_project
on public.changes
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id::text = changes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id::text = changes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
);

create policy changes_delete_owner_project
on public.changes
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id::text = changes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
);

-- PROJECT_NOTES: ver notas si tengo acceso al proyecto
create policy project_notes_select_user_scope
on public.project_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id::text = project_notes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.changes c
    join public.change_assignees ca on ca.change_id = c.id
    where c.project_id::text = project_notes.project_id::text
      and ca.user_id::text = auth.uid()::text
  )
);

-- PROJECT_NOTES: crear notas si tengo acceso al proyecto
create policy project_notes_insert_user_scope
on public.project_notes
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id::text = project_notes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.changes c
    join public.change_assignees ca on ca.change_id = c.id
    where c.project_id::text = project_notes.project_id::text
      and ca.user_id::text = auth.uid()::text
  )
);

-- PROJECT_NOTES: editar notas si tengo acceso al proyecto
create policy project_notes_update_user_scope
on public.project_notes
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id::text = project_notes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.changes c
    join public.change_assignees ca on ca.change_id = c.id
    where c.project_id::text = project_notes.project_id::text
      and ca.user_id::text = auth.uid()::text
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id::text = project_notes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.changes c
    join public.change_assignees ca on ca.change_id = c.id
    where c.project_id::text = project_notes.project_id::text
      and ca.user_id::text = auth.uid()::text
  )
);

-- PROJECT_NOTES: eliminar notas si tengo acceso al proyecto
create policy project_notes_delete_user_scope
on public.project_notes
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id::text = project_notes.project_id::text
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.changes c
    join public.change_assignees ca on ca.change_id = c.id
    where c.project_id::text = project_notes.project_id::text
      and ca.user_id::text = auth.uid()::text
  )
);

-- PROJECT_NOTE_ASSIGNEES: ver asignaciones si tengo acceso a la nota
create policy project_note_assignees_select_user_scope
on public.project_note_assignees
for select
to authenticated
using (
  exists (
    select 1
    from public.project_notes pn
    join public.projects p on p.id::text = pn.project_id::text
    where pn.id = project_note_assignees.note_id
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.project_notes pn
    join public.change_assignees ca on ca.change_id = pn.change_id
    where pn.id = project_note_assignees.note_id
      and ca.user_id::text = auth.uid()::text
  )
);

-- PROJECT_NOTE_ASSIGNEES: insertar asignaciones si tengo acceso a la nota
create policy project_note_assignees_insert_user_scope
on public.project_note_assignees
for insert
to authenticated
with check (
  exists (
    select 1
    from public.project_notes pn
    join public.projects p on p.id::text = pn.project_id::text
    where pn.id = project_note_assignees.note_id
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.project_notes pn
    join public.change_assignees ca on ca.change_id = pn.change_id
    where pn.id = project_note_assignees.note_id
      and ca.user_id::text = auth.uid()::text
  )
);

-- PROJECT_NOTE_ASSIGNEES: borrar asignaciones si tengo acceso a la nota
create policy project_note_assignees_delete_user_scope
on public.project_note_assignees
for delete
to authenticated
using (
  exists (
    select 1
    from public.project_notes pn
    join public.projects p on p.id::text = pn.project_id::text
    where pn.id = project_note_assignees.note_id
      and p.created_by::text = auth.uid()::text
  )
  or exists (
    select 1
    from public.project_notes pn
    join public.change_assignees ca on ca.change_id = pn.change_id
    where pn.id = project_note_assignees.note_id
      and ca.user_id::text = auth.uid()::text
  )
);

commit;
```

---

## Paso 6B - Modo equipo (todos los autenticados ven todo)
Usa este modo cuando todos los usuarios de la empresa/equipo deben ver todos los proyectos/cambios/notas.

Importante:
- Este modo abre lectura global para `authenticated`.
- No abre datos para `anon`.
- Tambien habilita escritura en `projects`, `project_notes` y `project_note_assignees` para `authenticated`.

Regla de negocio temporal vigente (2026-03-11):
- De momento, todos los usuarios autenticados pueden editar proyectos.
- Policy usada: `projects_update_authenticated_all`.
- Script de referencia: `Android/sql/projects_update_authenticated_all_20260311.sql`.

Ejecuta este bloque si quieres activar modo equipo:

```sql
begin;

-- Eliminar policies de lectura anteriores (si existen)
drop policy if exists projects_select_user_scope on public.projects;
drop policy if exists changes_select_user_scope on public.changes;
drop policy if exists project_notes_select_user_scope on public.project_notes;

drop policy if exists projects_select_authenticated_all on public.projects;
drop policy if exists projects_update_own on public.projects;
drop policy if exists projects_update_user_scope on public.projects;
drop policy if exists projects_update_authenticated_all on public.projects;
drop policy if exists changes_select_authenticated_all on public.changes;
drop policy if exists project_notes_select_authenticated_all on public.project_notes;
drop policy if exists project_notes_insert_authenticated_all on public.project_notes;
drop policy if exists project_notes_update_authenticated_all on public.project_notes;
drop policy if exists project_notes_delete_authenticated_all on public.project_notes;
drop policy if exists project_note_assignees_select_user_scope on public.project_note_assignees;
drop policy if exists project_note_assignees_insert_user_scope on public.project_note_assignees;
drop policy if exists project_note_assignees_delete_user_scope on public.project_note_assignees;
drop policy if exists project_note_assignees_select_authenticated_all on public.project_note_assignees;
drop policy if exists project_note_assignees_insert_authenticated_all on public.project_note_assignees;
drop policy if exists project_note_assignees_delete_authenticated_all on public.project_note_assignees;

-- Lectura global para usuarios autenticados (equipo)
create policy projects_select_authenticated_all
on public.projects
for select
to authenticated
using (true);

create policy projects_update_authenticated_all
on public.projects
for update
to authenticated
using (true)
with check (true);

create policy changes_select_authenticated_all
on public.changes
for select
to authenticated
using (true);

create policy project_notes_select_authenticated_all
on public.project_notes
for select
to authenticated
using (true);

create policy project_notes_insert_authenticated_all
on public.project_notes
for insert
to authenticated
with check (true);

create policy project_notes_update_authenticated_all
on public.project_notes
for update
to authenticated
using (true)
with check (true);

create policy project_notes_delete_authenticated_all
on public.project_notes
for delete
to authenticated
using (true);

create policy project_note_assignees_select_authenticated_all
on public.project_note_assignees
for select
to authenticated
using (true);

create policy project_note_assignees_insert_authenticated_all
on public.project_note_assignees
for insert
to authenticated
with check (true);

create policy project_note_assignees_delete_authenticated_all
on public.project_note_assignees
for delete
to authenticated
using (true);

commit;
```

---

## Paso 7 - Auditoria rapida (obligatoria)

### 7.1 Ver que RLS esta activo
```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('projects', 'changes', 'project_notes', 'users', 'change_assignees', 'project_note_assignees')
order by c.relname;
```

Esperado: `rls_enabled = true` en todas las tablas listadas.

### 7.2 Ver policies existentes
```sql
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('projects', 'changes', 'project_notes', 'users', 'change_assignees', 'project_note_assignees')
order by tablename, policyname;
```

### 7.3 Detectar policies peligrosas abiertas
```sql
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('projects', 'changes', 'project_notes', 'users', 'change_assignees', 'project_note_assignees')
  and (
    array_to_string(roles, ',') ilike '%anon%'
    or array_to_string(roles, ',') ilike '%public%'
  )
  and (
    coalesce(qual, '') ilike '%true%'
    or coalesce(with_check, '') ilike '%true%'
  )
order by tablename, policyname;
```

Esperado: sin filas.

Nota:
- En modo equipo (`to authenticated using (true)`), es normal ver `true` en policies de lectura.
- Lo peligroso es `true` para `anon/public`.

---

## Paso 8 - Validacion en la app
1. Cierra sesion.
2. Inicia sesion.
3. Ve a `Perfil`.
4. Revisa:
   - Correo e ID correctos.
   - Conteo de proyectos mayor que 0:
     - Modo estricto: si eres owner o asignado.
     - Modo equipo: para cualquier usuario autenticado del equipo.
   - Sin aviso de acceso.

Si aparece "No hay proyectos visibles para este usuario":
- Revisa `created_by` en los proyectos.
- Revisa que el modo RLS activo sea el esperado (6A o 6B) y que no se haya mezclado.

---

## 5) Como agregar mas cuentas (operacion diaria)

## Caso A - Nuevo owner de proyectos
### Paso A1: crear cuenta
- En Supabase: `Authentication > Users > Add user`.

### Paso A2: sacar UUID
```sql
select id, email
from auth.users
where lower(email) = lower('nuevo.owner@dominio.com');
```

### Paso A3: asignar ownership
```sql
update public.projects
set created_by = 'UUID_DEL_OWNER'
where id in (
  'PROJECT_UUID_1',
  'PROJECT_UUID_2'
);
```

### Paso A4: validar
```sql
select id, name, created_by
from public.projects
where id in ('PROJECT_UUID_1', 'PROJECT_UUID_2');
```

---

## Caso B - Colaborador sin ownership
### Paso B1: crear cuenta
- En Supabase: `Authentication > Users > Add user`.

### Paso B2: sacar UUID
```sql
select id, email
from auth.users
where lower(email) = lower('colaborador@dominio.com');
```

### Paso B3: asignar cambios (multi-asignacion)
```sql
insert into public.change_assignees (change_id, user_id)
values
  ('CHANGE_UUID_1', 'UUID_COLABORADOR'),
  ('CHANGE_UUID_2', 'UUID_COLABORADOR')
on conflict (change_id, user_id) do nothing;
```

Con esto, por policy, podra ver:
- Esos cambios.
- Los proyectos relacionados a esos cambios.

### Checklist de cierre para nueva cuenta (obligatorio)
1. Verificar sincronizacion `auth.users -> public.users`:
```sql
select au.id, au.email, pu.id as public_user_id, pu.email as public_email
from auth.users au
left join public.users pu on pu.id = au.id
where lower(au.email) = lower('usuario@dominio.com');
```
Esperado: `public_user_id` no nulo.

2. Verificar acceso en app:
- Iniciar sesion con la nueva cuenta.
- Ir a `Perfil` y confirmar correo/ID correctos.
- Confirmar que ve proyectos/cambios segun modo RLS activo (6A o 6B).

3. Verificar sugerencias `@`:
- En crear/editar cambio y en notas TO-DO, escribir `@`.
- Confirmar que aparece formato `@Nombre (correo)`.

4. Verificar persistencia de asignacion:
- Asignar la nueva cuenta a un cambio o nota y guardar.
- Confirmar en SQL que se creo fila en `change_assignees` o `project_note_assignees`.

---

## 6) Operaciones comunes de admin

## 6.1 Transferir proyecto de owner A a owner B
```sql
update public.projects
set created_by = 'UUID_OWNER_B'
where id = 'PROJECT_UUID';
```

## 6.2 Quitar acceso de colaborador (desasignar cambios)
```sql
delete from public.change_assignees ca
using public.changes c
where ca.change_id = c.id
  and ca.user_id = 'UUID_COLABORADOR'
  and c.project_id::text = 'PROJECT_UUID';
```

## 6.3 Ajustar ambiente actual y visibilidad de links en un cambio
```sql
update public.changes
set
  current_environment = 'STG',
  show_qa_links = true,
  show_stg_links = true,
  show_prod_links = false
where id = 'CHANGE_UUID';
```

---

## 7) Troubleshooting (problema -> causa -> solucion)

## ERROR 22P02 invalid input syntax for type uuid
Causa:
- Se uso texto placeholder (`USER_UUID_AQUI`) en vez de UUID real.
Solucion:
- Consulta UUID en `auth.users` y usa ese valor.

## ERROR 23503 projects_created_by_fkey ... not present in table users
Causa:
- FK apunta a tabla equivocada (`public.users`) o UUID no existe.
Solucion:
- Verifica FK y corrige a `auth.users`.
- Reintenta backfill.

## ERROR de columnas en `changes` (por ejemplo `current_environment` no existe)
Causa:
- No se ejecuto la migracion del **Paso 4B**.
Solucion:
1. Ejecuta el bloque SQL de Paso 4B.
2. Valida columnas:
```sql
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'changes'
  and column_name in (
    'current_environment',
    'show_qa_links',
    'show_stg_links',
    'show_prod_links'
  )
order by column_name;
```

## Aviso en app: "No hay proyectos visibles para este usuario"
Causa tipica:
- `created_by` en null.
- Usuario no owner ni assigned.
- Policy equivocada.
Solucion:
1. Ver `projects.created_by`.
2. Ver asignaciones en `change_assignees` (y `changes.assigned_to` como fallback).
3. Auditar policies activas.

## En el input `@` de asignados solo aparece 1 usuario (o ninguno)
Causa tipica:
- `public.users` vacia o desactualizada.
- Trigger de sync `auth.users -> public.users` no existe/esta deshabilitado.
- Policy de lectura en `public.users` bloquea resultados.
Solucion:
1. Verifica filas en `public.users`.
2. Audita trigger `trg_sync_public_users_from_auth`.
3. Revisa policy `users_select_authenticated_all`.

## Query de backfill no actualiza filas (0 rows)
Causa:
- Correo no coincide.
- No hay proyectos con `created_by is null`.
Solucion:
- Verifica correo exacto en `auth.users`.
- Verifica estado de `projects.created_by`.

## Error en app: "No se pudo confirmar la actualizacion del proyecto (UPDATE devolvio 0 filas...)"
Causa tipica:
- Policy RLS de `UPDATE` en `public.projects` bloquea la fila para `authenticated`.
- Ejemplo real: `workfront esperado='...' actual=''` despues de guardar en `CU-010-P02`.
- Sesion desactualizada en app (token viejo) despues de cambiar policies.
- App conectada a otro proyecto distinto al SQL Editor.
Solucion:
1. Audita policies de `projects`:
```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='projects'
order by policyname;
```
2. Aplica la migracion segun tu modo:
   - Modo estricto (owner/asignado): `Android/sql/projects_update_user_scope_20260311.sql`.
   - Modo equipo (todos autenticados): `Android/sql/projects_update_authenticated_all_20260311.sql`.
3. Cierra sesion y vuelve a iniciar en app.
4. Verifica que `SUPABASE_URL` en app sea el mismo proyecto donde corriste SQL.

## Error en app: "No se pudo confirmar la actualizacion del cambio (UPDATE devolvio 0 filas...)"
Causa tipica:
- Policy RLS de `UPDATE` en `public.changes` bloquea la fila para `authenticated`.
- Sesion desactualizada en app (token viejo) despues de cambiar policies.
- App conectada a otro proyecto distinto al SQL Editor.
Solucion:
1. Audita policies de `changes`:
```sql
select policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and tablename='changes'
order by policyname;
```
2. Prueba update simulado con `set local role authenticated` + `request.jwt.claim.sub`.
3. Cierra sesion y vuelve a iniciar en app.
4. Verifica que `SUPABASE_URL` en app sea el mismo proyecto donde corriste SQL.

## Error: "new row violates row-level security policy for table project_notes"
Causa tipica:
- RLS esta activo en `public.project_notes`, pero faltan policies de escritura (`INSERT/UPDATE/DELETE`) para `authenticated`.
- Se aplico solo lectura de `project_notes` y la app intenta crear/editar/completar una nota TO-DO.
Solucion:
1. Re-ejecuta el bloque del modo que uses:
   - Modo estricto: **Paso 6A** (incluye `project_notes_*_user_scope`).
   - Modo equipo: **Paso 6B** (incluye `project_notes_*_authenticated_all`).
2. Verifica policies activas en `project_notes`:
```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename='project_notes'
order by cmd, policyname;
```
3. Cierra sesion y vuelve a iniciar en app para refrescar token/policies.

## Error: "No autorizado ... solo el creador/asignado de nota/asignado del cambio puede cambiar el estado"
Causa tipica:
- El usuario que intenta cambiar `project_notes.status` no es:
  - `created_by` de la nota,
  - ni esta asignado en `project_note_assignees` para esa nota,
  - ni coincide con `assigned_to` (fallback legacy),
  - ni esta en `change_assignees` del `change_id` de la nota.
Solucion:
1. Verifica datos de la nota:
```sql
select id, project_id, change_id, created_by, assigned_to, status
from public.project_notes
where id = 'NOTE_UUID';
```
2. Verifica asignados de la nota:
```sql
select note_id, user_id, mention_order
from public.project_note_assignees
where note_id = 'NOTE_UUID'
order by mention_order, user_id;
```
3. Verifica asignados del cambio:
```sql
select change_id, user_id
from public.change_assignees
where change_id = 'CHANGE_UUID'
order by user_id;
```
4. Si la nota no tiene `change_id`, enlazala al cambio correcto para que aplique regla por cambio:
```sql
update public.project_notes
set change_id = 'CHANGE_UUID'
where id = 'NOTE_UUID';
```

## En una nota menciono varias personas con `@`, pero solo aparece 1
Causa tipica:
- No existe/esta bloqueada la tabla `project_note_assignees`.
- No hay policies de `INSERT/DELETE` para `authenticated` en `project_note_assignees`.
- La nota solo esta guardando `project_notes.assigned_to` (fallback de 1 usuario).
Solucion:
1. Verifica tabla y datos:
```sql
select note_id, user_id, mention_order
from public.project_note_assignees
where note_id = 'NOTE_UUID'
order by mention_order, id;
```
2. Verifica policies en `project_note_assignees`:
```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname='public' and tablename='project_note_assignees'
order by cmd, policyname;
```
3. Revisa fallback legacy:
```sql
select id, assigned_to
from public.project_notes
where id = 'NOTE_UUID';
```

## Selecciono 2 asignados en app, pero solo veo 1 guardado
Causa tipica:
- Se esta revisando solo `changes.assigned_to` (campo fallback de 1 valor).
- No existe/esta bloqueada la tabla `change_assignees`.
- Faltan filas en `public.users` para los UUID asignados (FK de `change_assignees`).
Solucion:
1. Verifica que `change_assignees` exista y tenga policies `SELECT/INSERT/DELETE`.
2. Verifica asignaciones reales:
```sql
select change_id, user_id
from public.change_assignees
where change_id = 'CHANGE_UUID';
```
3. Valida que ambos `user_id` existan en `public.users`.
4. Recuerda: `assigned_to` puede mostrar solo 1 aunque `change_assignees` tenga 2+.

---

## 8) Mantenimiento recomendado
- Auditoria de policies: semanal.
- Auditoria de owners (`created_by`) en proyectos: semanal.
- Revisar que no reaparezca ninguna policy `anon ... true`: siempre.

---

## 9) Buenas practicas para no romper seguridad
- Nunca dejes policies con `USING (true)` para `anon`.
- Nunca uses `service_role` en la app movil.
- Antes de producir cambios de policies, prueba con usuario real en app.
- Documenta cada cambio de seguridad en esta guia.

---

## 10) Proxima evolucion recomendada
Modelo actual recomendado:
- `change_assignees` para multi-asignacion real por cambio.
- `project_note_assignees` para multi-asignacion real por nota TO-DO.
- `public.users` sincronizada con `auth.users` para directorio de UI (`@`).

Evolucion opcional para equipos grandes:
- Crear `project_members` si se requiere visibilidad por membresia de proyecto (ademas de asignacion por cambio).
- Definir roles por proyecto (owner, editor, viewer).

---

## 11) Bitacora UI (sin impacto en RLS/SQL)

Fecha de actualizacion: 2026-03-09

Esta seccion documenta cambios de interfaz para evitar confusion.
Importante: estos cambios **NO** modifican:
- Policies RLS.
- FK de base de datos.
- Datos en `projects`, `changes`, `project_notes`.
- Consultas SQL del runbook.

### Cambios aplicados en app
- Dashboard:
  - Boton `Ir a proyectos` en color violeta claro.
  - Boton `Ir a proyectos` con icono de lista.
  - Se retiro el boton `Proyectos` del Header global solo en `Inicio / Dashboard`.
- Inicio / Proyectos:
  - Hero card de busqueda con mismo estilo del hero del Dashboard.
  - Hero de busqueda fijo en la parte superior; la lista de proyectos debajo es scrollable.
  - Busqueda en vivo por nombre (case-insensitive, sin acentos, similitud por palabras).
  - Texto del hero ajustado a formato en una sola linea: `Buscar | input | Mostrando X de Y proyectos`.
  - Al tocar el hero fuera del input, se fuerza ocultar teclado y limpiar foco.
  - Badge de conteo `Cambios` cambio de celeste a violeta (misma paleta del boton `Ir a proyectos`).
- Header global en `Inicio / Proyectos`:
  - Se agrego boton `Volver` con icono.
  - Se agrego boton `Nuevo Proyecto` con icono `+` (abre formulario real `project_create`).
  - En `Detalle de proyecto` se agrego accion `Editar` (ruta `project_edit/{projectId}`).

### Cambios aplicados en seguridad (RLS)
- Se documentaron dos modos oficiales de acceso:
  - 6A: modo estricto por usuario (owner/asignado).
  - 6B: modo equipo (lectura global en `projects`, `changes`, `project_notes` + escritura en `projects` y `project_notes` para `authenticated`).

### Regla operativa
Si solo cambias UI (textos, colores, layout, iconos, teclado, navegacion visual):
- No ejecutes SQL.
- No cambies policies.
- No repitas setup de RLS.

Si cambias acceso a datos (quien ve o edita proyectos/cambios/notas):
- Si debes actualizar este runbook y ejecutar auditoria de la seccion 7.

---

## 12) Bitacora App + Datos (SI impacta SQL)

Fecha de actualizacion: 2026-03-10

Cambios recientes implementados en app que dependen de SQL:
- Ambientes y visibilidad de links por cambio:
  - `current_environment` (`QA|STG|PROD`)
  - `show_qa_links`, `show_stg_links`, `show_prod_links`
- Multi-asignacion real por cambio:
  - tabla `public.change_assignees`
- Multi-asignacion real por nota:
  - tabla `public.project_note_assignees`
  - soporte de varias personas por nota y menciones repetidas
- Autocompletado `@` en asignados:
  - tabla `public.users` sincronizada desde `auth.users`
  - trigger `trg_sync_public_users_from_auth`
  - formato visual estandar en opciones: `@Nombre (correo)`
  - aplica para asignacion de cambios y asignacion de notas TO-DO
- Diagnostico detallado de guardado en app:
  - Mensaje especifico cuando `UPDATE` retorna 0 filas por RLS.
  - Mensaje especifico cuando falla sincronizacion de multi-asignados en `change_assignees`.
- TO-DO por proyecto (`project_notes`) en detalle de cambio:
  - Crear nota TO-DO.
  - Editar texto de nota.
  - Completar/Reabrir nota.
  - Asignar nota via `@` en el mismo input de texto.
  - Requiere policies `INSERT/UPDATE/DELETE` en `project_notes`.
  - Requiere policies `SELECT/INSERT/DELETE` en `project_note_assignees`.

Estado validado (BD Supabase `prod`, 2026-03-10):
- `changes` con policies de equipo (`SELECT/INSERT/UPDATE/DELETE`) funcionando.
- `change_assignees` con policies activas y guardado multi-asignado verificado (2 usuarios en un cambio).
- `project_notes` con policies `SELECT/INSERT/UPDATE/DELETE` para `authenticated`.
- `project_note_assignees` con policies `SELECT/INSERT/DELETE` para `authenticated`.
- `public.users` sincronizada con `auth.users` (conteo y mapeo sin faltantes).

Accion pendiente en BD:
- Sin pendientes bloqueantes del setup actual.

---

## 13) MCP Supabase (solo lectura) - Operacion
Cuando quieras validar estado de BD sin ejecutar SQL manual en Dashboard:

```powershell
codex mcp list
codex mcp get supabase
```

Si `Auth` no aparece como `OAuth`, debes autenticar:

```powershell
codex mcp login supabase
```

Notas:
- MCP configurado en este proyecto es `read_only=true`.
- Para cambios de datos/DDL, seguir usando SQL Editor en Supabase.
