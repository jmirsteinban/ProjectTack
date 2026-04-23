# ProjectTrack Chrome Bootstrap Migration Tracking

Fecha de actualizacion: 2026-04-20

## Objetivo

Usar este archivo como checklist operativo para mantener `Chrome/workspace.html` sobre Bootstrap real y evitar que vuelvan capas custom innecesarias.

## Stack activo

- `Chrome/workspace.html`
- `Chrome/vendor/bootstrap/bootstrap.min.css`
- `Chrome/styles/projecttrack.css`
- `Chrome/vendor/bootstrap/bootstrap.bundle.min.js`
- `Chrome/src/main.js`

## Regla base

Bootstrap debe resolver por defecto:

- layout
- cards
- alerts
- badges
- buttons
- forms
- tables
- dropdowns
- modal shell
- spacing
- radius
- shadows

ProjectTrack solo debe aportar:

- color e identidad de marca
- gradientes propios
- componentes de dominio que Bootstrap no cubre solo
- estilos de popup/side-panel en `Chrome/styles/popup-panel.css`

## Estado actual practico

- `workspace.html` ya carga Bootstrap primero y `projecttrack.css` despues.
- La shell principal del workspace ya esta en markup Bootstrap-first.
- El dropdown del usuario en el navbar ya vive en un componente reutilizable (`Chrome/src/components/user-menu.js`) y conserva una capa visual propia limitada a identidad y estados del menu.
- Las metric cards del Dashboard ya viven en un componente reutilizable (`Chrome/src/components/metric-card.js`) con template HTML dedicado.
- Hero Card, pills runtime, empty states basicos, metric cards, clickable rows y Environment Progress ya migraron a markup Bootstrap-only.
- `Theme Manager` tambien ya usa markup Bootstrap-only.
- `Chrome/docs/projecttrack-ui.html` fue retirado del runtime.
- La limpieza actual se concentra en `Chrome/styles/projecttrack.css` y en los registros/documentacion que todavia describen deuda ya retirada.

## Decisiones activas

- No reintroducir wrappers presentacionales si Bootstrap ya cubre el caso.
- No reintroducir tokens `--pt-*` de spacing, radius, sizing o shadow como tema base.
- Mantener `--pt-*` enfocado en color, superficies y gradientes.
- Mantener la validacion visual principal en `workspace.html` y `workspace.html?view=theme-manager`.

## Que queda pendiente

1. Confirmar visualmente el runtime despues de cada poda de CSS.
2. Restaurar solo selectores realmente usados desde el backup cuando un corte de limpieza deje el runtime incompleto.
3. Seguir reduciendo `projecttrack.css` por bloques pequenos y reversibles.
4. Mantener el registro y la documentacion alineados con el estado real, no con markup legado.

## Validacion minima por slice

Cada vez que se elimine CSS custom del workspace:

1. Abrir `Chrome/workspace.html`
2. Abrir `Chrome/workspace.html?view=theme-manager`
3. Revisar como minimo:
   - navbar
   - hero card
   - dashboard cards
   - projects list
   - change detail
   - environment progress
   - profile update panel
   - change history

Si hubo cambios JS en pantallas o app shell:

```powershell
node --check Chrome/src/projecttrack-app.js
```

## Comandos utiles

Ver clases `pt-*` usadas en runtime:

```powershell
rg -n "pt-[a-zA-Z0-9_-]+" Chrome/src/screens Chrome/src/components Chrome/src/projecttrack-app.js
```

Ver el stack del workspace:

```powershell
Get-Content Chrome/workspace.html
```

Ver el checkpoint recuperable mas reciente:

```powershell
Get-Content docs/AI_SESSION_HANDOFF.md
```
