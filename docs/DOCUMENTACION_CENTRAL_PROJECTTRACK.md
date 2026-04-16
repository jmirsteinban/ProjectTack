# Documentacion Central - ProjectTrack

Actualizado al: 2026-04-01
Estado general: En progreso
Alcance actual: Android + Extension Chrome

## Objetivo

Concentrar en un solo archivo el estado funcional, tecnico y operativo de ProjectTrack para Android y Chrome.

## Ubicacion

- La documentacion central ahora vive en `docs/`.
- `docs/ToDo.md` es la lista operativa de hallazgos, pendientes y guia breve de analisis para IA.
- Los documentos historicos o especificos de Chrome viven en `docs/chrome/`.

## Resumen ejecutivo

- Android es la fuente funcional principal del producto.
- Chrome replica progresivamente la experiencia Android dentro de la extension unica en `Chrome/`.
- Chrome ya opera sobre un runtime unico activo montado desde `sidepanel.html`.
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

## Bitacora reciente

### 2026-04-01

- Se continuo la pasada `Bootstrap-first` en el runtime clasico de `workspace.html`.
- `Chrome/src/screens/profile.js` ya migro sus shells principales de `pt-screen-card`, `pt-row` y `pt-col-*` hacia `card bg-body-tertiary`, `card-body`, `row` y `col-*`.
- `Chrome/src/screens/project-editor.js` ya usa `card bg-body-tertiary`, `card-body`, `row` y `col-*` como estructura base del formulario y de los 3 panels de ambientes.
- `Chrome/src/screens/change-editor.js` ya usa `card bg-body-tertiary`, `card-body`, `row` y `col-*` como estructura base de informacion general, estado/prioridad, ambientes y accesos.
- `Chrome/src/screens/projects.js`, `Chrome/src/screens/changes.js` y `Chrome/src/screens/project-detail.js` ya removieron sus shells principales `pt-screen-card` / `pt-row-top` para priorizar `card bg-body-tertiary`, `card-header`, `card-body`, `row`, `col-*` y `d-flex`.
- `Chrome/src/screens/login.js` ya migro su wrapper principal a `card bg-body-tertiary` y `card-body`, conservando solo el shell propio del bloque de acceso.
- En esta ronda se deja `pt-*` solo para piezas de dominio que aun aportan comportamiento o estilo especifico, como grids de eleccion, sugerencias, chips y filas de URLs.

### 2026-03-31

- Se actualizo la documentacion central y operativa para reflejar la convencion visual vigente en Chrome.
- `.bg-body-tertiary` queda oficialmente alineado con el fondo real de `.card`, reutilizando `--pt-card-bg` como superficie neutra principal.
- La shell recomendada para cards, panels y demos documentales pasa a expresarse como `card bg-body-tertiary`.
- Se corrigieron en la guia viva los ejemplos y snippets de `Cards` para que vuelvan a ser copiables con markup valido y consistente con el runtime.
- Se registro tambien la ronda reciente sobre `Home / Projects / Details / Changes / Details`:
  - botones del hero ya cableados
  - layout interno alineado a `row` + `col-*`
  - wrappers de enlaces/rutas largas sin overflow horizontal
  - card de `QA` con esquinas menos redondeadas y sin sombra
  - pills de `status` y `priority` ahora se editan inline desde dropdowns en el header
  - cada cambio inline de `status` o `priority` ya genera una entrada persistente en `History`
  - el historico de cambios se persiste en `project_notes` con `is_todo = false`
  - se agrego la seccion `Tasks` debajo de `Environments`, con importacion de tracker Excel por cambio
  - la importacion de tareas ahora consume archivos `.xlsx` estilo tracker y registra tareas reales en `change_tasks`
  - `Tasks` ahora diferencia entre `Import Tasks from Excel` y `Replace Tasks`; el reemplazo elimina logicamente las tareas del cambio que no existan en el nuevo workbook
  - las tareas permiten actualizar `assignee` y `status` inline desde la pantalla de detalle del cambio
  - las notas ahora pueden vincular una o varias tareas del cambio mediante `project_note_task_links`
  - se agrego la bitacora base `change_task_events` para historico y futuro `burndown chart`
  - `Tasks` ahora permite exportar por rango manual `From TSKID / To TSKID`
  - se hizo una pasada de alineacion `Bootstrap-first` sobre listas del runtime; `Changes`, `Notes`, `History`, `Other Project Changes` y grupos de URLs del editor ya priorizan `list-group`
  - se redefinio el sistema de botones en 2 familias documentadas: `Hero buttons` con `pt-hero-button` y `Runtime buttons` con paleta Bootstrap-first
  - la guia viva `projecttrack-ui.html` ahora documenta tambien la receta oficial para botones contextuales con `bg-*-subtle` + `text-*-emphasis` + `border-*-subtle`
  - `sidepanel.html` ya no monta la app completa: ahora funciona como launcher vertical con accesos a `dashboard.html`, `workspace.html` y acciones compactas del panel
  - el icono principal de la extension ahora abre `popup.html` con 2 opciones explicitas: `ProjectTrack` y `SidePanel`
  - se agrego `dashboard.html` como primera superficie full-tab Bootstrap-first usando Bootstrap local real en `Chrome/vendor/bootstrap`
  - se agrego `workspace.html` como shell de transicion para seguir abriendo la app actual completa fuera del panel lateral
  - se versionaron `projecttrack-theme.css` y `projecttrack-fulltab.css` para separar branding compartido de la nueva capa web full-tab
  - la migracion requerida para Supabase queda versionada en `Android/sql/change_tasks_excel_import_20260331.sql`

### 2026-03-25

- Se creo `docs/ToDo.md` como lista operativa principal de hallazgos y pendientes del proyecto.
- `docs/ToDo.md` queda definido como archivo de referencia corta para IA: debe revisarse antes de analizar, proponer cambios o documentar el runtime.
- Se migro a `docs/ToDo.md` solo la informacion util y pendiente del antiguo seguimiento operativo de Chrome.
- Se elimino `docs/chrome/Seguimiento_Chrome_ProjectTrack.md` para evitar duplicidad de control.
- Se actualizo la documentacion viva de Chrome para reflejar la evolucion reciente del sistema UI en `docs/chrome/projecttrack-ui.html`.
- Se documento formalmente `Hero card` dentro de la guia de componentes para dejar visible el patron real usado por el runtime de dashboard y pantallas principales.
- Se redefinio la escala tipografica `text-step-*` del sistema:
  - `step--3 = 3px`
  - `step--2 = 6px`
  - `step--1 = 9px`
  - `step-0 = 12px`
  - `step-1 = 18px`
  - `step-2 = 24px`
  - `step-3 = 36px`
  - `step-4 = 48px`
  - `step-5 = 72px`
- Se agregaron al sistema las clases nuevas:
  - `text-step-4`
  - `text-step-5`
  - `pt-text-step-4`
  - `pt-text-step-5`
- Se incorporaron utilidades de margen negativo compatibles con la escala de spacing actual:
  - `m-n1` a `m-n5`
  - `mt-n1` a `mt-n5`
  - `me-n1` a `me-n5`
  - `mb-n1` a `mb-n5`
  - `ms-n1` a `ms-n5`
  - `mx-n1` a `mx-n5`
  - `my-n1` a `my-n5`
- Se incorporaron utilidades de margen automatico para alineacion flexible en layout:
  - `m-auto`
  - `me-auto`
  - `ms-auto`
  - `mx-auto`
  - `my-auto`
- Se extendio `pt-pill` para soportar dos tamanos:
  - `pt-pill` / `pt-pill--sm` como tamano pequeno
  - `pt-pill--md` como tamano mediano alineado al `badge`
- Se actualizaron los ejemplos de `Pills` en la guia viva para mostrar ambos tamanos y dejar claro el uso recomendado dentro de Bootstrap-ProjectTrack.
- Se amplio tambien la documentacion de spacing en la guia viva para dejar visibles los casos de `margin auto` dentro de Bootstrap-ProjectTrack.
- Se aplico una ronda manual de refinado visual en `Chrome/src/screens/change-detail.js` para `Home / Projects / Details / Changes / Details`.
- En esa pantalla quedaron reordenados:
  - hero superior con proyecto, titulo del cambio y card de `Environment Path`
  - header de `Change Details` con pills alineadas al extremo usando utilidades `auto`
  - cuerpo principal con bloques separados para `Project`, `Change`, `Details`, `Workfront`, `OneDrive` y ambientes visibles
  - seccion `Notes` con toolbar superior mas clara y consistente con el resto del runtime
- Se extendio el nuevo patron de `pt-screen-hero` al resto de pantallas principales que aun usaban el shell anterior basado en:
  - `pt-screen-hero-layout`
  - `pt-screen-hero-main`
  - `pt-screen-hero-actions`
  - `pt-screen-hero-button-row`
- El hero vigente para Chrome pasa a documentarse y usarse con composicion basada en `row` + `col-*`, siguiendo el mismo criterio visual ya adoptado en `projects.js` y `change-detail.js`.

### 2026-03-23

- Se renombro el concepto `Bootstrap-like` a `Bootstrap-ProjectTrack` en la documentacion y comentarios del sistema UI para dejar una nomenclatura mas propia del producto.
- Se corrigio la redaccion de la documentacion para dejar explicito que `Bootstrap-ProjectTrack` es el design system base de Chrome y `Grid` la capa de layout con viewport minimo de `360px`, ancho de diseno optimo de `550px` y breakpoints propios.
- Se documento el criterio final de layout para Chrome: `row` + `col-*` queda como API publica por defecto de `Bootstrap-ProjectTrack`; `pt-row` + `pt-col-*` permanece solo en composiciones existentes o casos internos basados en CSS Grid, sin mezclar ambas estrategias en el mismo bloque.
- Se ajusto `Inicio / Dashboard` en Chrome para que la cola de trabajo muestre cambios activos asignados al usuario y los paneles de cola/notas usen estructura `card` mas consistente con `Bootstrap-ProjectTrack`.
- Se inicio tambien la pasada de QA visual por pantalla sobre `Home / Dashboard`, afinando `Work Queue` y `Latest Notes Mentioning You` con mejor jerarquia de chips, metadatos, conteos y spacing sin cambiar la navegacion del runtime.
- Se cerro una ronda manual adicional de `Home / Dashboard`: `Work Queue` y `Latest Notes Mentioning You` quedaron homologados entre si con layout basado en `row/col`, mejor orden de proyecto/titulo/meta, pills compactos y cards internas que ya respetan mejor la altura real del contenido.
- Se documento la migracion global a ingles para Chrome: en la primera fase se traduce el texto visible del runtime y la documentacion funcional, mientras el naming tecnico interno se mantiene estable hasta una fase posterior de refactor si se aprueba.
- Se inicio la `Orden -1` de idioma en el runtime activo de Chrome:
  - `Chrome/src/projecttrack-app.js`
  - `Chrome/src/screens/dashboard.js`
  - `Chrome/src/screens/projects.js`
  - `Chrome/src/services/mock-data.js`
- En esa primera rebanada ya quedaron en ingles:
  - breadcrumb y shell global
  - notices, dialogs y mensajes base del runtime
  - `Dashboard`
  - `Projects`
  - copy visible principal del mock de demo
- Se amplio la misma `Orden -1` al siguiente bloque visible del runtime:
  - `Chrome/src/screens/project-detail.js`
  - `Chrome/src/screens/changes.js`
  - `Chrome/src/screens/change-detail.js`
  - `Chrome/src/screens/login.js`
  - `Chrome/src/screens/profile.js`
  - `Chrome/src/screens/project-editor.js`
  - `Chrome/src/screens/change-editor.js`
  - `Chrome/src/components/environment-progress.js`
  - `Chrome/src/services/backend.js`
  - `Chrome/src/services/workspace-store.js`
- Con esa segunda rebanada ya quedaron en ingles:
  - detalles de proyecto y cambio
  - listado de cambios
  - login
  - profile
  - editores principales
  - mensajes compartidos de backend y sync
  - progreso visual de ambientes
- Se cerraron tambien residuos visibles fuera de pantallas principales:
  - mensajes de arranque en `Chrome/src/main.js`
  - errores y respuestas del host nativo en `Chrome/src/services/native-host.js`
- Se actualizo la referencia funcional de breadcrumbs en la documentacion central para reflejar la navegacion visible actual del runtime:
  - `Home / Dashboard`
  - `Home / Projects`
  - `Home / Projects / Details`
  - `Home / Projects / Details / Changes`
  - `Home / Profile`
- Se actualizo la `Orden de trabajo` de Chrome para reflejar el estado real tras la migracion de idioma:
  - la mayor parte del runtime activo ya paso de implementacion a fase de QA manual
  - el foco siguiente queda en revision visual, deteccion de copy residual y cierre de documentacion funcional restante
- Se registro QA manual de idioma como correcto en las pantallas principales del runtime activo:
  - `Home / Dashboard`
  - `Home / Projects`
  - `Home / Projects / Details`
  - `Change Screens`
  - `Home / Profile`
  - `Home / Login`
- Con ese resultado, la cola de trabajo se ajusta para dejar el idioma del runtime principal como validado en uso comun y mover el foco a:
  - QA visual por pantalla
  - ajustes finos de layout y color
  - documentacion funcional restante en ingles

### 2026-03-22

- Se consolido la capa UI Bootstrap-ProjectTrack en `Chrome/styles/projecttrack.css`.
- La referencia viva del sistema queda en:
  - `docs/chrome/projecttrack-ui.html`
- La capa compatible ya cubre, entre otros:
  - `btn`
  - `form-*`
  - `alert`
  - `modal`
  - `breadcrumb`
  - `nav`
  - `navbar`
  - `card`
  - `list-group`
  - `badge`
  - `progress`
  - `table`
- Los aliases `pt-*` permanecen para identidad visual del producto y componentes de dominio, no como reemplazo de la base.
- El runtime real de Chrome queda confirmado en:
  - `Chrome/sidepanel.html`
  - `Chrome/src/main.js`
  - `Chrome/src/projecttrack-app.js`
  - `Chrome/src/projecttrack-router.js`
- Se normalizo el naming del runtime activo:
  - se retiraron sufijos `live` y `v2` de archivos y exports activos
  - el arbol actual de `Chrome/src` usa nombres base mas directos para app, router, state, screens y services
- El navbar global ahora:
  - usa breadcrumb semantico basado en la vista actual
  - permite volver a `Home / Dashboard` al hacer clic en la marca `ProjectTrack`
- Se documentaron y refinaron las metric cards del dashboard usando `card + card-body + badge`.
- Se migraron a la capa UI nueva estas pantallas reales:
  - `Inicio / Login`
  - `Inicio / Perfil`
  - `Inicio / Proyectos`
  - `Inicio / Proyectos / Detalle`
  - `Inicio / Proyectos / Detalle / Editar`
  - `Inicio / Proyectos / Detalle / Cambios`
  - `Inicio / Proyectos / Detalle / Cambios / Detalle`
  - `Inicio / Proyectos / Detalle / Cambios / Editar`
- Las acciones, formularios, notices y modales de esas vistas ya usan semantica nueva:
  - `btn`
  - `form-control`
  - `alert`
  - `modal`
- Se dejo la extension lista para una pasada visual final del sidepanel y limpieza posterior de codigo legacy.

### 2026-03-16

- Se analizo el riesgo de congelamiento del navegador durante login en `Chrome/src`, con foco en macOS.
- Se confirmo que el login en Chrome no solo autentica:
  - tambien dispara recarga completa del workspace remoto
  - y luego renderiza vistas con varios recorridos sobre proyectos, cambios y notas
- Se aplicaron mitigaciones seguras en Chrome:
  - boton de login bloqueado mientras el proceso esta en curso
  - estado visible de progreso durante autenticacion y sincronizacion inicial
  - trazas de tiempo por consola para:
    - login
    - bootstrap inicial del workspace
    - recarga posterior al login
  - seleccion por id devuelto al crear:
    - proyecto
    - cambio
- Estas mitigaciones buscan reducir reintentos concurrentes de login y hacer visible cuando el panel sigue procesando en segundo plano.
- No se aplico aun paginacion dura ni recorte de lecturas remotas para evitar romper:
  - conteos globales del dashboard
  - fallback actuales de seleccion
  - resolucion de usuarios para asignaciones
- Se verifico tambien un problema de layout en Chrome para vistas con ancho base intermedio, ahora redefinido sobre `550px`.
- La causa compartida estaba en los stacks de ambientes:
  - `pt-detail-environment-stack`
  - `pt-project-environments-stack`
- Esos contenedores permanecian en una sola columna aun en ancho intermedio, afectando:
  - `Inicio / Proyectos / Detalle`
  - `Inicio / Proyectos / Detalle / Editar`
  - `Inicio / Proyectos / Detalle / Cambios / Detalle`
- Se aplico ajuste responsive para que desde `550px` distribuyan tarjetas de ambiente con `repeat(auto-fit, minmax(220px, 1fr))`.
- Se inicio una capa utility de layout interna en `Chrome/styles/projecttrack.css`, inspirada en frameworks tipo Bootstrap pero implementada con clases propias `pt-*`.
- La nueva base incluye:
  - stacks con espaciado consistente
  - filas de 12 columnas (`row/col`)
  - spans responsive para `550px` y `960px`
  - grids autoajustables para tarjetas y secciones
- Las primeras pantallas migradas al nuevo sistema fueron:
  - `Inicio / Proyectos / Detalle`
  - `Inicio / Proyectos / Detalle / Editar`
  - `Inicio / Proyectos / Detalle / Cambios / Detalle`
- El objetivo es dejar de crear wrappers de layout por pantalla y mover el proyecto hacia una base mas estandar y reutilizable.
- Se extendio la segunda fase del sistema UI hacia pantallas base:
  - `Inicio / Dashboard`
  - `Inicio / Proyectos`
  - `Inicio / Perfil`
- El sistema visual de la extension Chrome pasa a llamarse `ProjectTrack UI`.
- La capa de layout dentro de ese sistema queda nombrada simplemente como `Grid`.
- El contrato actual de viewport para `ProjectTrack UI` queda asi:
  - minimo soportado: `360px`
  - ancho de diseno optimo: `550px`
  - por debajo de `550px` la interfaz se reduce proporcionalmente como zoom desde el host
  - por encima de `550px` la composicion prioriza ajuste horizontal responsivo
- Se agrego documentacion HTML viva del CSS en:
  - `docs/chrome/projecttrack-ui.html`
- Esa pagina carga:
  - la hoja consolidada `Chrome/styles/projecttrack.css`
- La documentacion actual cubre atomos base con ejemplos renderizados para:
  - layout
  - acciones
  - formularios
  - estados
  - superficies
  - feedback
- Se refactorizo la extension Chrome para ejecutarse como una sola app:
  - `sidepanel.html` monta `ProjectTrack` directamente
  - se elimino la capa legacy de `shell/router` multiapp
  - el contrato de viewport de `ProjectTrack UI` quedo absorbido en el entrypoint unico
- La extension deja de presentarse como `Workspace` y pasa a identificarse solo como `ProjectTrack`.

### 2026-03-13

- Se centralizo la documentacion del proyecto en este archivo unico.
- Chrome quedo con auth real inicial usando email/password desde `Perfil`.
- Chrome dejo de usar fallback local silencioso para workspace.
- Chrome ahora guarda credenciales validas en `Perfil` para relogin automatico.
- Chrome distingue entre:
  - primer login pendiente
  - sesion expirada recuperable automaticamente
  - logout manual
- Chrome ya lee remoto:
  - proyectos
  - cambios
  - usuarios
  - asignados de cambio
  - notas
  - asignados de nota
- Chrome ya intenta escritura remota inicial para:
  - proyectos
  - cambios
  - notas
- Chrome ya intenta borrado logico remoto para:
  - proyectos
  - cambios
  - notas
- Chrome ya muestra diagnostico visible cuando una operacion queda remota o requiere reautenticacion.
- Se analizo una mejora nueva para rutas locales de OneDrive por dispositivo usando `Native Messaging`.
- La mejora queda documentada como pendiente por integrar despues de estabilizar la app y completar pruebas.

### 2026-03-12

- Se construyo la base funcional de la extension Chrome en `Chrome/src` y `Chrome/styles`.
- Se clonaron visualmente las pantallas principales de Android:
  - Dashboard
  - Proyectos
  - Cambios
  - Perfil
  - Detalles y editores
- Se habilito persistencia local con `chrome.storage`.
- Se dejo lista la primera capa de configuracion de backend en `Perfil`.

## Estructura del proyecto

- `Android/`
  - app principal en Jetpack Compose
  - SQL de referencia
  - runbooks y documentos QA
- `Chrome/`
  - extension unica de ProjectTrack
  - host minimo del side panel
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

- `Chrome/sidepanel.html` monta la extension real
- `Chrome/src/main.js` inicializa viewport y monta la app viva
- `Chrome/src/projecttrack-app.js` controla navbar global, overlays, acciones y estado principal
- `Chrome/src/projecttrack-router.js` resuelve la vista activa
- `Chrome/styles/projecttrack.css` concentra tokens, capa Bootstrap-ProjectTrack y skin propia de ProjectTrack
- `docs/chrome/projecttrack-ui.html` documenta la capa UI y sirve como referencia viva

### Vistas activas del runtime

- Dashboard
- Proyectos
- Detalle de proyecto
- Cambios
- Detalle de cambio
- Perfil
- Editor de proyecto
- Editor de cambio

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
- El navbar global ya usa breadcrumb semantico y la marca lleva a `Home / Dashboard`.
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

- `Android/sql/logical_delete_hierarchy_20260310.sql`

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
- clic en la marca `ProjectTrack` para volver a `Home / Dashboard`
- navegacion principal desde dropdown del usuario

Tabla de referencia para edicion manual de pantallas:

| Breadcrumb                                      | Archivo js                             |
| ----------------------------------------------- | -------------------------------------- |
| `Home / Dashboard`                              | `Chrome/src/screens/dashboard.js`      |
| `Home / Projects`                               | `Chrome/src/screens/projects.js`       |
| `Home / Projects / New`                         | `Chrome/src/screens/project-editor.js` |
| `Home / Projects / Details`                     | `Chrome/src/screens/project-detail.js` |
| `Home / Projects / Details / Edit`              | `Chrome/src/screens/project-editor.js` |
| `Home / Login`                                  | `Chrome/src/screens/login.js`          |
| `Home / Profile`                                | `Chrome/src/screens/profile.js`        |
| `Home / Projects / Details / Changes`           | `Chrome/src/screens/changes.js`        |
| `Home / Projects / Details / Changes / Details` | `Chrome/src/screens/change-detail.js`  |
| `Home / Projects / Details / Changes / New`     | `Chrome/src/screens/change-editor.js`  |
| `Home / Projects / Details / Changes / Edit`    | `Chrome/src/screens/change-editor.js`  |

Nota:

- Si el cambio manual es sobre el navbar global, el breadcrumb o el clic en la marca `ProjectTrack`, editar `Chrome/src/projecttrack-app.js`.

## QA y documentos auxiliares

Documento operativo principal para IA y seguimiento:

- `docs/ToDo.md`

Documentos QA Android:

- `Android/Casos_Uso_Pruebas.md`
- `Android/Lista_Errores_Pruebas.md`
- `Android/Lista_Mejoras_Pruebas.md`
- `Android/Lista_Pendientes_Verificacion.md`

Runbook y seguridad:

- `Android/Runbook_Supabase_RLS.md`

## Riesgos actuales

- RLS puede bloquear lectura/escritura aun con backend configurado
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
- ejecutar pasada visual del sidepanel Chrome sobre el runtime activo:
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

Ejecutar una pasada de QA visual y funcional del sidepanel Chrome sobre el runtime activo, incluyendo:

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
  - `docs/chrome/projecttrack-ui.html`

La mejora de rutas locales por dispositivo queda deliberadamente fuera de este paso y pendiente hasta terminar estabilizacion general y pruebas funcionales.

## Nota de mantenimiento

Este es el documento canonico del proyecto. Cualquier avance funcional o tecnico debe actualizarse aqui primero.
