# Documentacion Central - ProjectTrack

Actualizado al: 2026-04-20
Estado general: En progreso
Alcance actual: Android + Extension Chrome

## Objetivo

Este es el documento canonico de ProjectTrack. Reune el estado funcional, tecnico y operativo del proyecto, junto con hallazgos activos, pendientes y reglas practicas para retomar trabajo sin depender de archivos paralelos.

## Referencias Principales

- Guia UI Chrome: `Chrome/docs/projecttrack-ui.html`
- Theme Manager Chrome: `docs/chrome/theme-manager.md`
- Deployment Chrome privado: `docs/chrome/deployment-github-releases.md`
- Tracking de migracion Bootstrap Chrome: `docs/chrome/bootstrap-migration-tracking.md`
- Guia agentes IA: `docs/AGENTES_IA_PROJECTTRACK.md`
- Feedback agentes IA: `docs/AGENTES_IA_FEEDBACK_LOG.md`
- Historico visible del producto: `Chrome/src/data/project-changelog.js` y pagina `Change History`

## Resumen Ejecutivo

- El side panel queda oculto temporalmente hasta nuevo aviso.
- Chrome usa Bootstrap real como base visual y una sola capa custom: `Chrome/styles/projecttrack.css`.
- Supabase es el backend real para auth, lectura, escritura, borrado logico y metadata del canal privado de releases.
- El runtime Chrome y la documentacion funcional deben converger a ingles; el naming tecnico interno no se renombra por defecto.
- Las pantallas principales de Chrome ya pasaron QA funcional principal: Projects, Project Details, Change Details, editors, Login, Profile, navbar, Change History y UI Guide.
- Chrome incluye `Theme Manager` como pantalla del workspace para leer `projecttrack.css`, configurar tokens visuales, previsualizar componentes reales, exportar `:root`, revisar diff y guardar de forma segura mediante bloque marcado con backup.

## Estructura Del Proyecto

- `Android/`
  - app principal en Jetpack Compose
  - documentos QA Android
  - runbooks Android/Supabase
- `Chrome/`
  - extension Chrome Manifest V3
  - popup y experiencia full-tab activa
  - side panel conservado en archivos pero oculto temporalmente
- `Chrome/src/`
  - runtime principal de ProjectTrack en JavaScript
- `Chrome/styles/projecttrack.css`
  - unica capa custom de ProjectTrack: tokens, bloque `THEME MANAGER TOKENS`, marca, full-tab skin, workspace layout, componentes de dominio, popup/side-panel y helpers documentales
- `scripts/theme/`
  - servidor local y script manual para leer, guardar, respaldar y restaurar el bloque de tokens del Theme Manager
- `sql/`
  - migraciones y scripts SQL compartidos por Android, Chrome y documentacion
- `docs/`
  - documentacion general y guias de operacion

## Stack Tecnico

### Android

- Kotlin
- Jetpack Compose + Material 3
- Navigation Compose
- Supabase Auth + PostgREST
- kotlinx-serialization

### Chrome

- HTML
- CSS
- JavaScript
- Manifest V3
- Bootstrap local
- `chrome.storage`
- Supabase REST/Auth

## Configuracion Supabase

- Credenciales de referencia leidas desde `Android/ProjectTrack/local.properties`:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
- La extension Chrome puede guardar su propia configuracion en `Profile`.
- En Chrome, la key publica sola no basta si RLS permite lectura solo a usuarios `authenticated`.

## Android - Estado Funcional

### Implementado

- Login real con Supabase Auth
- Dashboard
- Proyectos
- Detalle de proyecto
- CRUD de cambios
- Detalle de cambio
- CRUD de TO-DO/notas
- Perfil
- sugerencias `@` usando `public.users`
- multi-asignacion real con:
  - `change_assignees`
  - `project_note_assignees`
- borrado logico como modelo oficial

### Modelo De Negocio Clave

- Estados de cambio:
  - `Pendiente`
  - `En desarrollo`
  - `En revision de QA`
  - `Completado (QA aprobado)`
- Ambientes funcionales:
  - `QA`
  - `STG`
  - `PROD`
- Regla TO-DO:
  - las notas se relacionan por `change_id`
  - el estado de nota solo puede cambiarlo el creador, un asignado de la nota o un asignado del cambio

## Chrome - Estado Funcional

### Runtime Activo

- `Chrome/popup.html` es la entrada visible desde el icono de la extension.
- `Chrome/workspace.html` abre la experiencia full-tab principal.
- `Chrome/sidepanel.html` permanece en el repo, pero esta oculto temporalmente en el manifest y el popup.
- `Chrome/src/main.js` monta la app.
- `Chrome/src/projecttrack-app.js` controla navbar global, overlays, acciones y estado principal.
- `Chrome/src/projecttrack-router.js` resuelve la vista activa.
- `Chrome/styles/projecttrack.css` es la unica capa custom activa.
- `Chrome/docs/projecttrack-ui.html` documenta la capa UI actual.
- `Chrome/src/screens/theme-manager.js` implementa la herramienta activa para editar tokens y guardar el bloque controlado del tema.
- `Chrome/src/theme/component-registry.js` registra el inventario inicial de componentes propios configurables.
- `scripts/theme/theme_manager_server.py` expone el servidor local aprobado para lectura, guardado, backups y restauracion del CSS.
- `scripts/theme/save_theme.py` permite aplicar manualmente un bloque `:root` como fallback.

### Vistas Activas

- Dashboard
- Projects
- Project Detail
- Changes
- Change Detail
- Profile
- Login
- Project Editor
- Change Editor
- Change History
- Theme Manager
- UI Guide

### UI Actual

- Base visual: Bootstrap real + ProjectTrack.
- Load order del workspace: `bootstrap.min.css` primero, `projecttrack.css` despues.
- Shell principal: full-tab web, sin escalado tipo panel lateral.
- Navbar global: template editable en `Chrome/components/global-navbar.html`.
- Breadcrumb: contextual, dinamico y seleccionable para copiar texto.
- Hero reutilizable:
  - template: `Chrome/components/hero-card.html`
  - renderer: `Chrome/src/components/hero-card.js`
- Superficie neutra recomendada: `card bg-body-tertiary`.
- Listas apiladas recomendadas: `list-group` + `list-group-item`.
- Botones recomendados: `btn` + variante Bootstrap.
- Layout publico recomendado: `row` + `col-*`.
- `pt-*` queda reservado para identidad visual, tokens y componentes de dominio ProjectTrack.
- El Theme Manager solo puede guardar automaticamente dentro del bloque marcado `THEME MANAGER TOKENS` en `projecttrack.css`.
- Las clases custom que no sean Bootstrap deben migrar a componentes propios en `Chrome/components` o quedar justificadas en el registro de componentes.
- Viewport:
  - minimo soportado: `360px`
  - ancho de diseno optimo: `550px`
  - breakpoints: `sm=550`, `md=700`, `lg=960`, `xl=1200`, `xxl=1400`

### Funcionalidad Local

- busqueda de proyectos
- filtro de actividad
- busqueda de cambios
- menciones `@`
- almacenamiento local de:
  - configuracion backend
  - sesion
  - credenciales validadas para auto relogin

### Integracion Remota Actual

- Auth real con email/password en `Profile`.
- lectura remota inicial de:
  - `projects`
  - `changes`
  - `users`
  - `change_assignees`
  - `project_notes`
  - `project_note_assignees`
- escritura remota inicial de:
  - proyectos
  - cambios
  - notas
  - historico de cambios en `project_notes` usando `is_todo = false`
- delete remoto inicial:
  - proyecto
  - cambio
  - nota
- toggle remoto inicial de estado de nota
- consulta de actualizaciones privadas de Chrome desde `public.app_releases`

### Tasks En Change Detail

- `Change Detail` muestra `Tasks` debajo de `Environments`.
- `Tasks` permite:
  - importar tracker `.xlsx` por cambio
  - reemplazar tareas del cambio desde workbook
  - marcar como eliminadas tareas que ya no existan en el archivo
  - editar `assignee` inline
  - editar `status` inline
  - vincular notas con tareas desde el modal de notas
  - exportar por rango usando `From TSKID / To TSKID`
- La persistencia nueva depende de `sql/change_tasks_excel_import_20260331.sql`.

## Deployment Privado Chrome

- El paquete instalable de Chrome se genera desde `scripts/package-chrome-release.ps1`.
- El release se publica como asset privado en GitHub Releases.
- La metadata visible para la extension vive en Supabase:
  - tabla: `public.app_releases`
  - app: `projecttrack-chrome`
  - migracion: `sql/app_releases_chrome_20260416.sql`
- El panel `Profile / Extension Updates` compara la version local de `Chrome/manifest.json` con la version activa de Supabase.
- Si existe una version nueva, la extension abre el release privado para descargar `ProjectTrack-Chrome.zip`.
- No se guarda token de GitHub en la extension.
- Chrome no permite que una extension `Load unpacked` se reemplace sola; la actualizacion sigue siendo manual:
  - descargar zip
  - descomprimir sobre la carpeta local
  - presionar `Reload` en `chrome://extensions`

## Comportamiento De Sync En Chrome

- Si hay sesion valida:
  - intenta leer/escribir remoto
  - recarga workspace desde Supabase
- Durante login:
  - la UI bloquea reintentos mientras autentica
  - muestra progreso visible antes de abrir el dashboard
  - deja trazas de tiempo en consola para diagnostico
- Si la sesion vence y hay credenciales guardadas:
  - intenta relogin automatico
  - repite la lectura/escritura contra Supabase
- Si nunca hubo login o el usuario hizo logout manual:
  - la extension muestra login en `Profile`
  - no muestra datos locales de workspace como sustituto
- Si la autenticacion no puede recuperarse:
  - la UI redirige a `Profile`
  - muestra aviso visible de reautenticacion requerida

## Reglas De Borrado Logico

Jerarquia oficial:

- borrar proyecto => proyecto + cambios + notas
- borrar cambio => cambio + notas
- borrar nota => solo nota

Columnas esperadas:

- `is_deleted`
- `deleted_at`
- `deleted_by`

Funciones SQL de referencia:

- `soft_delete_project`
- `soft_delete_change`
- `soft_delete_note`

Script:

- `sql/logical_delete_hierarchy_20260310.sql`

## Navegacion Principal

### Android

- `login`
- `home`
- `profile`
- `projects`
- `project_create`
- `project_edit/{projectId}`
- `project_detail/{projectId}`
- `project_changes/{projectId}`
- `change_detail/{changeId}`
- `change_create/{projectId}`
- `change_edit/{changeId}`

### Chrome

- Dashboard
- Projects
- Project Detail
- Changes
- Change Detail
- Profile
- Login
- Change History
- UI Guide
- navbar global con breadcrumb contextual
- clic en la marca `ProjectTrack` para volver a `Workspace / Dashboard`
- navegacion principal desde dropdown del usuario

Tabla de referencia para edicion manual de pantallas:

| Breadcrumb                                           | Archivo js                             |
| ---------------------------------------------------- | -------------------------------------- |
| `Workspace / Dashboard`                              | `Chrome/src/screens/dashboard.js`      |
| `Workspace / Projects`                               | `Chrome/src/screens/projects.js`       |
| `Workspace / Projects / New`                         | `Chrome/src/screens/project-editor.js` |
| `Workspace / Projects / Details`                     | `Chrome/src/screens/project-detail.js` |
| `Workspace / Projects / Details / Edit`              | `Chrome/src/screens/project-editor.js` |
| `Workspace / Login`                                  | `Chrome/src/screens/login.js`          |
| `Workspace / Profile`                                | `Chrome/src/screens/profile.js`        |
| `Workspace / Change History`                         | `Chrome/src/screens/change-history.js` |
| `Workspace / Theme Manager`                          | `Chrome/src/screens/theme-manager.js`  |
| `Workspace / Projects / Details / Changes`           | `Chrome/src/screens/changes.js`        |
| `Workspace / Projects / Details / Changes / Details` | `Chrome/src/screens/change-detail.js`  |
| `Workspace / Projects / Details / Changes / New`     | `Chrome/src/screens/change-editor.js`  |
| `Workspace / Projects / Details / Changes / Edit`    | `Chrome/src/screens/change-editor.js`  |

Si el cambio manual es sobre el navbar global, el breadcrumb o el clic en la marca `ProjectTrack`, editar `Chrome/src/projecttrack-app.js`.

## QA Y Documentos Auxiliares

Chrome:

- UI Guide: `Chrome/docs/projecttrack-ui.html`
- Theme Manager: `docs/chrome/theme-manager.md`
- Bootstrap migration tracking: `docs/chrome/bootstrap-migration-tracking.md`
- Deployment Chrome: `docs/chrome/deployment-github-releases.md`

Android:

- `Android/Casos_Uso_Pruebas.md`
- `Android/Lista_Errores_Pruebas.md`
- `Android/Lista_Mejoras_Pruebas.md`
- `Android/Lista_Pendientes_Verificacion.md`
- `Android/Runbook_Supabase_RLS.md`

IA:

- `docs/AGENTES_IA_PROJECTTRACK.md`
- `docs/AGENTES_IA_FEEDBACK_LOG.md`

## Riesgos Actuales

- RLS puede bloquear lectura/escritura aun con backend configurado.
- En ambientes nuevos, si `sql/app_releases_chrome_20260416.sql` no esta aplicado, `Profile / Extension Updates` mostrara que falta setup del canal de releases.
- GitHub Releases privado exige que el usuario tenga acceso al repo para descargar el zip.
- Chrome no permite auto-reemplazo completo de una extension `Load unpacked`; el paso final de actualizacion es manual.
- Si `public.users` falla, las sugerencias `@` se degradan.
- Si las credenciales guardadas dejan de ser validas, el relogin automatico dejara de funcionar hasta nuevo login manual.
- Todavia hay casos borde por consolidar entre ids locales y remotos.

## Hallazgos Activos

- `Tasks`: falta futura pantalla o widget de burndown chart apoyado en `change_task_events`.
- Documentacion funcional: falta seguir migrando a ingles donde aplique y mantener las guias vivas alineadas al runtime actual.
- CSS unico: validar visualmente que `workspace.html` y `Chrome/docs/projecttrack-ui.html` sigan correctos despues de consolidar estilos.
- Theme Manager: falta completar la galeria completa de componentes, ampliar tokens por componente, mejorar diff por impacto y reemplazar la auditoria automatica inicial por registro explicito completo.
- OpenCode: en este workspace la CLI puede resolver la raiz del proyecto como `C:\` en lugar del repo por la ruta con corchetes `[...]`; mientras no se corrija, conviene forzar `OPENCODE_CONFIG` apuntando a `opencode.jsonc` para que carguen agentes y comandos del proyecto.

## Pendientes Priorizados

1. Completar la implementacion real del Theme Manager: galeria de componentes, tokens por componente, diff por impacto, preview/compare de backups y registro explicito completo.
2. Ejecutar una revision profunda para confirmar que Chrome ya esta al 100% sobre Bootstrap real.
3. Crear una pagina de documentacion para el usuario final.
4. Continuar con el resto de pendientes y nuevas funciones priorizadas.
5. Validar visualmente el stack CSS unico en Chrome cargando `workspace.html`, `workspace.html?view=theme-manager` y `Chrome/docs/projecttrack-ui.html`.
6. Aplicar en Supabase la migracion `sql/change_tasks_excel_import_20260331.sql`.
7. Disenar la siguiente fase de `Tasks`: burndown chart por proyecto/cambio.
8. Cerrar documentacion funcional restante en ingles.
9. Refinar manejo de errores/policies reales en Chrome.
10. Confirmar estado final de borrado logico jerarquico en `prod`.
11. Evaluar canal futuro de actualizaciones automaticas si se requiere reemplazo sin pasos manuales, por ejemplo Chrome Web Store privado o gestion enterprise.
12. Completar campos avanzados de `changes`.
13. Depurar casos borde de ids locales vs remotos.

## Mejoras Futuras

- Reducir costo del full sync inicial en Chrome sin romper dashboard, conteos globales ni asignaciones por usuario.
- Integrar rutas locales por dispositivo:
  - `deviceId` por instalacion en `chrome.storage.local`
  - tabla `devices` con `device_id`, `user_id`, `os`, `root_path`, `device_name`, `last_seen`
  - guardar rutas funcionales como `relative_path`
  - resolver `absolute_path = root_path + relative_path`
  - UI de configuracion en `Profile`
  - apertura local real de archivos/carpetas mediante `Native Messaging`
  - arquitectura prevista para Windows y macOS
- Agregar unit tests.
- Agregar UI tests.
- Refinar visualmente detalles finales.

## Reglas Para IA Y Mantenimiento

- Leer este documento antes de analizar, proponer cambios o documentar el proyecto.
- Mantener aqui solo estado vigente, pendientes y decisiones actuales.
- No duplicar bitacora historica: usar `Change History` para cambios realizados.
- Para trabajo con agentes, seguir `docs/AGENTES_IA_PROJECTTRACK.md` y registrar fallas/mejoras en `docs/AGENTES_IA_FEEDBACK_LOG.md`.
- Si aparece un hallazgo nuevo del runtime o del UI, agregarlo aqui si afecta trabajo pendiente.
- Ruta con corchetes: el workspace contiene `[...]`, asi que en PowerShell conviene usar `-LiteralPath` o rutas absolutas bien escapadas para evitar que `[]` se interprete como patron.
- Si OpenCode no detecta esta carpeta como raiz del repo y cae en `C:\`, usar `OPENCODE_CONFIG=<ruta-absoluta>\opencode.jsonc` antes de ejecutar comandos o pruebas del sistema de agentes.
- Cualquier avance funcional o tecnico debe actualizar este documento primero.
