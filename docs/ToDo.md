# ToDo - ProjectTrack

Actualizado al: 2026-03-31
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
- El patron actual de `pt-screen-hero` ya quedo homologado en las pantallas principales usando `row` + `col-*` en lugar del shell viejo por `pt-screen-hero-layout`
- La shell neutra recomendada para superficies nuevas ahora es `card bg-body-tertiary`
- `.bg-body-tertiary` ya queda alineado con el fondo real de `.card` mediante `--pt-card-bg`
- La guia viva ya documenta:
  - `Hero card`
  - escala `text-step-*`
  - margenes negativos
  - margenes `auto`
  - `pt-pill` con tamanos `sm` y `md`
  - convencion `card bg-body-tertiary` para cards y panels base

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

- `projects.js`: falta afinar detalles visuales de cambios recientes bajo la convencion actual de cards
- `project-editor.js`: falta revisar color de botones, densidad del formulario y posicion de cards/controles
- `project-detail.js`: falta reordenamiento visual fino de cards, enlaces y lectura general de la pantalla
- `changes.js`: falta pulido visual equivalente al nivel ya aplicado en `change-detail.js`
- `change-editor.js`: falta validar pulido visual, botones y acciones restantes
- `login.js`: falta revisar consistencia visual final, estados de carga y errores reales
- `profile.js`: falta validar densidad visual y consistencia de bloques backend/session
- Documentacion funcional: falta seguir migrando a ingles donde aplique y decidir que contenido historico permanece en espanol

## Pendientes priorizados

1. Continuar `QA visual por pantalla` en sidepanel real
2. Terminar pulido de `Home / Projects`
3. Terminar pulido de `Home / Projects / Details`
4. Extender pulido a `Change Screens` restantes: `changes.js` y `change-editor.js`
5. Revisar `Home / Login`
6. Revisar `Home / Profile`
7. Cerrar documentacion funcional restante en ingles

## Reglas para IA

- Tomar este archivo como lista principal de hallazgos y pendientes antes de iniciar analisis
- Guardar aqui solo contexto operativo corto y reusable
- Mover contexto narrativo, historico o explicativo amplio a `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`
- Si aparece un hallazgo nuevo del runtime o del UI, agregarlo aqui primero si afecta trabajo pendiente
- Ruta con corchetes: el workspace contiene `[...]`, asi que en PowerShell conviene usar `-LiteralPath` o rutas absolutas bien escapadas para evitar que `[]` se interprete como patron
