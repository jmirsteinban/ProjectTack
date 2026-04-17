# ProjectTrack SQL

Esta carpeta centraliza los scripts SQL y migraciones de Supabase usados por ProjectTrack.

Antes estaban bajo `Android/sql`, pero ahora viven aqui porque el backend Supabase es compartido por Chrome, Android y la documentacion operativa.

## Uso

Aplica estos scripts desde el SQL Editor del proyecto Supabase correcto, salvo que un runbook indique otro flujo.

Scripts actuales:

- `app_releases_chrome_20260416.sql`: canal privado de releases para ProjectTrack Chrome.
- `change_tasks_excel_import_20260331.sql`: tablas, permisos y politicas para importar/exportar tareas desde Excel.
- `logical_delete_hierarchy_20260310.sql`: funciones de borrado logico jerarquico.
- `project_notes_status_business_rule_20260310.sql`: reglas de negocio para notas de proyecto.
- `projects_update_authenticated_all_20260311.sql`: politica de actualizacion de proyectos para modo equipo.
- `projects_update_user_scope_20260311.sql`: politica de actualizacion de proyectos limitada por usuario/asignacion.

## Convencion

- Mantener nombres con fecha `YYYYMMDD` cuando el script represente una migracion aplicada o aplicable.
- No guardar secretos, tokens ni URLs privadas en SQL.
- Si una pantalla o servicio depende de una migracion, referenciarla como `sql/nombre_del_script.sql`.
