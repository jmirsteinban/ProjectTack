# ProjectTrack Chrome Bootstrap Migration Tracking

Fecha de actualizacion: 2026-04-17

## Objetivo

Mantener `Chrome/workspace.html` como experiencia Chrome full-tab basada en Bootstrap real. Bootstrap define la estructura del runtime; ProjectTrack aporta marca, tokens visuales y componentes de dominio.

## Stack Activo

- `Chrome/workspace.html`
- `Chrome/vendor/bootstrap/bootstrap.min.css`
- `Chrome/styles/projecttrack.css`
- `Chrome/vendor/bootstrap/bootstrap.bundle.min.js`
- `Chrome/src/main.js`

## Contrato UI

Bootstrap estructura:

- `container-fluid`
- `row`
- `col-*`
- `card`
- `card-header`
- `card-body`
- `list-group`
- `list-group-item`
- `table`
- `table-responsive`
- `alert`
- `badge`
- `btn`
- `dropdown`
- `navbar`
- `form-label`
- `form-control`
- `form-select`
- `input-group`
- `modal`
- `spinner-border`

ProjectTrack identidad y dominio:

- `pt-web-body`
- `pt-web-app`
- `pt-web-navbar`
- `pt-workspace-navbar`
- `pt-workspace-brand`
- `pt-web-brand-title`
- `pt-web-user-button`
- `pt-web-user-avatar`
- `pt-web-user-menu`
- `pt-web-card`
- `pt-web-metric-card`
- `pt-hero-card`
- `pt-pill`
- `pt-clickable-card`
- `pt-environment-progress`
- tokens `--pt-*`

## Pantallas Activas

- `Dashboard`: Bootstrap grid, metric cards, list groups, shared Hero Card.
- `Projects`: Bootstrap cards, list groups, input group search and filter controls.
- `Project Detail`: shared Hero Card, Bootstrap summaries, environment cards and related changes.
- `Changes`: shared Hero Card, search input group, Bootstrap list groups and badges.
- `Change Detail`: shared Hero Card, Bootstrap cards, list groups, alerts, forms and badges.
- `Project Editor`: shared Hero Card, Bootstrap forms and environment URL lists.
- `Change Editor`: shared Hero Card, Bootstrap forms and outline button choices.
- `Login`: Bootstrap full-tab card, alerts and stable status actions.
- `Profile`: shared Hero Card, Bootstrap profile/account/update sections.
- `Change History`: shared Hero Card and grouped entries.

## Componentes Editables

- Navbar global: `Chrome/components/global-navbar.html`
- Hero Card template: `Chrome/components/hero-card.html`
- Hero Card renderer: `Chrome/src/components/hero-card.js`
- Environment progress: `Chrome/src/components/environment-progress.js`
- Brand mark: `Chrome/src/components/projecttrack-brand.js`

## Estado Actual

- `workspace.html` es la entrada principal del runtime Chrome.
- El navbar global vive en un template editable y muestra breadcrumbs dinamicos copiables.
- Las pantallas principales usan Bootstrap real para layout, formularios, listas, cards, alerts, badges y botones.
- El primer bloque visual de las pantallas usa el Hero Card compartido.
- QA visual full-tab aprobado en Chrome para 360px, 550px, 960px y desktop wide.
- QA funcional principal aprobado en Chrome para Projects, Project Details, Change Details, editors, Login, Profile, navbar, Change History y UI Guide.
- `workspace.html` carga Bootstrap local primero y `projecttrack.css` despues.
- `projecttrack.css` es la unica capa custom activa: tokens, marca, full-tab skin, workspace layout, componentes de dominio, popup/side-panel y helpers documentales.
- Dashboard y Change Detail ya retiraron wrappers presentacionales pequenos que Bootstrap cubria con utilidades (`d-grid`, `min-w-0`, `d-flex`, `flex-wrap`, `gap-*`).
- Change Detail tambien retiro helpers de layout de tareas que Bootstrap ya cubria directamente (`align-items-end`, `min-w-0`, `gap-*`).

## Siguiente Trabajo

1. Validar visualmente el stack CSS unico en `workspace.html` y `Chrome/docs/projecttrack-ui.html`.
2. Actualizar `Chrome/docs/projecttrack-ui.html` cada vez que cambie el runtime visible.
3. Preparar release cuando cierre la validacion CSS final.

## QA Funcional

Estado: aprobado en Chrome.

- Login: aprobado.
- Dashboard: aprobado.
- Projects: aprobado.
- Project Details: aprobado.
- Change Details: aprobado.
- Project Editor: aprobado.
- Change Editor: aprobado.
- Profile: aprobado.
- Navbar: aprobado.
- Change History: aprobado.
- UI Guide: aprobado.

## QA Visual

Estado: aprobado en Chrome.

- 360px: aprobado.
- 550px: aprobado.
- 960px: aprobado.
- Desktop wide: aprobado.
- Sin overflow horizontal.
- Navbar y dropdown visibles sobre contenido.
- Breadcrumb seleccionable para copiar texto.
- Cards, listas, tablas, formularios y botones coherentes con la experiencia Bootstrap full-tab.

## Comandos De Seguimiento

Ver clases ProjectTrack aun usadas en runtime:

```powershell
rg -n "pt-[a-zA-Z0-9_-]+" Chrome/src/screens Chrome/src/components Chrome/src/projecttrack-app.js
```

Verificar stack de workspace:

```powershell
Get-Content Chrome/workspace.html
```

Verificar rutas de la guia interna:

```powershell
rg -n "../../Chrome|\\.\\./styles|\\.\\./vendor|\\.\\./assets" Chrome/docs/projecttrack-ui.html
```

Validar JavaScript modificado:

```powershell
node --check Chrome/src/projecttrack-app.js
node --check Chrome/src/screens/dashboard.js
node --check Chrome/src/screens/projects.js
node --check Chrome/src/screens/project-detail.js
node --check Chrome/src/screens/changes.js
node --check Chrome/src/screens/change-detail.js
node --check Chrome/src/screens/project-editor.js
node --check Chrome/src/screens/change-editor.js
node --check Chrome/src/screens/login.js
node --check Chrome/src/screens/profile.js
```
