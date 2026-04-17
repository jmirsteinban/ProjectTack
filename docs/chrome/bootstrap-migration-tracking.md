# ProjectTrack Chrome Bootstrap Migration Tracking

Fecha de inicio: 2026-04-17

## Objetivo

Completar la migracion de ProjectTrack Chrome a Bootstrap real como base estructural y de componentes, dejando las clases `pt-*` solo para identidad visual, tokens, marca y ajustes especificos del runtime Chrome.

El objetivo no es eliminar todo `pt-*`. El objetivo es que Bootstrap sea responsable de layout, formularios, tablas, listas, cards, navbar, dropdowns, badges, alerts y botones; ProjectTrack debe aportar tema, colores, logo, heroes, superficies especiales y compatibilidad temporal.

## Regla De Arquitectura

Bootstrap:

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

ProjectTrack:

- `pt-web-body`
- `pt-web-app`
- `pt-web-navbar`
- `pt-workspace-navbar`
- `pt-workspace-brand`
- `pt-web-brand-mark`
- `pt-web-brand-title`
- `pt-web-user-button`
- `pt-web-user-avatar`
- `pt-web-user-menu`
- `pt-web-card`
- `pt-web-metric-card`
- tokens `--pt-*`
- ajustes especificos del workspace Chrome

No usar en pantallas nuevas:

- `pt-row-*`
- `pt-col-*`
- `pt-screen-card`
- `pt-screen-hero-layout`
- `pt-navbar`
- `pt-avatar-card`
- `pt-avatar-menu`
- `pt-project-*` para estructura
- `pt-change-*` para estructura generica
- `pt-profile-input`
- `pt-editor-choice`

## Estado Inicial

El runtime actual ya carga Bootstrap local y el bundle en `Chrome/workspace.html`, junto con:

- `Chrome/styles/projecttrack.css`
- `Chrome/vendor/bootstrap/bootstrap.min.css`
- `Chrome/styles/projecttrack-theme.css`
- `Chrome/styles/projecttrack-fulltab.css`
- `Chrome/styles/projecttrack-workspace.css`
- `Chrome/vendor/bootstrap/bootstrap.bundle.min.js`
- `Chrome/src/main.js`

La migracion esta parcial. Hay uso real de Bootstrap en botones, cards, rows, forms, navbar y dropdowns, pero aun existen muchas clases legacy `pt-*` en pantallas y CSS.

## Ciclos De Trabajo

### Ciclo 1: Shell Y Navbar

Objetivo:

- Consolidar `workspace.html` como shell Bootstrap full-tab.
- Mantener `Chrome/components/global-navbar.html` como template editable.
- Usar Bootstrap bundle para dropdowns.
- Eliminar estado y logica legacy de menu custom cuando ya no se use.

Archivos:

- `Chrome/workspace.html`
- `Chrome/components/global-navbar.html`
- `Chrome/src/projecttrack-app.js`
- `Chrome/src/projecttrack-state.js`
- `Chrome/styles/projecttrack-workspace.css`
- `Chrome/styles/projecttrack-fulltab.css`

Criterios de aceptacion:

- Navbar visible en todas las vistas del workspace.
- Dropdown abre con Bootstrap.
- No quedan referencias funcionales a `navMenuOpen`.
- No se usa `pt-navbar` en el runtime actual.
- `UI Guide` abre desde el menu.

### Ciclo 2: Login Y Profile

Objetivo:

- Migrar formularios a `form-label`, `form-control`, `form-select`, `input-group`.
- Usar `alert` para mensajes.
- Usar `spinner-border` para loading.
- Mantener el bloque `Extension Updates` con Bootstrap.

Archivos:

- `Chrome/src/screens/login.js`
- `Chrome/src/screens/profile.js`
- `Chrome/src/services/release-updates.js`
- `Chrome/styles/projecttrack-workspace.css`
- `Chrome/styles/projecttrack-fulltab.css`

Criterios de aceptacion:

- Login centrado en full-tab.
- Mensajes informativos separados de errores reales.
- Boton/status sin layout shift.
- Profile no depende de `pt-profile-input` ni `pt-profile-label`.
- Extension Updates compara manifest version contra Supabase release channel.

### Ciclo 3: Dashboard Y Projects

Objetivo:

- Dashboard con `row`, `col`, `card`, `list-group`, `badge`.
- Projects con `input-group`, `card`, `list-group`, `badge`.
- Preservar foco/caret del buscador.
- Evitar bubbling entre proyecto y cambio reciente.

Archivos:

- `Chrome/src/screens/dashboard.js`
- `Chrome/src/screens/projects.js`
- `Chrome/styles/projecttrack-workspace.css`
- `Chrome/styles/projecttrack-fulltab.css`

Criterios de aceptacion:

- Seis metricas en una linea en desktop cuando haya espacio.
- Sin overflow horizontal en 360px, 550px, 960px y desktop wide.
- Search no pierde foco.
- Click en proyecto y click en cambio reciente navegan correctamente.

### Ciclo 4: Project Details Y Changes

Objetivo:

- Migrar detalles, links, resumenes y listas a Bootstrap.
- Usar `list-group` para cambios relacionados.
- Usar `row row-cols-*` para metadata.
- Usar `table-responsive` donde haya datos tabulares.

Archivos:

- `Chrome/src/screens/project-detail.js`
- `Chrome/src/screens/changes.js`
- `Chrome/styles/projecttrack-workspace.css`
- `Chrome/styles/projecttrack-fulltab.css`

Criterios de aceptacion:

- Textos y atributos escapados.
- Proyecto stale o invalido no cae silenciosamente al primer proyecto.
- URLs largas no rompen layout.
- Cambios relacionados navegan correctamente.

### Ciclo 5: Editors Y Change Detail

Objetivo:

- Migrar editores a forms Bootstrap.
- Reemplazar choices custom por `btn-check`, `btn-group` y `btn btn-outline-*`.
- Migrar Change Detail a cards, lists, tables y alerts Bootstrap.

Archivos:

- `Chrome/src/screens/project-editor.js`
- `Chrome/src/screens/change-editor.js`
- `Chrome/src/screens/change-detail.js`
- `Chrome/styles/projecttrack-workspace.css`
- `Chrome/styles/projecttrack-fulltab.css`

Criterios de aceptacion:

- Validacion visible con `is-invalid` e `invalid-feedback`.
- Choice groups accesibles.
- Notes, history y related changes usan patrones Bootstrap.
- No quedan dependencias estructurales a `pt-screen-card`.

### Ciclo 6: Limpieza Legacy CSS

Objetivo:

- Reducir `projecttrack.css`.
- Mover tokens necesarios a `projecttrack-theme.css`.
- Mover estilos vigentes a `projecttrack-fulltab.css` o `projecttrack-workspace.css`.
- Eliminar CSS muerto.

Archivos:

- `Chrome/styles/projecttrack.css`
- `Chrome/styles/projecttrack-theme.css`
- `Chrome/styles/projecttrack-fulltab.css`
- `Chrome/styles/projecttrack-workspace.css`
- `Chrome/workspace.html`

Criterios de aceptacion:

- `projecttrack.css` no redefine Bootstrap base de forma conflictiva.
- El runtime puede funcionar sin CSS legacy o con una capa legacy claramente nombrada.
- Busquedas de residuos criticos quedan limpias.

### Ciclo 7: Guia UI, QA Y Release

Objetivo:

- Actualizar `Chrome/docs/projecttrack-ui.html` con la realidad final.
- Mantener una sola guia UI para evitar divergencias entre documentacion y extension.
- Ejecutar QA funcional y visual.
- Preparar release.

Archivos:

- `Chrome/docs/projecttrack-ui.html`
- `Chrome/manifest.json`
- `.github/workflows/chrome-release.yml`

Criterios de aceptacion:

- La guia no documenta componentes removidos.
- `UI Guide` abre `Chrome/docs/projecttrack-ui.html`.
- `workspace.html` carga Bootstrap local, no CDN.
- Release publicado con zip y metadata.

## Comandos De Seguimiento

Buscar residuos legacy:

```powershell
rg -n "pt-row($|[-_])|pt-col($|[-_0-9])|pt-screen-card|pt-screen-hero-layout|pt-navbar|pt-avatar-card|pt-editor-choice" Chrome/src Chrome/styles Chrome/components
```

Buscar clases `pt-*` en pantallas:

```powershell
rg -n "pt-[a-zA-Z0-9_-]+" Chrome/src/screens Chrome/components
```

Verificar stack de workspace:

```powershell
Get-Content Chrome/workspace.html
```

Verificar rutas de la guia interna:

```powershell
rg -n "../../Chrome|\\.\\./styles|\\.\\./vendor|\\.\\./assets" Chrome/docs/projecttrack-ui.html
```

## QA Minimo Por Ciclo

- Abrir `workspace.html?view=login`
- Abrir `workspace.html?view=dashboard`
- Abrir `workspace.html?view=projects`
- Abrir `workspace.html?view=profile`
- Confirmar navbar/dropdown.
- Confirmar que no hay overflow horizontal.
- Confirmar que la URL refleja `view`, `projectId`, `changeId` y `mode` cuando aplique.

## Registro De Progreso

### 2026-04-17

- Estado: migracion pausada aqui por decision operativa para cuidar cuota. Retomar desde `Project Detail` pendiente de links/ambientes, luego `Change Detail`, `Project Editor` y `Change Editor`.
- Se crea este documento de seguimiento.
- Se inicia Ciclo 1: Shell y Navbar.
- Se elimina el estado legacy `navMenuOpen` de `projecttrack-state.js`.
- Se eliminan escrituras a `state.navMenuOpen` en `projecttrack-app.js`.
- Validacion inicial: no quedan referencias a `navMenuOpen`, `pt-navbar`, `pt-avatar-card` o `pt-avatar-menu` en `projecttrack-app.js`, `projecttrack-state.js` ni `global-navbar.html`.
- `node --check` pasa para `projecttrack-app.js` y `projecttrack-state.js`.
- Se detectan selectores legacy de navbar/avatar en `Chrome/styles/projecttrack.css`; quedan inventariados para Ciclo 6 en vez de eliminarlos durante Ciclo 1.
- Se consolida la guia UI en una sola ubicacion: `Chrome/docs/projecttrack-ui.html`.
- Se elimina la copia duplicada anterior fuera de `Chrome/docs` para evitar ediciones divergentes.
- Se eliminan selectores legacy de navbar/avatar antiguo de `Chrome/styles/projecttrack.css`.
- Se actualiza la guia UI para referirse al dropdown actual `pt-web-user-menu`.
- Validacion: no quedan referencias a `pt-navbar`, `pt-avatar-card`, `pt-avatar-area`, `pt-avatar-icon`, `pt-avatar-menu`, `pt-avatar-userline`, `pt-navbar-top`, `pt-navbar-copy` ni `pt-navbar-brand` dentro de `Chrome`.
- Se centralizan las migraciones SQL en `sql/` como ubicacion compartida por Chrome, Android y Supabase.
- Se actualizan referencias en documentacion y servicios Chrome para apuntar a `sql/*.sql`.
- Se agrega `sql/README.md` con convencion de uso de scripts Supabase.
- Se agrega la pantalla `change-history` / `Change History` accesible desde el menu global, debajo de `UI Guide`.
- El historial vive en `Chrome/src/data/project-changelog.js` y se renderiza con `Chrome/src/screens/change-history.js`.
- Se inicia Ciclo 2: Login y Profile.
- `Login` deja de depender de clases legacy `pt-login-*` y `pt-profile-form` para estructura visual.
- `Profile` reemplaza titulos `pt-section-title` por utilidades Bootstrap en la pantalla de perfil.
- `Profile` reemplaza el hero legacy `pt-screen-hero` por `pt-web-hero` con `row`, `col-*`, `badge` y `btn`.
- `Profile` escapa valores de formulario, mensajes de estado y tarjetas de resumen antes de renderizar HTML.
- `Change History` se ajusta para no introducir deuda nueva de hero legacy.
- Se eliminan residuos CSS runtime de `pt-login-*`, `pt-profile-form`, `pt-profile-label`, `pt-profile-input`, `pt-profile-textarea` y `pt-profile-save-button`.
- Validacion: `node --check` pasa para `Chrome/src/screens/login.js` y `Chrome/src/screens/profile.js`.
- Validacion: no quedan residuos `pt-login-*` ni `pt-profile-*` legacy en `Chrome/src`, `Chrome/components`, `Chrome/styles/projecttrack-workspace.css` ni `Chrome/styles/projecttrack.css`.
- Se inicia Ciclo 3: Dashboard y Projects.
- `Projects` migra a `pt-web-hero`, `row row-cols-*`, `card`, `card-header`, `card-body`, `list-group`, `badge`, `input-group` y botones Bootstrap.
- `Projects` deja de usar `pt-project-card`, `pt-project-date-row`, `pt-project-fieldset`, `pt-project-empty`, `pt-project-filter-button`, `pt-screen-hero`, `pt-back-button`, `pt-change-create-button` y `pt-hero-button` en el runtime de esa pantalla.
- `Dashboard` elimina el uso de `pt-hero-button` en la accion principal.
- Validacion: `node --check` pasa para `Chrome/src/screens/projects.js`.
- Se mueve la bitacora historica de `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md` a la pagina `Change History`.
- `Change History` ahora soporta listas opcionales de detalle por entrada mediante `details`.
- La documentacion central mantiene solo una referencia corta al historico para evitar duplicidad.
- `Changes` migra a `pt-web-hero`, `input-group`, `list-group`, `badge` y botones Bootstrap, eliminando deuda `pt-screen-hero`, `pt-change-card`, `pt-change-copy`, `pt-change-meta`, `pt-change-search-input`, `pt-back-button`, `pt-change-create-button` y `pt-hero-button`.
- `Changes` ahora escapa texto y atributos provenientes de datos antes de renderizar.
- `Project Detail` migra el hero, titulos principales, badges de metadata y lista de cambios relacionados hacia Bootstrap, dejando los bloques de links y ambientes para una pasada posterior compartida con `Change Detail`.
- Validacion: `node --check` pasa para `Chrome/src/screens/changes.js` y `Chrome/src/screens/project-detail.js`.
- Se pausa la migracion Bootstrap y se cambia foco a navbar.
- La navbar reemplaza el subtitulo fijo `Bootstrap dashboard` por breadcrumbs dinamicos y seleccionables para copiar texto.
- El icono/titulo de marca siguen navegando a `Workspace / Dashboard`; el breadcrumb queda como texto independiente para evitar navegacion accidental al seleccionarlo.
- Se agrega el template editable `Chrome/components/hero-card.html` para modelar el primer card/hero de las pantallas.
- Se agrega el renderer `Chrome/src/components/hero-card.js` y se aplica en `Dashboard`, `Projects`, `Changes`, `Project Detail`, `Profile` y `Change History`.
- Quedan pendientes para una pasada posterior los heroes legacy de `Change Detail`, `Project Editor` y `Change Editor`.

Pendiente del Ciclo 1:

- Confirmar manualmente que Bootstrap dropdown abre en Chrome con `bootstrap.bundle.min.js`.
- Documentar si `projecttrack.css` queda como legacy temporal o si se puede retirar del shell mas adelante.
