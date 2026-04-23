# ProjectTrack Chrome Theme Manager

Fecha de actualizacion: 2026-04-20

## Objetivo

Mantener una guia operativa del `Theme Manager` basada en lo que el runtime hace hoy.

Esta pagina no define una vision futura amplia. Documenta que se puede tocar, que no se debe tocar y como validar cambios reales en `Chrome/styles/projecttrack.css`.

## Archivos involucrados

- Pantalla runtime: `Chrome/src/screens/theme-manager.js`
- Navegacion lateral: `Chrome/src/components/section-nav.js`
- Registro de componentes: `Chrome/src/theme/component-registry.js`
- CSS runtime: `Chrome/styles/projecttrack.css`
- Servidor local opcional: `scripts/theme/theme_manager_server.py`
- Fallback manual: `scripts/theme/save_theme.py`

## Flujo operativo actual

1. El `Theme Manager` intenta leer `Chrome/styles/projecttrack.css` desde el servidor local Python.
2. Si el servidor no esta disponible, usa lectura local como fallback para preview/export.
3. Los cambios se aplican en vivo al documento abierto como preview.
4. Al guardar, solo puede sobrescribir el bloque marcado:

```css
/* THEME MANAGER TOKENS START */
/* THEME MANAGER TOKENS END */
```

5. Antes de guardar o restaurar, el flujo aprobado crea backup.
6. La validacion visual principal debe hacerse en:
   - `Chrome/workspace.html`
   - `Chrome/workspace.html?view=theme-manager`

## Secciones visibles actuales

La navegacion lateral principal del `Theme Manager` debe incluir:

- Overview
- Theme
- Components
- Review

Y un grupo secundario `Advanced` con:

- Backups / Versions
- Import / Export
- Accessibility
- Legacy / Audit

Notas operativas:

- `Theme` concentra el bloque Source, los controles de tokens y Bootstrap, y el preview principal.
- Dentro de `Theme`, la edicion principal debe organizarse en grupos practicos: `Bootstrap Core`, `Brand & Text`, `Surfaces`, `Status Colors` y `Gradients`.
- `Components` debe centrarse en un componente seleccionado a la vez: selector, metadata, tokens y preview del componente activo.
- `Review` debe concentrar diff, acciones finales de guardado/copia/reset y un resumen practico de backups para cerrar el flujo principal.
- `Advanced` debe funcionar como entrada secundaria para backups completos, import/export, accessibility y audit.

## Alcance real del tema

El `Theme Manager` ya no es una superficie general para cualquier token `--pt-*`.

Su alcance actual debe concentrarse en:

- colores Bootstrap `--bs-*`
- colores ProjectTrack `--pt-color-*`
- superficies de color todavia justificadas:
  - `--pt-card-bg`
  - `--pt-card-border-color`
- gradientes ProjectTrack `--pt-gradient-*`
- estados y superficies derivadas del tema

## Tokens que si deben permanecer controlables

### Bootstrap base

- `--bs-primary`
- `--bs-secondary`
- `--bs-success`
- `--bs-info`
- `--bs-warning`
- `--bs-danger`
- `--bs-light`
- `--bs-dark`
- `--bs-body-color`
- `--bs-body-bg`

### ProjectTrack color

- `--pt-color-brand-primary`
- `--pt-color-brand-strong`
- `--pt-color-brand-soft`
- `--pt-color-bg-canvas`
- `--pt-color-card`
- `--pt-color-border-subtle`
- `--pt-color-text-primary`
- `--pt-color-text-secondary`
- `--pt-color-text-on-dark`
- `--pt-color-text-on-dark-muted`
- `--pt-color-status-*`

### ProjectTrack gradient

- `--pt-gradient-hero`
- `--pt-gradient-progress-track`
- `--pt-gradient-progress-complete`
- `--pt-gradient-progress-current`
- `--pt-gradient-progress-idle`

## Tokens que ya no deben volver

Estos valores deben caer en Bootstrap/default salvo una necesidad visual muy concreta y justificada:

- tipografia
- spacing
- radius
- shadows
- sizing
- helpers de layout

Ejemplos que no deben reintroducirse al bloque controlado del tema:

- `--pt-font-*`
- `--pt-text-step-*`
- `--pt-*-padding-*`
- `--pt-*-radius`
- `--pt-*-shadow`
- `--pt-*-height`
- `--pt-*-width`

## Iconos Material

El runtime sigue cargando las familias locales de Google Material.

Decision actual:

- los iconos Material mantienen reglas base estaticas en CSS
- ya no necesitan helpers `--pt-material-*`
- la configuracion activa queda fija en valores base seguros (`24px`, `FILL 0`, `wght 400`, `GRAD 0`, `opsz 24`)

Esto es valido mientras no exista una necesidad real del runtime para variar esos ejes mediante clases o tokens propios.

## Registro de componentes

`Chrome/src/theme/component-registry.js` debe listar solo tokens todavia utiles para QA de tema.

Regla practica:

- si un componente depende de Bootstrap para spacing/radius/shadow, esos tokens no deben aparecer en el registry
- si un componente depende de color o gradiente propio de ProjectTrack, si debe aparecer en el registry

## Validacion minima obligatoria

Cuando cambie el tema o el CSS controlado:

1. Abrir `Chrome/workspace.html`
2. Abrir `Chrome/workspace.html?view=theme-manager`
3. Confirmar que siguen correctos:
   - navbar
   - hero card
   - cards y list groups
   - alerts y badges
   - progress de environments
   - panel de updates
   - Change History

Si se toca JavaScript del `Theme Manager`, correr tambien:

```powershell
node --check Chrome/src/screens/theme-manager.js
node --check Chrome/src/theme/component-registry.js
```

## Pendiente real

- seguir podando `Chrome/styles/projecttrack.css` por slices pequenos
- restaurar solo selectores runtime realmente usados desde el backup cuando haga falta
- mantener `Theme Manager` alineado con el CSS real, no con requisitos historicos que ya no aplican
- evitar que vuelva a crecer una capa paralela de tokens no visuales
