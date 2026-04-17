# Documentacion Central - ProjectTrack

Actualizado al: 2026-04-17
Estado general: En progreso
Alcance actual: Android + Extension Chrome

## Objetivo

Concentrar en un solo archivo el estado funcional, tecnico y operativo de ProjectTrack para Android y Chrome.

## Ubicacion

- La documentacion central ahora vive en `docs/`.
- `docs/ToDo.md` es la lista operativa de hallazgos, pendientes y guia breve de analisis para IA.
- `docs/AGENTES_IA_PROJECTTRACK.md` define roles, prompts, ownership y feedback para trabajo con agentes IA.
- `docs/AGENTES_IA_FEEDBACK_LOG.md` registra fallas, aciertos y mejoras de ciclos con agentes IA.
- Los documentos historicos o especificos de Chrome viven en `docs/chrome/`.

## Resumen ejecutivo

- Android es la fuente funcional principal del producto.
- Chrome replica progresivamente la experiencia Android dentro de la extension unica en `Chrome/`.
- Chrome ya opera sobre una experiencia popup/full-tab activa; el side panel queda oculto temporalmente hasta nuevo aviso.
- Chrome ya consolida una capa UI Bootstrap-ProjectTrack documentada y usada por el runtime real.
- `docs/ToDo.md` pasa a ser la referencia corta para seguimiento activo, hallazgos y pendientes.
- La guia viva de Chrome ya documenta `Hero card`, la escala tipografica `text-step-*` actualizada, utilidades de margen negativo/auto y variantes `pt-pill` con tamanos `sm` y `md`.
- La shell neutra recomendada para cards y panels en Chrome es `card bg-body-tertiary`, con `.bg-body-tertiary` mapeado a `--pt-card-bg`.
- Para listas apiladas, la shell recomendada en runtime es `list-group` + `list-group-item`, dejando `pt-*` solo para layout o tipografia de dominio.
- En Chrome, `Bootstrap-ProjectTrack` es el design system base y `Grid` es la capa de layout, con viewport minimo de `360px`, ancho de diseno optimo de `550px` y breakpoints propios.
- Se define como direccion actual del producto en Chrome una migracion global a ingles para texto visible del runtime y documentacion funcional.
- Supabase es el backend real para datos, auth y reglas RLS.
- `Home / Projects / Details / Changes / Details` ya incluye una seccion `Tasks` con importacion `.xlsx`, asignacion inline, cambio de estado y vinculacion de notas con tareas.
- `Home / Projects / Details / Changes / Details` ya incluye tambien `Replace Tasks` y exportacion de `Tasks` por rango `TSKID`.
- Chrome ya tiene:
  - auth real inicial
  - lectura remota inicial
  - escritura remota inicial
  - borrado logico remoto inicial
  - relogin automatico con credenciales guardadas
- La distribucion privada de Chrome ya no depende de OneDrive como entrega principal: GitHub Releases privado guarda el `.zip` y Supabase `public.app_releases` guarda la metadata de version.
- `Profile / Extension Updates` consulta Supabase con sesion autenticada y abre el release privado de GitHub cuando hay una version nueva.
- La extension no guarda tokens de GitHub; el usuario descarga el paquete con una cuenta autorizada.
- Por limitacion de Chrome en extensiones `Load unpacked`, la actualizacion sigue siendo manual: descargar, descomprimir sobre la carpeta local y presionar `Reload`.

## Change History

La bitacora operativa del proyecto se movio a la pagina `Change History` del workspace Chrome para evitar duplicidad y mantener el historico visible desde el producto.

Fuente actual del historico:

- `Chrome/src/data/project-changelog.js`
- `Chrome/src/screens/change-history.js`

Acceso en Chrome:

- Abrir `workspace.html`.
- Menu de usuario.
- `UI Guide`.
- `Change History`.

## Estructura del proyecto

- `Android/`
  - app principal en Jetpack Compose
  - SQL de referencia
  - runbooks y documentos QA
- `Chrome/`
  - extension unica de ProjectTrack
  - popup y experiencia full-tab activa
  - side panel conservado en archivos pero oculto temporalmente
- `Chrome/src/`
  - runtime principal de ProjectTrack en `JavaScript`
- `Chrome/styles/`
  - estilos globales y de aplicacion

## Stack tecnico

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
- `chrome.storage`
- Supabase REST/Auth

## Configuracion Supabase

- Credenciales de referencia leidas desde `Android/ProjectTrack/local.properties`:
  - `SUPABASE_URL`
  - `SUPABASE_PUBLISHABLE_KEY`
- La extension Chrome puede guardar su propia configuracion en `Perfil`.
- En Chrome, la key publica sola no basta si RLS permite lectura solo a `authenticated`.

## Android - estado funcional

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

### Modelo de negocio clave

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

## Chrome - estado funcional

### Runtime activo

- `Chrome/popup.html` es la entrada visible desde el icono de la extension
- `Chrome/workspace.html` abre la experiencia full-tab principal
- `Chrome/dashboard.html` queda como pagina Bootstrap-first de referencia durante la transicion
- `Chrome/sidepanel.html` permanece en el repo, pero esta oculto temporalmente en el manifest y el popup
- `Chrome/src/main.js` monta la app viva sin escalado tipo panel lateral
- `Chrome/src/projecttrack-app.js` controla navbar global, overlays, acciones y estado principal
- `Chrome/src/projecttrack-router.js` resuelve la vista activa
- `Chrome/styles/projecttrack-workspace.css` define la capa full-tab del workspace
- `Chrome/styles/projecttrack.css` queda como capa legacy transicional para estilos `pt-*`
- `Chrome/docs/projecttrack-ui.html` documenta la capa UI y sirve como referencia viva

### Vistas activas del runtime

- Dashboard
- Proyectos
- Detalle de proyecto
- Cambios
- Detalle de cambio
- Perfil
- Editor de proyecto
- Editor de cambio
- Change History

### Estado UI actual

- La base recomendada en Chrome es `Bootstrap-ProjectTrack` como design system y `Grid` como capa de layout de `ProjectTrack UI`.
- Criterio actual de idioma:
  - el runtime de Chrome y la documentacion funcional deben converger a ingles
  - en la primera fase se traduce texto visible, labels, mensajes, breadcrumbs y ayuda de uso
  - el naming tecnico interno del codigo no se renombra por defecto dentro de esa misma fase
- Avance actual de esa migracion:
  - shell global del runtime en ingles
  - `Dashboard` en ingles
  - `Projects` en ingles
  - `Project Detail` en ingles
  - `Changes` en ingles
  - `Change Detail` en ingles
  - `Login` en ingles
  - `Profile` en ingles
  - `Project Editor` en ingles
  - `Change Editor` en ingles
  - mock visible base en ingles para evitar mezcla de UI en ingles con datos demo en espanol
  - mensajes de backend/sync y progreso de ambientes en ingles
  - mensajes de arranque y host nativo en ingles
  - breadcrumbs funcionales documentados en ingles
- El contrato de viewport de esa capa queda asi:
  - minimo soportado: `360px`
  - ancho de diseno optimo: `550px`
  - por debajo de `550px` la interfaz se reduce proporcionalmente como zoom desde el host
  - desde `550px` en adelante la composicion prioriza responsive horizontal real
- La convencion de desarrollo adopta naming compatible con Bootstrap 5.3 para utilities y layout, pero conserva breakpoints propios:
  - `sm = 550px`
  - `md = 700px`
  - `lg = 960px`
  - `xl = 1200px`
  - `xxl = 1400px`
- La capa actual expone componentes y utilidades compatibles con Bootstrap 5.3 para:
  - layout
  - botones
  - formularios
  - alerts
  - modales
  - breadcrumb
  - nav/navbar
  - cards
  - list groups
  - badges
  - tablas
  - progress
- Convencion actual de superficies neutras:
  - `card bg-body-tertiary` es la shell recomendada para cards nuevas, panels y bloques documentales
  - `.bg-body-tertiary` reutiliza `--pt-card-bg` para coincidir con el fondo real de la capa `card`
- Las clases `pt-*` se mantienen como:
  - identidad visual del producto
  - aliases de compatibilidad
  - componentes de dominio que no conviene volver genericos
- Criterio actual de layout:
  - `row` + `col-*` es la API publica recomendada para documentacion, nuevas pantallas y refactors de layout simples
  - `pt-row` + `pt-col-*` se conserva solo para layout interno existente o composiciones que dependen de su variante basada en CSS Grid
  - no se deben mezclar ambas estrategias dentro del mismo bloque de composicion
- Ya quedaron migradas al nuevo lenguaje visual las vistas mas usadas del runtime:
  - login
  - perfil
  - proyectos
  - detalle de proyecto
  - cambios
  - detalle de cambio
  - editores de proyecto y cambio
- El navbar global ya usa breadcrumb semantico y la marca lleva a `Workspace / Dashboard`.
- Los dialogs principales de confirmacion y notas ya usan estructura `modal`.
- Los notices globales ya usan estructura `alert`.

### Funcionalidad local

- busqueda de proyectos
- filtro de actividad
- busqueda de cambios
- menciones `@`
- almacenamiento local de:
  - configuracion backend
  - sesion
  - credenciales validadas para auto relogin

### Integracion real actual

- Auth real con email/password en `Perfil`
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

### Deployment privado Chrome

- El paquete instalable de Chrome se genera desde `scripts/package-chrome-release.ps1`.
- El release se publica como asset privado en GitHub Releases.
- La metadata visible para la extension vive en Supabase:
  - tabla: `public.app_releases`
  - app: `projecttrack-chrome`
  - migracion: `sql/app_releases_chrome_20260416.sql`
- El panel `Profile / Extension Updates` compara la version local de `Chrome/manifest.json` con la version activa de Supabase.
- Estado validado: con la version local `0.1.0`, el panel confirma que la extension esta al dia.
- Si existe una version nueva, la extension abre el release privado para que el usuario descargue `ProjectTrack-Chrome.zip`.
- No se guarda token de GitHub en la extension.
- La actualizacion de una extension cargada con `Load unpacked` requiere paso manual:
  - descargar zip
  - descomprimir sobre la carpeta local
  - presionar `Reload` en `chrome://extensions`

### Comportamiento de sync en Chrome

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
  - la extension muestra login en `Perfil`
  - no muestra datos locales de workspace como sustituto
- Si la autenticacion no puede recuperarse:
  - la UI redirige a `Perfil`
  - muestra aviso visible de reautenticacion requerida

## Reglas de borrado logico

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

## Navegacion principal

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
- navbar global con breadcrumb contextual
- clic en la marca `ProjectTrack` para volver a `Workspace / Dashboard`
- navegacion principal desde dropdown del usuario

Tabla de referencia para edicion manual de pantallas:

| Breadcrumb                                      | Archivo js                             |
| ----------------------------------------------- | -------------------------------------- |
| `Workspace / Dashboard`                              | `Chrome/src/screens/dashboard.js`      |
| `Workspace / Projects`                               | `Chrome/src/screens/projects.js`       |
| `Workspace / Projects / New`                         | `Chrome/src/screens/project-editor.js` |
| `Workspace / Projects / Details`                     | `Chrome/src/screens/project-detail.js` |
| `Workspace / Projects / Details / Edit`              | `Chrome/src/screens/project-editor.js` |
| `Workspace / Login`                                  | `Chrome/src/screens/login.js`          |
| `Workspace / Profile`                                | `Chrome/src/screens/profile.js`        |
| `Workspace / Change History`                         | `Chrome/src/screens/change-history.js` |
| `Workspace / Projects / Details / Changes`           | `Chrome/src/screens/changes.js`        |
| `Workspace / Projects / Details / Changes / Details` | `Chrome/src/screens/change-detail.js`  |
| `Workspace / Projects / Details / Changes / New`     | `Chrome/src/screens/change-editor.js`  |
| `Workspace / Projects / Details / Changes / Edit`    | `Chrome/src/screens/change-editor.js`  |

Nota:

- Si el cambio manual es sobre el navbar global, el breadcrumb o el clic en la marca `ProjectTrack`, editar `Chrome/src/projecttrack-app.js`.

## QA y documentos auxiliares

Documento operativo principal para IA y seguimiento:

- `docs/ToDo.md`

Deployment Chrome:

- `docs/chrome/deployment-github-releases.md`

Documentos QA Android:

- `Android/Casos_Uso_Pruebas.md`
- `Android/Lista_Errores_Pruebas.md`
- `Android/Lista_Mejoras_Pruebas.md`
- `Android/Lista_Pendientes_Verificacion.md`

Runbook y seguridad:

- `Android/Runbook_Supabase_RLS.md`

## Riesgos actuales

- RLS puede bloquear lectura/escritura aun con backend configurado
- en ambientes nuevos, si `sql/app_releases_chrome_20260416.sql` no esta aplicado, `Profile / Extension Updates` mostrara que falta setup del canal de releases
- GitHub Releases privado exige que el usuario tenga acceso al repo para descargar el zip
- Chrome no permite auto-reemplazo completo de una extension `Load unpacked`; el paso final de actualizacion es manual
- si `public.users` falla, las sugerencias `@` se degradan
- si cambian las credenciales guardadas o dejan de ser validas, el relogin automatico dejara de funcionar hasta nuevo login manual
- todavia hay casos borde por consolidar entre ids locales y remotos

## Pendientes prioritarios

### Alta prioridad

- validar flujo autenticado completo en Chrome:
  - crear/editar proyecto
  - crear/editar cambio
  - crear/editar/completar/eliminar nota
  - delete remoto de proyecto y cambio
- ejecutar pasada visual de la experiencia Chrome activa:
  - dashboard
  - proyectos
  - detalle de proyecto
  - cambios
  - detalle de cambio
  - perfil y editores
- revisar consistencia responsive entre `360px` y `550px` en las vistas ya migradas
- validar en macOS el flujo de login ya endurecido para confirmar:
  - ausencia de congelamiento visible del navegador
  - duraciones reales de auth y sync inicial usando consola
- refinar manejo de errores/policies reales en Chrome
- confirmar estado final de migracion de borrado logico jerarquico en `prod`

### Media prioridad

- evaluar canal futuro de actualizaciones automaticas si se requiere reemplazo sin pasos manuales, por ejemplo Chrome Web Store privado o gestion enterprise
- completar campos avanzados de `changes`
- depurar casos borde de ids locales vs remotos
- reducir costo del full sync inicial en Chrome sin romper:
  - dashboard
  - conteos globales
  - asignaciones por usuario
- afinar el dashboard mas alla de metricas y hero
- limpieza tecnica de codigo duplicado y archivos legacy en Chrome
- mejora pendiente por integrar:
  - gestion de rutas locales de OneDrive por dispositivo
  - `deviceId` por instalacion en `chrome.storage.local`
  - tabla `devices` en backend con `device_id`, `user_id`, `os`, `root_path`, `device_name`, `last_seen`
  - guardar rutas funcionales como `relative_path`
  - resolver `absolute_path = root_path + relative_path`
  - UI de configuracion dentro de `Perfil`, en una seccion nueva `Dispositivo`
  - apertura local real de archivos/carpetas mediante `Native Messaging`
  - arquitectura prevista para Windows y macOS

### Baja prioridad

- unit tests
- UI tests
- refinamiento visual final

## Proximo paso recomendado

Ejecutar una pasada de QA visual y funcional de la experiencia Chrome activa, incluyendo:

- revision visual de:
  - navbar y breadcrumb
  - dashboard
  - proyectos
  - detalle de proyecto
  - cambios
  - detalle de cambio
  - perfil y editores
- validacion funcional de:
  - primer login desde `Perfil`
  - cierre manual de sesion
  - expiracion de sesion con relogin automatico
  - bloqueo correcto de vistas cuando no exista sesion valida
  - formularios, alerts y modales migrados
- comparacion contra la guia viva en:
  - `Chrome/docs/projecttrack-ui.html`

La mejora de rutas locales por dispositivo queda deliberadamente fuera de este paso y pendiente hasta terminar estabilizacion general y pruebas funcionales.

## Nota de mantenimiento

Este es el documento canonico del proyecto. Cualquier avance funcional o tecnico debe actualizarse aqui primero.
