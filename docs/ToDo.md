# ToDo - ProjectTrack

Actualizado al: 2026-04-17
Proposito: Lista operativa de hallazgos y pendientes activos del proyecto
Guia IA: Leer este archivo antes de analizar, proponer cambios o documentar el proyecto
Documento canonico de estado: `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`
Guia viva UI: `docs/chrome/projecttrack-ui.html`
Guia deployment Chrome: `docs/chrome/deployment-github-releases.md`
Guia agentes IA: `docs/AGENTES_IA_PROJECTTRACK.md`
Log feedback agentes IA: `docs/AGENTES_IA_FEEDBACK_LOG.md`

## Contexto clave

- Proyecto: `ProjectTrack`
- Ruta raiz repo: `./`
- Ruta proyecto Android: `Android/`
- Ruta proyecto Chrome: `Chrome/`
- Ruta documentacion general: `docs/`
- Ruta documentacion Chrome: `docs/chrome/`
- Guia deployment Chrome privado: `docs/chrome/deployment-github-releases.md`
- Guia agentes IA: `docs/AGENTES_IA_PROJECTTRACK.md`
- Log feedback agentes IA: `docs/AGENTES_IA_FEEDBACK_LOG.md`
- Migracion metadata releases Chrome: `Android/sql/app_releases_chrome_20260416.sql`
- Runtime Chrome activo: `Chrome/workspace.html`
- Referencia visual temporal Chrome: `Chrome/dashboard.html`
- Popup Chrome activo: `Chrome/popup.html`
- Side panel Chrome: oculto temporalmente hasta nuevo aviso
- Entrypoint Chrome: `Chrome/src/main.js`
- App Chrome: `Chrome/src/projecttrack-app.js`
- Router Chrome: `Chrome/src/projecttrack-router.js`
- Estilos globales: `Chrome/styles/projecttrack.css`
- Design system base: `Bootstrap-ProjectTrack`
- Layout API publica: `row` + `col-*`
- Layout interno legacy permitido: `pt-row` + `pt-col-*`
- Regla de layout: No mezclar `row/col-*` con `pt-row/pt-col-*` en el mismo bloque
- Viewport minimo: `360px`
- Ancho de diseno optimo: `550px`
- Breakpoints: `sm=550`, `md=700`, `lg=960`, `xl=1200`, `xxl=1400`
- Idioma objetivo del runtime: Ingles
- Idioma objetivo de documentacion funcional: Ingles progresivo

## Estado util actual

- Runtime Chrome unico activo y sin sufijos `live` / `v2`
- Navbar global con breadcrumb semantico
- La marca `ProjectTrack` vuelve a `Home / Dashboard`
- `Dashboard` ya refinado manualmente en `Work Queue` y `Latest Notes Mentioning You`
- `change-detail.js` ya recibio una ronda manual de reordenamiento visual
- `change-detail.js` ahora permite editar `status` y `priority` inline desde pills dropdown en el header
- `change-detail.js` ya muestra `History` y se alimenta desde `project_notes` con `is_todo = false`
- `change-detail.js` ya muestra `Tasks` debajo de `Environments`
- `Tasks` ya permite:
  - importar tracker `.xlsx` por cambio
  - reemplazar tareas del cambio desde workbook, marcando como eliminadas las que ya no existan en el archivo
  - editar `assignee` inline
  - editar `status` inline
  - vincular notas con tareas desde el modal de notas
- `Tasks` ya permite exportar por rango usando `From TSKID / To TSKID`
- La persistencia nueva depende de `Android/sql/change_tasks_excel_import_20260331.sql`
- El patron actual de `pt-screen-hero` ya quedo homologado en las pantallas principales usando `row` + `col-*` en lugar del shell viejo por `pt-screen-hero-layout`
- La shell neutra recomendada para superficies nuevas ahora es `card bg-body-tertiary`
- `.bg-body-tertiary` ya queda alineado con el fondo real de `.card` mediante `--pt-card-bg`
- Para listas apiladas del runtime, la preferencia actual ya pasa a `list-group` + `list-group-item`
- Para botones, la convencion actual ya queda separada en 2 familias:
  - hero: `btn ... pt-hero-button`
  - runtime: `btn` + variante Bootstrap (`btn-primary`, `btn-secondary`, `btn-outline-*`, etc.)
- La extension prioriza ahora la experiencia full-tab:
  - `popup.html`: menu de entrada visible
  - `workspace.html`: runtime principal Bootstrap full-tab
  - `dashboard.html`: pagina Bootstrap-first de referencia durante la transicion
- El side panel queda oculto temporalmente: sin permiso `sidePanel`, sin `side_panel` en manifest y sin boton `SidePanel` en el popup
- Bootstrap local real ya queda vendorizado en `Chrome/vendor/bootstrap`
- Branding compartido para la nueva capa web ya vive tambien en `Chrome/styles/projecttrack-theme.css`
- La guia viva ya documenta:
  - `Hero card`
  - escala `text-step-*`
  - margenes negativos
  - familias de botones, paleta runtime y receta `bg-*-subtle`
  - margenes `auto`
  - `pt-pill` con tamanos `sm` y `md`
  - convencion `card bg-body-tertiary` para cards y panels base
- `profile.js`, `project-editor.js` y `change-editor.js` ya avanzaron a shell `Bootstrap-first` con `card bg-body-tertiary` + `card-body` + `row/col-*`
- `projects.js`, `changes.js` y `project-detail.js` ya avanzaron tambien a shell `Bootstrap-first` para sus wrappers principales
- `login.js` ya avanzo tambien a shell `Bootstrap-first` para su wrapper principal
- La distribucion privada de Chrome ya usa GitHub Releases para guardar los `.zip` y Supabase `public.app_releases` para publicar la ultima version disponible
- La extension consulta actualizaciones desde `Profile / Extension Updates` usando la sesion autenticada de Supabase
- El release privado inicial `v0.1.0` ya existe como punto base del canal Chrome
- La migracion `Android/sql/app_releases_chrome_20260416.sql` ya fue aplicada y `Profile / Extension Updates` fue validado con version local `0.1.0` al dia
- Chrome no puede auto-reemplazar una extension `Load unpacked`; la descarga, descompresion y `Reload` siguen siendo manuales
- `workspace.html` ya inicia el corte Bootstrap full-tab cargando Bootstrap local, `projecttrack-theme.css`, `projecttrack-fulltab.css` y `projecttrack-workspace.css`
- `popup.html` abre ahora `workspace.html` como experiencia principal
- `projecttrack.css` queda como capa legacy transicional cargada antes de Bootstrap para conservar estilos `pt-*` sin dominar `.btn`, `.card`, `.row` ni `.navbar`
- La shell principal de `workspace.html` ya usa navbar/contenedor Bootstrap full-tab y elimina el escalado tipo panel lateral
- `Dashboard`, `Projects`, `Project Details` y `Login` recibieron el primer corte Bootstrap full-tab
- Fixes incluidos en el corte:
  - `Projects`: buscador conserva foco/caret despues de render
  - `Projects`: click en cambios recientes ya no burbujea al proyecto padre
  - `Projects`: search/filter usa input group Bootstrap estable
  - `Project Details` y `Login`: se escapan datos visibles/atributos principales
  - `Project Details`: ya no cae al primer proyecto si `selectedProjectId` no existe
  - `Login`: estados informativos y errores reales usan tonos distintos
  - `Login`: boton/status y card wide quedan mas estables

## Mapa rapido de pantallas

- `Home / Dashboard`: `Chrome/src/screens/dashboard.js`
- `Home / Projects`: `Chrome/src/screens/projects.js`
- `Home / Projects / New`: `Chrome/src/screens/project-editor.js`
- `Home / Projects / Details`: `Chrome/src/screens/project-detail.js`
- `Home / Projects / Details / Edit`: `Chrome/src/screens/project-editor.js`
- `Home / Projects / Details / Changes`: `Chrome/src/screens/changes.js`
- `Home / Projects / Details / Changes / Details`: `Chrome/src/screens/change-detail.js`
- `Home / Projects / Details / Changes / New`: `Chrome/src/screens/change-editor.js`
- `Home / Projects / Details / Changes / Edit`: `Chrome/src/screens/change-editor.js`
- `Home / Login`: `Chrome/src/screens/login.js`
- `Home / Profile`: `Chrome/src/screens/profile.js`
- Navbar global / breadcrumb / marca: `Chrome/src/projecttrack-app.js`

## Hallazgos activos

- `projects.js`: falta QA visual real en Chrome despues del corte Bootstrap full-tab
- `project-editor.js`: falta validar visualmente la nueva shell Bootstrap-first y ajustar densidad fina del formulario
- `project-detail.js`: falta QA visual real en Chrome despues del corte Bootstrap full-tab, especialmente URLs largas y seleccion stale
- `changes.js`: falta validar visualmente la nueva shell Bootstrap-first y pulido equivalente al nivel ya aplicado en `change-detail.js`
- `change-editor.js`: falta validar visualmente la nueva shell Bootstrap-first y ajustar controles restantes
- `login.js`: falta QA visual real en Chrome para estados no autenticado, loading, error y wide desktop
- `profile.js`: falta validar visualmente la nueva shell Bootstrap-first y densidad final de backend/session
- `workspace.html`: falta QA visual real a 360px, 550px, 960px y desktop wide
- `Tasks`: falta futura pantalla o widget de `burndown chart` apoyado en `change_task_events`
- Documentacion funcional: falta seguir migrando a ingles donde aplique y decidir que contenido historico permanece en espanol

## Pendientes priorizados

1. Ejecutar QA visual real de `workspace.html` Bootstrap full-tab en 360px, 550px, 960px y desktop wide
2. Validar funcionalmente `Home / Projects`: search focus, filtro, click proyecto y click cambio reciente
3. Validar visualmente `Home / Projects / Details`: URLs largas, textos largos y proyecto stale
4. Validar visualmente `Home / Login`: no autenticado, loading, error, wide desktop
5. Continuar conversion Bootstrap-first en `Home / Projects / Details / Changes / Details`, `Changes`, editores y `Profile`
6. Revisar `Home / Profile`
7. Aplicar en Supabase la migracion `Android/sql/change_tasks_excel_import_20260331.sql`
8. Disenar la siguiente fase de `Tasks`: burndown chart por proyecto/cambio
9. Cerrar documentacion funcional restante en ingles

## Reglas para IA

- Tomar este archivo como lista principal de hallazgos y pendientes antes de iniciar analisis
- Para trabajo con agentes, seguir `docs/AGENTES_IA_PROJECTTRACK.md` y registrar fallas/mejoras en `docs/AGENTES_IA_FEEDBACK_LOG.md`
- Guardar aqui solo contexto operativo corto y reusable
- Mover contexto narrativo, historico o explicativo amplio a `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`
- Si aparece un hallazgo nuevo del runtime o del UI, agregarlo aqui primero si afecta trabajo pendiente
- Ruta con corchetes: el workspace contiene `[...]`, asi que en PowerShell conviene usar `-LiteralPath` o rutas absolutas bien escapadas para evitar que `[]` se interprete como patron
