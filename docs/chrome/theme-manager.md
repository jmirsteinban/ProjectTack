# ProjectTrack Chrome Theme Manager

Fecha de actualización: 2026-04-20

## Objetivo

Documentar el alcance esperado del `Theme Manager` como página del workspace Chrome. Esta herramienta debe permitir revisar, ajustar y exportar configuración visual reutilizable para ProjectTrack y otros proyectos basados en Bootstrap.

## Ubicación

- Pantalla runtime: `Chrome/src/screens/theme-manager.js`
- Estilos runtime: `Chrome/styles/projecttrack.css`
- Integración de ruta/menú: `Chrome/src/main.js`, `Chrome/src/projecttrack-router.js`, `Chrome/src/projecttrack-app.js`

## Estado actual

La implementación real inicial del `Theme Manager` ya reemplaza el MVP original como base funcional:

- Lee `Chrome/styles/projecttrack.css` desde el servidor local Python cuando está disponible.
- Usa fallback de lectura directa del CSS para modo preview/exportación.
- Aplica cambios en tiempo real mediante variables CSS en el documento abierto.
- Exporta un bloque `:root { ... }` listo para copiar y pegar en otro `custom.css`.
- Guarda únicamente el bloque marcado `THEME MANAGER TOKENS` cuando el usuario confirma la acción.
- Crea backup antes de guardar o restaurar mediante Python.
- Incluye importación de CSS, diff de tokens, revisión básica WCAG AA, auditoría inicial de clases `pt-*` y lista de backups/versiones.
- Incluye un registro explícito inicial de componentes en `Chrome/src/theme/component-registry.js`.
- Mantiene preview con componentes Bootstrap y ProjectTrack reales.
- Expone la paleta Bootstrap base completa para tema light activo:
  - `primary`
  - `secondary`
  - `success`
  - `info`
  - `warning`
  - `danger`
  - `light`
  - `dark`
- Muestra `light` y `dark` como colores Bootstrap disponibles, pero no activa todavía un modo oscuro separado con `data-bs-theme="dark"`.
- El preview ahora incluye más componentes Bootstrap: list group, dropdown, progress, table, badges y alertas por estado.
- La sección `ProjectTrack Components` incluye una galería visual ampliada con:
  - breadcrumbs
  - nav pills
  - formularios valid/invalid/disabled/readonly
  - metric cards
  - notes/tasks
  - release update panel
  - Change History entry
  - modal preview
  - confirm dialog
- Los componentes registrados ahora muestran resumen de tokens:
  - cantidad de tokens editables
  - cantidad de tokens pendientes de definición
  - cantidad de tokens modificados
- Los componentes registrados ahora pueden mostrar controles inline para los tokens que ya conoce el `Theme Manager`.
- Si un token aparece en varios componentes, sus controles inline se sincronizan al editarlo para evitar valores duplicados desactualizados.
- Los tokens referenciados por componentes pero todavía no definidos quedan visibles como `Pending token definitions`.
- La sección `Diff` agrupa cambios por componente impactado usando `Chrome/src/theme/component-registry.js`.
- La sección `Diff` también conserva una revisión plana de tokens con la lista de componentes impactados.

Scripts disponibles:

- Servidor local: `scripts/theme/theme_manager_server.py`
- Script manual: `scripts/theme/save_theme.py`
- Utilidades compartidas: `scripts/theme/theme_io.py`

## Requisitos funcionales

### Persistencia y escritura CSS

Pregunta origen: si se cambia algo en el `Theme Manager`, esos cambios se guardan en el CSS del proyecto.

Requisitos:

- El `Theme Manager` debe indicar claramente si los cambios están en modo preview, exportación o guardado.
- El `Theme Manager` debe leer siempre la configuración inicial desde `Chrome/styles/projecttrack.css`.
- Los cambios no deben sobrescribir `Chrome/styles/projecttrack.css` de forma silenciosa.
- Si el usuario decide guardar, la herramienta debe sobrescribir únicamente el bloque marcado de tokens dentro de `Chrome/styles/projecttrack.css`.
- La acción de guardar debe ser explícita, confirmada y auditable.
- Debe existir una acción explícita para exportar el CSS resultante.
- La exportación debe generar un bloque `:root { ... }` completo con todas las variables modificadas.
- El bloque exportado debe poder pegarse en un `custom.css` de otro proyecto sin depender del runtime de ProjectTrack.

### Cobertura de Componentes

Pregunta origen: si el `Theme Manager` contempla todos los componentes usados en el proyecto.

Requisitos:

- El preview debe evolucionar hacia una galería completa de componentes reales usados en Chrome.
- La galería debe cubrir, como mínimo:
  - navbar global
  - Hero Card
  - botones y variantes
  - cards base, metric cards y cards de estados
  - alerts
  - badges y pills de status/prioridad
  - list groups
  - tablas
  - formularios, inputs, selects, textareas y estados disabled/error
  - dropdowns
  - breadcrumbs
  - progress bars
  - modals y confirm dialogs
  - environment progress
  - rows de tasks/notas
  - panel de release updates
  - entradas de Change History
- Cada componente de preview debe usar clases reales del proyecto cuando existan.
- La cobertura debe servir como QA visual rápido del sistema de diseño.

### Tipografía real del proyecto

Pregunta origen: si el `Theme Manager` muestra la tipografía utilizada en el proyecto.

Requisitos:

- Debe mostrar la configuración tipográfica real actual:
  - `--pt-font-sans`
  - `--pt-font-heading`
  - `--pt-text-step-base`
  - `--pt-text-step-5` a `--pt-text-step--3`
- Debe incluir `Graphik` como fuente del proyecto cuando los archivos locales esten disponibles.
- Debe incluir una lista visible de fuentes disponibles para aplicar al preview.
- Lista inicial de fuentes permitidas:
  - `Graphik` como fuente local principal de ProjectTrack.
  - `System UI` como fallback nativo sin red.
  - `Inter`.
  - `Roboto`.
  - `Montserrat`.
  - `Nunito Sans`.
  - `Source Sans 3`.
  - `Open Sans`.
  - `Lato`.
  - `Poppins`.
  - `IBM Plex Sans`.
  - `Noto Sans`.
- La lista debe incluir una opción `Agregar Google Font`.
- La opción `Agregar Google Font` debe pedir el nombre de la familia y generar automáticamente la URL CSS2 de Google Fonts.
- La forma recomendada para agregar una fuente de Google Fonts es:
  - Normalizar el nombre ingresado reemplazando espacios por `+`.
  - Crear o reutilizar un nodo `<link rel="stylesheet" data-theme-google-font>`.
  - Usar la base oficial `https://fonts.googleapis.com/css2`.
  - Construir una URL con `family=<Nombre+Fuente>:wght@400;500;600;700&display=swap`.
  - Insertar ese `<link>` en `document.head`.
  - Agregar la familia al selector y aplicar `font-family: "<Nombre Fuente>", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Si la extensión no tiene acceso a red o Google Fonts falla, debe mantener el fallback `System UI` y avisar que la fuente externa no pudo cargarse.
- Para uso corporativo o distribución offline, se debe preferir una fuente local empaquetada como `Graphik` antes que depender de Google Fonts.
- Debe mostrar ejemplos reales para:
  - headings
  - body text
  - labels
  - helper text
  - badges/pills
  - tablas
  - navbar
  - botones
- El selector de fuentes sugeridas debe diferenciar entre fuente activa del proyecto y fuentes alternativas.

### Configuración de `projecttrack.css`

Pregunta origen: si el `Theme Manager` muestra la configuración de `projecttrack.css`.

Requisitos:

- El `Theme Manager` debe exponer progresivamente los tokens reales definidos en `Chrome/styles/projecttrack.css`.
- Debe distinguir entre:
  - tokens Bootstrap `--bs-*`
  - tokens ProjectTrack `--pt-*`
  - tokens derivados usados solo para exportación
- Debe mostrar el valor actual cargado desde CSS antes de permitir cambios.
- Debe cubrir, por etapas:
  - paleta de marca
  - paleta de estados
  - paleta de hero/progreso
  - tipografía
  - spacing
  - radii
  - sombras
  - borders
  - z-index relevante
  - componentes Bootstrap personalizados
  - componentes de dominio ProjectTrack
- El CSS exportado debe reflejar solo variables útiles y reutilizables, evitando reglas internas que dependan de una pantalla específica.

### Arquitectura de colores

Pregunta origen: cuál es la mejor forma de establecer colores, por componente o por variables/tokens.

Requisitos:

- El `Theme Manager` debe establecer colores principalmente por variables/tokens, no por reglas directas de componente.
- La configuración de colores debe organizarse en cuatro capas:
  - tokens primitivos
  - tokens semánticos
  - tokens de componente
  - clases/componentes que consumen tokens
- Los tokens primitivos guardan valores crudos de paleta y no deben describir uso.

Ejemplo:

```css
:root {
  --pt-ref-green-700: #204d38;
  --pt-ref-red-700: #b42318;
  --pt-ref-gray-600: #66756c;
}
```

- Los tokens semánticos describen la intención del color y deben apuntar a tokens primitivos.

Ejemplo:

```css
:root {
  --pt-color-brand-primary: var(--pt-ref-green-700);
  --pt-color-status-danger: var(--pt-ref-red-700);
  --pt-color-text-secondary: var(--pt-ref-gray-600);
}
```

- Los tokens de componente deben existir cuando un componente necesite una decisión visual propia.

Ejemplo:

```css
:root {
  --pt-button-primary-bg: var(--pt-color-brand-primary);
  --pt-button-primary-bg-hover: var(--pt-color-brand-strong);
  --pt-button-primary-border: var(--pt-color-brand-primary);
  --pt-button-primary-text: var(--pt-color-text-on-dark);
}
```

- Las clases de componentes deben consumir tokens y no colores codificados de forma fija.

Ejemplo:

```css
.pt-web-app .btn-primary {
  background: var(--pt-button-primary-bg);
  border-color: var(--pt-button-primary-border);
  color: var(--pt-button-primary-text);
}
```

- El `Theme Manager` debe priorizar edición de tokens semánticos:
  - `brand`
  - `text`
  - `surface`
  - `border`
  - `success`
  - `warning`
  - `danger`
  - `info`
  - `progress`
- La edición directa de tokens de componente debe vivir en una sección avanzada.
- La UI debe evitar que el usuario tenga que editar cada componente para cambiar un tema global.
- Los colores codificados de forma fija dentro de reglas CSS deben tratarse como deuda técnica, salvo casos decorativos muy locales y documentados.
- El bloque exportado debe incluir primero tokens primitivos, luego semánticos y finalmente tokens de componente.
- Si un color global cambia, los componentes relacionados deben actualizarse por dependencia de tokens.

### Componentes Propios de ProjectTrack

Requisito origen: agregar una sección para componentes propios de ProjectTrack como `global-navbar` y `hero-card`.

Requisitos:

- El `Theme Manager` debe tener una sección dedicada a componentes propios de ProjectTrack, separada de los componentes Bootstrap base.
- Esta sección debe mostrar previews reales usando los templates/renderers existentes cuando sea posible.
- Componentes propios mínimos:
  - `global-navbar`: `Chrome/components/global-navbar.html`
  - `hero-card`: `Chrome/src/components/hero-card.js` y `Chrome/components/hero-card.html`
  - `projecttrack-brand`: `Chrome/src/components/projecttrack-brand.js`
  - `environment-progress`: `Chrome/src/components/environment-progress.js`
  - `pt-pill`: status, priority y variantes neutrales
  - `pt-clickable-card`
  - `pt-web-user-button`
  - `pt-web-user-avatar`
  - `pt-web-user-menu`
  - `pt-inline-notice-toast`
  - cards de métricas/dashboard
  - paneles de notes/tasks
  - release update panel de Profile
  - Change History entries
- Cada preview debe documentar qué tokens controla:
  - color
  - tipografía
  - spacing
  - border
  - radius
  - sombra
  - estados hover/focus/active
- La configuración debe diferenciar entre:
  - tokens globales que afectan varios componentes
  - tokens semánticos de dominio ProjectTrack
  - tokens específicos del componente
- `global-navbar` debe cubrir como mínimo:
  - fondo
  - borde inferior
  - marca/logo
  - breadcrumb
  - botón `Refresh Data`
  - menú de usuario
  - item activo del dropdown
  - estado responsive mobile
- `hero-card` debe cubrir como mínimo:
  - fondo
  - color de título
  - color de descripción
  - badges/meta
  - botones de acción
  - padding
  - radius
  - sombra
- Si un componente propio usa Bootstrap internamente, el preview debe mostrar ambas relaciones: clase Bootstrap base y token ProjectTrack aplicado encima.
- La sección debe servir como inventario visual para detectar componentes que todavía tienen valores codificados de forma fija.

### Bootstrap-Only Runtime Direction

Pregunta origen: qué hacer con las clases no-Bootstrap en el runtime activo.

Dirección actual:

- El runtime activo de Chrome debe usar markup Bootstrap-only.
- La capa visual residual debe vivir principalmente en tokens y variables Bootstrap editables desde Theme Manager.
- Las clases custom del runtime deben considerarse deuda a migrar, salvo que el archivo sea histórico, documental o no forme parte del workspace activo.

Reglas actuales:

- Las pantallas del workspace no deben depender de clases `pt-*` para layout, cards, listas, badges, botones, dropdowns, formularios o wrappers presentacionales.
- Las previews del Theme Manager deben mostrar el runtime con markup Bootstrap-only siempre que sea posible.
- Si un comportamiento visual sigue necesitando una capa custom, se debe preferir resolverlo mediante tokens Bootstrap y no mediante nuevas clases de runtime.

Clases residuales aceptables solo de forma temporal:

- selectores de compatibilidad mientras una migración está en curso
- clases de docs internas fuera del runtime activo
- clases de surfaces no activas como popup legacy o side panel, hasta que se limpien

Objetivo operativo:

- El Theme Manager debe evolucionar hacia un editor de tema Bootstrap en tiempo real, con la menor dependencia posible de markup custom.
- `Chrome/styles/projecttrack.css` debe converger a una capa minima de tokens/tema y no funcionar como una segunda libreria visual paralela a Bootstrap.

Consecuencia para auditoría:

- toda referencia a `pt-*` en el runtime activo debe tratarse como candidata a eliminación o migración
- el registro de componentes debe reflejar el estado Bootstrap-first real y no preservar clases antiguas por inercia

Objetivo arquitectónico actual:

- Las pantallas del workspace deben consumir Bootstrap directamente.
- Theme Manager debe editar tema/tokens, no depender de una capa extensa de clases propias del runtime.
- `Chrome/styles/projecttrack.css` debe reducirse hasta dejar solo el soporte mínimo que Bootstrap no cubra por variables.

Ejemplo esperado:

```js
renderHeroCard(...);
renderStatusPill(...);
renderEnvironmentProgress(...);
```

Ejemplo a evitar:

```html
<section class="pt-custom-wrapper pt-special-card pt-random-spacing">
```

Reglas de decisión:

- Si la clase representa un concepto de ProjectTrack, se conserva.
- Si la clase solo existe para una decisión visual que Bootstrap ya cubre, se migra a Bootstrap.
- Si la clase es propia pero visualmente relevante, se conserva y se tokeniza.
- Si la clase no se usa, se elimina.

El `Theme Manager` debe incluir una vista de auditoría para clases `pt-*` con estas categorías:

| Estado | Significado | Acción |
| --- | --- | --- |
| `componentize` | Clase custom necesaria para ProjectTrack, pero aún usada suelta en pantallas | Crear o mover a un componente propio en `Chrome/components` |
| `migrate` | Duplicación de Bootstrap | Reemplazar por clases Bootstrap |
| `tokenize` | Clase de componente propio con valores fijos | Mover valores a tokens documentados del componente |
| `remove` | Clase sin uso actual o sin justificación de componente | Eliminar del CSS |
| `keep` | Clase custom ya encapsulada en un componente propio | Mantener, documentar tokens y cubrir en el `Theme Manager` |

Organización recomendada dentro del `Theme Manager`:

1. `Bootstrap Base`: componentes y utilidades Bootstrap reales.
2. `ProjectTrack Components`: componentes propios como `global-navbar`, `hero-card`, `pt-pill` y `environment-progress`.
3. `Legacy / Audit`: inventario de clases `pt-*` no clasificadas o pendientes de migración.

Objetivo:

- Evitar borrar clases propias necesarias.
- Evitar mantener clases heredadas que solo duplican Bootstrap.
- Convertir decisiones visuales repetidas en tokens reutilizables.
- Mantener `Chrome/styles/projecttrack.css` como una capa clara sobre Bootstrap, no como una segunda librería paralela.

### Configuración por componente basada en Bootstrap

Requisito origen: la herramienta debe configurar cada componente usado, pero respetando cuántas opciones reales permite Bootstrap.

Requisitos:

- El `Theme Manager` debe permitir configurar cada componente usado en el proyecto:
  - colores
  - tamaños
  - espacios
  - fuentes
  - sombras
  - bordes
  - radius
  - estados hover/focus/active/disabled cuando aplique
- Los controles deben ofrecer opciones cerradas basadas en Bootstrap cuando Bootstrap ya define una escala.
- No se deben inventar opciones adicionales si Bootstrap ya tiene una lista finita para esa propiedad.
- Si una propiedad necesita más control que Bootstrap, debe vivir en una sección `ProjectTrack avanzado` y documentar por qué se sale de Bootstrap.
- Cada selector debe mostrar el nombre funcional y la clase/token que aplica.

Escalas Bootstrap que debe respetar:

| Categoría | Opciones UI permitidas | Clase/token Bootstrap |
| --- | --- | --- |
| Shadow | No shadow, Small shadow, Regular shadow, Large shadow | `shadow-none`, `shadow-sm`, `shadow`, `shadow-lg` |
| Spacing | 0, 1, 2, 3, 4, 5, Auto cuando aplique | `m-*`, `p-*`, `mx-*`, `py-*`, etc. |
| Gap | 0, 1, 2, 3, 4, 5 | `gap-*`, `row-gap-*`, `column-gap-*` |
| Radius | None, Small, Base, Large, XL, XXL, Pill, Circle | `rounded-0`, `rounded-1`, `rounded-2`, `rounded-3`, `rounded-4`, `rounded-5`, `rounded-pill`, `rounded-circle` |
| Border width | 0, 1, 2, 3, 4, 5 | `border-0`, `border-1`, `border-2`, `border-3`, `border-4`, `border-5` |
| Border color | Primary, Secondary, Success, Danger, Warning, Info, Light, Dark | `border-primary`, `border-secondary`, etc. |
| Background color | Primary, Secondary, Success, Danger, Warning, Info, Light, Dark, Body, Transparent | `bg-*` |
| Text color | Primary, Secondary, Success, Danger, Warning, Info, Light, Dark, Body, Muted, White | `text-*` |
| Font size | 1, 2, 3, 4, 5, 6 | `fs-1` a `fs-6` |
| Font weight | Light, Normal, Medium, Semibold, Bold, Bolder | `fw-light`, `fw-normal`, `fw-medium`, `fw-semibold`, `fw-bold`, `fw-bolder` |
| Alineación de texto | Start, Center, End | `text-start`, `text-center`, `text-end` |
| Display | None, Inline, Inline block, Block, Grid, Flex, Inline flex | `d-*` |
| Flex direction | Row, Row reverse, Column, Column reverse | `flex-*` |
| Justify content | Start, End, Center, Between, Around, Evenly | `justify-content-*` |
| Align items | Start, End, Center, Baseline, Stretch | `align-items-*` |

Reglas de UI:

- Para sombras, mostrar exactamente:
  - `No shadow`
  - `Small shadow`
  - `Regular shadow`
  - `Large shadow`
- Para spacing/gap, mostrar una escala humana:
  - `0`
  - `1 / 0.25rem`
  - `2 / 0.5rem`
  - `3 / 1rem`
  - `4 / 1.5rem`
  - `5 / 3rem`
- Para radius, mostrar una escala humana alineada a Bootstrap y mapearla a clases/tokens.
- Para colores, mostrar primero tokens semánticos ProjectTrack y luego, cuando aplique, su equivalente Bootstrap.
- Para cada componente, guardar/exportar la decisión como token cuando sea una decisión de tema, o como clase Bootstrap cuando sea una decisión estructural.
- El preview debe reflejar inmediatamente cada opción seleccionada.
- La exportación debe evitar generar CSS custom cuando una clase Bootstrap resuelve el caso de forma suficiente.

### Tema del proyecto

Decisión: cada proyecto debe tener un solo tema activo.

Requisitos:

- El `Theme Manager` debe manejar un único tema por proyecto.
- No se requiere un sistema multi-tema dentro del mismo proyecto.
- El tema activo debe representar la configuración visual oficial del proyecto.
- Si se necesita una variante, debe exportarse/importarse como tema externo, no convivir como segundo tema activo.
- El `Theme Manager` debe permitir volver al tema actual del proyecto antes de aplicar o exportar cambios.
- La fuente de verdad del tema del proyecto es `Chrome/styles/projecttrack.css`.
- Guardar significa generar el CSS final y sobrescribir solo el bloque marcado del `Theme Manager` dentro de `Chrome/styles/projecttrack.css`.

### Color mode Bootstrap

Decisión actual: ProjectTrack mantiene un solo tema activo en modo light.

Requisitos:

- El `Theme Manager` debe exponer `--bs-light` y `--bs-dark` como colores Bootstrap normales.
- El `Theme Manager` no debe activar un modo oscuro completo mientras se mantenga la decisión de un solo tema por proyecto.
- Si en el futuro se decide soportar dark mode, debe agregarse como sección avanzada de `Color Mode`.
- Un futuro dark mode debe usar la convención Bootstrap 5.3:

```css
[data-bs-theme="dark"] {
  /* tokens del modo oscuro */
}
```

- El soporte futuro de dark mode debe incluir QA visual, contraste WCAG AA, preview por componente y diff separado por modo.

### Importación y exportación

Decisión: el `Theme Manager` debe permitir importar y exportar.

Requisitos:

- Debe exportar el tema como bloque CSS reutilizable.
- El bloque exportado debe incluir variables Bootstrap y ProjectTrack relevantes.
- Debe importar un bloque `:root { ... }` existente.
- Al importar, debe parsear las variables conocidas y actualizar los controles correspondientes.
- Las variables desconocidas deben conservarse en una sección de revisión, no descartarse silenciosamente.
- Debe avisar si el CSS importado contiene reglas que no son variables `:root`.
- Debe permitir copiar el CSS generado.
- Debe permitir descargar el CSS generado como archivo cuando el runtime lo permita.

### Accesibilidad visual

Decisión: agregar validación visual y accesibilidad.

Requisitos:

- El `Theme Manager` debe incluir una sección de accesibilidad visual.
- Debe validar contraste entre texto y fondo para combinaciones principales.
- Debe marcar combinaciones que no cumplan contraste recomendado.
- Debe revisar, como mínimo:
  - texto primario sobre fondo principal
  - texto secundario sobre fondo principal
  - botón primario
  - botón secundario
  - alertas success/danger/warning/info
  - links
  - estados activos del menú
  - focus ring
- Debe mostrar el resultado como estado claro: aprobado, revisar o falla.
- Debe mantener visible el foco de teclado en todos los componentes editables.

### Estados de componentes

Decisión: usar los estados de Bootstrap.

Requisitos:

- Cada componente editable debe mostrar los estados soportados por Bootstrap cuando apliquen.
- Estados base:
  - default
  - hover
  - focus
  - active
  - disabled
- Estados de formularios:
  - valid
  - invalid
  - disabled
  - readonly cuando aplique
- Estados de navegación:
  - default
  - hover
  - active
  - disabled
  - expanded cuando aplique
- Estados de dropdown/modal:
  - closed
  - open
  - focus
  - active item
- Estados propios de ProjectTrack solo deben agregarse cuando el componente lo requiera, por ejemplo status, priority o environment progress.

### Breakpoints y responsive

Decisión: usar los breakpoints de Bootstrap 5.3.

Requisitos:

- El `Theme Manager` debe usar la escala responsive de Bootstrap 5.3:
  - `xs`: 0
  - `sm`: 576px
  - `md`: 768px
  - `lg`: 992px
  - `xl`: 1200px
  - `xxl`: 1400px
- Cuando una propiedad tenga variación responsive, la UI debe mostrar esos breakpoints y mapearlos a clases Bootstrap.
- No se deben inventar breakpoints propios sin una justificación documentada.
- El preview debe permitir revisar al menos mobile, tablet y desktop.

### Auditoría automática

Decisión: por esta ocasión sí se permite auditoría automática; en el futuro no debe depender de escaneo permanente.

Requisitos:

- En la fase inicial, el `Theme Manager` puede auditar automáticamente:
  - variables `--pt-*`
  - variables `--bs-*`
  - clases `pt-*`
  - componentes existentes en `Chrome/components`
  - clases Bootstrap usadas en pantallas
- Esta auditoría debe servir para construir el inventario inicial y detectar deuda.
- A futuro, la fuente de verdad debe ser un registro explícito de componentes y tokens, no un escaneo permanente del código.
- Las clases no clasificadas deben entrar en `Legacy / Audit`.

### Vista por componente

Sugerencia aceptada: agregar una vista específica por componente.

Requisitos:

- La UI debe permitir seleccionar un componente.
- Cada componente debe tener:
  - preview aislado
  - preview en contexto
  - lista de tokens relacionados
  - controles disponibles
  - estados Bootstrap aplicables
  - clases Bootstrap utilizadas
  - clases ProjectTrack internas
  - salida CSS/tokens afectados
- Debe existir una forma de saber si una opción genera CSS custom o solo aplica una clase Bootstrap.
- La vista por componente debe indicar qué pantallas usan ese componente.

### Relación con UI Guide

Decisión: mantener `UI Guide`, pero cambiar su rol frente al `Theme Manager`.

Definición:

- `UI Guide` debe funcionar como referencia visual/documental estática del sistema UI actual.
- `Theme Manager` debe funcionar como herramienta activa para configurar, probar, auditar, importar/exportar y guardar el tema real.
- Ambas superficies pueden coexistir mientras tengan responsabilidades distintas.

Uso esperado:

| Pantalla | Propósito |
| --- | --- |
| `UI Guide` | Consultar cómo se ve y cómo se usa el sistema UI actual |
| `Theme Manager` | Modificar, probar, auditar y guardar el tema real |
| `Change History` | Consultar historial de cambios del proyecto |

Reglas:

- No se debe eliminar `UI Guide` mientras el `Theme Manager` no cubra toda la documentación visual.
- Si ambos muestran componentes, el `Theme Manager` debe tender a usar los componentes reales y editables.
- `UI Guide` puede enlazar al `Theme Manager` cuando una sección sea configurable.
- `Theme Manager` puede enlazar a `UI Guide` cuando el usuario necesite contexto documental.
- A futuro, cuando el `Theme Manager` tenga galería completa, accesibilidad, diff y vista por componente, se puede decidir si:
  - `UI Guide` se mantiene como documentación para usuarios/desarrolladores.
  - `UI Guide` se reduce y enlaza al `Theme Manager`.
  - `UI Guide` se elimina si el `Theme Manager` cubre completamente su propósito.

### Modo simple y avanzado

Sugerencia aceptada: separar controles simples y avanzados.

Requisitos:

- `Simple`: controles principales para marca, tipografía, radius, spacing, sombras y estados básicos.
- `Avanzado`: tokens por componente, estados, breakpoints, gradientes, auditoría, importación y diff.
- El modo simple no debe ocultar errores críticos de accesibilidad.
- El modo avanzado debe mostrar nombres reales de variables, clases y componentes.
- La UI debe permitir pasar de simple a avanzado sin perder cambios.

### Diff del tema

Sugerencia aceptada: agregar comparación entre tema actual y tema editado.

Requisitos:

- Debe mostrar valor actual cargado desde `projecttrack.css`.
- Debe mostrar valor modificado.
- Debe mostrar variable o clase afectada.
- Debe mostrar componentes impactados cuando sea posible.
- Debe permitir filtrar por:
  - colores
  - tipografía
  - spacing
  - sombras
  - radius
  - componentes
  - accesibilidad
- Debe permitir copiar/exportar solo los cambios.
- Debe permitir volver un cambio individual al valor original.

## Especificación funcional de UI

Decisión: documentar cómo debe organizarse y comportarse la pantalla antes de continuar ampliando la implementación.

Objetivo:

- Convertir los requisitos del `Theme Manager` en una estructura clara de pantalla.
- Evitar que la herramienta crezca como una lista desordenada de controles.
- Separar controles globales, componentes, auditoría, accesibilidad, importación/exportación y diff.

### Layout general

La pantalla debe organizarse en tres áreas principales:

```text
Theme Manager
├── Header de estado
├── Navegación lateral
└── Área principal
    ├── Panel de controles
    ├── Preview
    └── Panel auxiliar según sección
```

Header de estado:

- Nombre de la herramienta.
- Estado del tema:
  - `Project CSS loaded`
  - `Unsaved changes`
  - `Import review`
  - `Saved`
  - `Error`
- Acciones principales:
  - `Reset to project CSS`
  - `Import CSS`
  - `Export CSS`
  - `Save to projecttrack.css`

Navegación lateral:

- `Overview`
- `Theme Tokens`
- `Bootstrap Base`
- `ProjectTrack Components`
- `Legacy / Audit`
- `Accessibility`
- `Import / Export`
- `Backups / Versions`
- `Diff`

Área principal:

- Debe cambiar según la sección seleccionada.
- Debe mantener siempre un preview visible o accesible.
- Debe indicar qué variables, clases o componentes se afectan con cada cambio.

### Overview

Objetivo:

- Dar una vista rápida del tema actual y del estado de cambios.

Debe mostrar:

- Ruta fuente: `Chrome/styles/projecttrack.css`.
- Fecha/hora de última lectura del CSS.
- Cantidad de variables Bootstrap detectadas.
- Cantidad de variables ProjectTrack detectadas.
- Cantidad de componentes propios registrados.
- Cantidad de clases `pt-*` pendientes de auditoría.
- Estado de accesibilidad general.
- Resumen de cambios sin guardar.

Acciones:

- `Open Theme Tokens`
- `Review Components`
- `Review Diff`
- `Save to projecttrack.css`

### Theme Tokens

Objetivo:

- Editar tokens globales del tema.

Subsecciones:

- `Colors`
- `Typography`
- `Spacing`
- `Radius`
- `Shadows`
- `Borders`
- `Gradients`

Comportamiento:

- Cada control debe mostrar:
  - nombre funcional
  - variable CSS real
  - valor actual desde `projecttrack.css`
  - valor editado
  - componentes impactados cuando sea posible
- Cada cambio debe actualizar el preview inmediatamente.
- Cada cambio debe aparecer en `Diff`.

### Bootstrap Base

Objetivo:

- Configurar opciones disponibles en Bootstrap sin inventar escalas nuevas.

Debe incluir:

- Buttons
- Cards
- Alerts
- Forms
- Tables
- Dropdowns
- Modals
- Badges
- Progress
- Navbar base
- Utilities relevantes

Reglas:

- Si Bootstrap ofrece una escala cerrada, la UI debe mostrar solo esa escala.
- Si una opción se resuelve con clase Bootstrap, la herramienta debe indicarlo.
- Si una opción requiere CSS custom, debe enviarse a modo avanzado o componente propio.

### ProjectTrack Components

Objetivo:

- Configurar componentes propios de ProjectTrack registrados en `Chrome/components`.

Debe iniciar con:

- `global-navbar`
- `hero-card`
- `projecttrack-brand`
- `environment-progress`
- `status-pill`
- `priority-pill`
- `metric-card`
- `inline-notice-toast`
- `release-update-panel`
- `change-history-entry`

Vista de cada componente:

- Preview aislado.
- Preview en contexto.
- Tokens globales usados.
- Tokens específicos del componente.
- Controles inline para tokens ya registrados por el `Theme Manager`.
- Lista visible de tokens pendientes de definición.
- Clases Bootstrap usadas internamente.
- Clases `pt-*` internas.
- Estados Bootstrap aplicables.
- Estados propios aplicables.
- Pantallas donde se usa.
- Diff específico del componente.

Acciones por componente:

- `Reset component`
- `Copy component CSS`
- `View impacted screens`
- `Mark as reviewed`

### Legacy / Audit

Objetivo:

- Clasificar clases `pt-*` que todavía no estén claramente asociadas a Bootstrap o a componentes propios.

Debe mostrar una tabla con:

- Clase.
- Archivo CSS.
- Archivos/pantallas donde aparece.
- Estado:
  - `componentize`
  - `migrate`
  - `tokenize`
  - `remove`
  - `keep`
- Acción recomendada.
- Notas.

Regla:

- Una clase `pt-*` usada directamente por pantallas debe moverse a componente propio, migrarse a Bootstrap o eliminarse.

### Accessibility

Objetivo:

- Revisar accesibilidad visual del tema.

Debe mostrar:

- Contraste por combinación.
- Resultado:
  - `Pass`
  - `Review`
  - `Fail`
- Variable o componente afectado.
- Sugerencia de ajuste.

Debe revisar:

- Texto principal.
- Texto secundario.
- Links.
- Botones.
- Alerts.
- Navbar.
- Cards.
- Focus ring.
- Estados disabled.

### Import / Export

Objetivo:

- Permitir importar CSS existente y exportar CSS final.

Importar:

- Campo para pegar bloque `:root { ... }`.
- Validación de variables conocidas/desconocidas.
- Vista de revisión antes de aplicar al preview.
- Opción para cancelar importación.

Exportar:

- Export completo del tema.
- Export solo de cambios.
- Copiar CSS.
- Descargar CSS cuando el runtime lo permita.

### Backups / Versions

Objetivo:

- Mostrar versiones anteriores de `projecttrack.css` generadas por el proceso de guardado.
- Permitir revisar, comparar, exportar y restaurar una versión anterior.

Ubicación recomendada de backups:

- `Chrome/styles/backups/`

Formato de archivo:

- `projecttrack.YYYY-MM-DD-HHMM.css`
- Ejemplo: `projecttrack.2026-04-20-1030.css`

La UI debe mostrar:

- Fecha/hora de creación.
- Nombre del archivo.
- Tamaño.
- Origen:
  - servidor local Python
  - script Python manual
  - File System Access API
- Estado:
  - disponible
  - restaurado
  - error de lectura

Acciones por versión:

- `Preview`: ver el CSS de esa versión.
- `Compare`: comparar contra el `projecttrack.css` actual.
- `Restore`: restaurar esa versión.
- `Export`: descargar/copiar esa versión.
- `Delete`: opcional, solo con confirmación explícita.

Flujo de restauración:

1. Usuario selecciona una versión anterior.
2. La UI muestra diff contra el `projecttrack.css` actual.
3. Usuario confirma `Restore`.
4. La herramienta crea backup del estado actual antes de restaurar.
5. La herramienta copia la versión seleccionada sobre `Chrome/styles/projecttrack.css`.
6. La herramienta vuelve a leer `projecttrack.css`.
7. La UI confirma éxito o muestra error.

Reglas:

- Aunque existan backups, la herramienta debe validar antes de guardar.
- Un backup reduce el riesgo, pero no justifica guardar CSS inválido.
- Si un guardado falla después de crear backup, la UI debe ofrecer restaurar la versión anterior.
- No se debe eliminar automáticamente ningún backup sin una política explícita futura.
- La sección `Backups / Versions` debe estar disponible desde el menú lateral del `Theme Manager`.

### Diff

Objetivo:

- Comparar `projecttrack.css` actual contra el tema editado.

Debe mostrar:

- Variable/clase.
- Valor actual.
- Valor editado.
- Tipo de cambio:
  - added
  - changed
  - removed
- Componentes impactados.
- Resumen de tokens modificados.
- Resumen de componentes impactados.
- Cambios agrupados por componente.
- Acciones:
  - revertir cambio individual
  - copiar cambio
  - exportar cambios

Filtros:

- colores
- tipografía
- spacing
- radius
- sombras
- borders
- gradientes
- componentes
- accesibilidad

### Comportamiento de guardado

Flujo esperado:

1. Leer `Chrome/styles/projecttrack.css`.
2. Detectar el bloque marcado del `Theme Manager`.
3. Mostrar valores actuales.
4. Usuario modifica controles.
5. Preview se actualiza en tiempo real.
6. `Diff` registra cambios.
7. Usuario presiona `Save to projecttrack.css`.
8. La herramienta muestra confirmación.
9. La herramienta crea backup del archivo actual.
10. La herramienta reemplaza únicamente el bloque marcado del `Theme Manager`.
11. La herramienta vuelve a leer el archivo y confirma que el tema guardado coincide con el preview.

No debe existir guardado automático.

### Bloque marcado de tokens

Decisión: el guardado no debe sobrescribir todo `Chrome/styles/projecttrack.css`; debe sobrescribir solo un bloque marcado de tokens.

Marcadores aprobados:

```css
/* THEME MANAGER TOKENS START */
:root {
  /* tokens controlados por Theme Manager */
}
/* THEME MANAGER TOKENS END */
```

Reglas:

- El bloque marcado es la única zona que el `Theme Manager` puede reemplazar automáticamente.
- El resto de `Chrome/styles/projecttrack.css` no debe modificarse durante el guardado.
- Si el bloque no existe, la herramienta debe proponer crearlo con confirmación explícita.
- Si existen múltiples bloques marcados, la herramienta debe bloquear el guardado y pedir revisión manual.
- El diff debe mostrar claramente que solo se reemplazará el bloque marcado.
- El backup debe incluir el archivo completo antes del reemplazo.

### Mecanismo de escritura en `projecttrack.css`

Decisión: usar una estrategia por fallback para sobrescribir `Chrome/styles/projecttrack.css`.

Orden aprobado:

1. Servidor local Python.
2. Script Python manual.
3. File System Access API.

Configuración aprobada:

- Puerto del servidor local Python: `127.0.0.1:4177`.
- Scripts Python:
  - `scripts/theme/theme_manager_server.py`
  - `scripts/theme/save_theme.py`
- Formato de backup:
  - `projecttrack.YYYY-MM-DD-HHMM.css`
  - ejemplo: `projecttrack.2026-04-20-1030.css`
- Carpeta de backups:
  - `Chrome/styles/backups/`
- Formato obligatorio de importación/exportación:
  - CSS con bloque `:root { ... }`
- Nivel mínimo de accesibilidad:
  - WCAG AA.
- Registro de componentes:
  - crear un registro explícito, por ejemplo `Chrome/src/theme/component-registry.js`.
- MVP actual:
  - reemplazarlo por la nueva arquitectura funcional.

#### Opción 1: servidor local Python

Primera opción aprobada.

Funcionamiento esperado:

- Un script Python levanta un servidor local en `127.0.0.1`.
- El `Theme Manager` consulta el servidor para:
  - verificar disponibilidad
  - leer `Chrome/styles/projecttrack.css`
  - guardar el CSS nuevo confirmado
  - crear backup antes de sobrescribir
  - devolver resultado como JSON
- El servidor solo debe aceptar escrituras dentro del workspace del proyecto.
- El servidor no debe escuchar en `0.0.0.0`.
- El servidor debe validar que el archivo destino sea `Chrome/styles/projecttrack.css`.
- El servidor debe rechazar rutas arbitrarias.
- El servidor debe generar backup antes de guardar.
- El backup debe usar el formato `projecttrack.YYYY-MM-DD-HHMM.css`.
- El servidor debe reemplazar únicamente el bloque marcado entre `THEME MANAGER TOKENS START` y `THEME MANAGER TOKENS END`.
- El servidor debe dejar logs claros de lectura, guardado, backup y errores.

Si el servidor local Python es bloqueado por el sistema, no inicia correctamente o no puede escribir el archivo, pasar a la opción 2.

#### Opción 2: script Python manual

Fallback aprobado si el servidor local Python da problema.

Funcionamiento esperado:

- El `Theme Manager` exporta el CSS final.
- El usuario ejecuta manualmente un script Python para aplicar el CSS exportado.
- El script debe:
  - recibir CSS por archivo o stdin
  - validar que contiene un bloque `:root`
  - crear backup de `Chrome/styles/projecttrack.css`
  - usar el formato de backup `projecttrack.YYYY-MM-DD-HHMM.css`
  - reemplazar únicamente el bloque marcado del `Theme Manager`
  - mostrar resultado claro en consola
- El script debe funcionar en Windows y macOS.
- El script no debe tocar rutas fuera del workspace.

Si el script Python manual también es bloqueado o no puede ejecutarse, pasar a la opción 3.

#### Opción 3: File System Access API

Tercera opción aprobada si Python no es viable.

Funcionamiento esperado:

- El usuario selecciona manualmente `Chrome/styles/projecttrack.css` desde el navegador.
- El `Theme Manager` solicita permiso explícito para escribir el archivo.
- La herramienta sobrescribe el archivo seleccionado con el CSS confirmado.
- La UI debe indicar claramente que esta opción depende de soporte del navegador y políticas corporativas.

Regla común para las tres opciones:

- Ninguna opción puede guardar sin confirmación explícita del usuario.
- Todas deben crear o recomendar backup antes de sobrescribir.
- Todas deben mostrar diff antes de guardar.
- Todas deben reportar éxito o error de forma visible.

## Requisitos técnicos

- Usar solo HTML5, CSS3 y JavaScript vanilla.
- Mantener la integración dentro del workspace Chrome existente.
- Escuchar eventos `input` y `change` de los controles.
- Actualizar variables CSS en tiempo real usando `style.setProperty`.
- Mantener el layout responsivo.
- Evitar dependencias nuevas.
- Mantener `Chrome/styles/projecttrack.css` como única capa custom activa sobre Bootstrap.
- Reemplazar el MVP actual del `Theme Manager` por la nueva arquitectura funcional definida en este documento.
- Implementar primero la fase que más convenga para desbloquear el producto real:
  - lectura/parsing de `projecttrack.css`
  - estado interno del tema
  - diff
  - import/export CSS
  - servidor local Python
  - guardado seguro
  - layout funcional
  - componentes reales

## Criterios de aceptación

- La opción `Theme Manager` aparece en el menú global.
- La ruta `workspace.html?view=theme-manager` abre la pantalla.
- Los controles actualizan el preview sin recargar.
- El bloque exportado cambia cuando cambia cualquier control.
- El bloque exportado inicia con `:root {` y contiene variables Bootstrap y ProjectTrack relevantes.
- La importación de `:root { ... }` actualiza los controles reconocidos.
- La UI muestra resultados básicos de contraste/accesibilidad.
- La UI diferencia modo simple y modo avanzado.
- La UI permite revisar diff entre tema actual y tema editado.
- La UI lee el tema actual desde `projecttrack.css`.
- La UI deja claro que los cambios no se guardan automáticamente en `projecttrack.css`.
- La UI permite guardar explícitamente y sobrescribir `projecttrack.css` con confirmación.
- La documentación lista los componentes aún pendientes de incorporar al preview.

## Pendientes

- Agregar galería completa de componentes reales.
- Mostrar una sección de tipografía completa con escala `--pt-text-step-*`.
- Ampliar tokens editables por componente.
- Agregar preview/compare visual de backups antes de restaurar.
- Mejorar el diff para agrupar por componente impactado.
- Reemplazar la auditoría automática inicial por un registro explícito completo.
