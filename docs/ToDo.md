# ToDo - ProjectTrack

Actualizado al: 2026-04-01
Proposito: Lista operativa de hallazgos y pendientes activos del proyecto
Guia IA: Leer este archivo antes de analizar, proponer cambios o documentar el proyecto
Documento canonico de estado: `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`
Guia viva UI: `docs/chrome/projecttrack-ui.html`

## Contexto clave

- Proyecto: `ProjectTrack`
- Ruta raiz repo: `./`
- Ruta proyecto Android: `Android/`
- Ruta proyecto Chrome: `Chrome/`
- Ruta documentacion general: `docs/`
- Ruta documentacion Chrome: `docs/chrome/`
- Runtime Chrome activo: `Chrome/sidepanel.html`
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
- La extension ya abre ahora 3 superficies distintas:
  - `sidepanel.html`: launcher vertical compacto
  - `workspace.html`: app actual con `projecttrack.css`
  - `dashboard.html`: primera pagina full-tab Bootstrap-first
- El icono de la extension ya no abre el panel directo: ahora abre `popup.html` con 2 acciones
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

- `projects.js`: falta validar visualmente la nueva shell Bootstrap-first y afinar detalles de cambios recientes
- `project-editor.js`: falta validar visualmente la nueva shell Bootstrap-first y ajustar densidad fina del formulario
- `project-detail.js`: falta validar visualmente la nueva shell Bootstrap-first y afinar lectura final de cards/enlaces
- `changes.js`: falta validar visualmente la nueva shell Bootstrap-first y pulido equivalente al nivel ya aplicado en `change-detail.js`
- `change-editor.js`: falta validar visualmente la nueva shell Bootstrap-first y ajustar controles restantes
- `login.js`: falta validar visualmente la nueva shell Bootstrap-first, estados de carga y errores reales
- `profile.js`: falta validar visualmente la nueva shell Bootstrap-first y densidad final de backend/session
- `Tasks`: falta futura pantalla o widget de `burndown chart` apoyado en `change_task_events`
- Documentacion funcional: falta seguir migrando a ingles donde aplique y decidir que contenido historico permanece en espanol

## Pendientes priorizados

1. Continuar `QA visual por pantalla` en sidepanel real
2. Validar visualmente `Home / Projects`
3. Validar visualmente `Home / Projects / Details`
4. Continuar conversion `Bootstrap-first` en `Home / Projects / Details / Changes / Details` y `Home / Dashboard`
5. Validar visualmente `Home / Login`
6. Revisar `Home / Profile`
7. Aplicar en Supabase la migracion `Android/sql/change_tasks_excel_import_20260331.sql`
8. Disenar la siguiente fase de `Tasks`: burndown chart por proyecto/cambio
9. Cerrar documentacion funcional restante en ingles

## Reglas para IA

- Tomar este archivo como lista principal de hallazgos y pendientes antes de iniciar analisis
- Guardar aqui solo contexto operativo corto y reusable
- Mover contexto narrativo, historico o explicativo amplio a `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`
- Si aparece un hallazgo nuevo del runtime o del UI, agregarlo aqui primero si afecta trabajo pendiente
- Ruta con corchetes: el workspace contiene `[...]`, asi que en PowerShell conviene usar `-LiteralPath` o rutas absolutas bien escapadas para evitar que `[]` se interprete como patron
