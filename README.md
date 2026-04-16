# ProjectTrack

ProjectTrack es un repositorio mixto que concentra dos frentes del producto:

- `Android/`: aplicacion Android, fuente funcional principal del producto.
- `Chrome/`: extension de Chrome con experiencia popup/full-tab que replica progresivamente la experiencia de Android.

La referencia documental principal del estado actual del proyecto vive en:

- `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`

## Estructura

```text
ProjectTack/
|- Android/
|  |- ProjectTrack/
|  `- ...
|- Chrome/
|  |- src/
|  |- styles/
|  |- manifest.json
|  |- popup.html
|  |- dashboard.html
|  |- workspace.html
|  `- sidepanel.html
|- docs/
|  |- DOCUMENTACION_CENTRAL_PROJECTTRACK.md
|  |- ToDo.md
|  `- chrome/
`- README.md
```

## Documentacion

- `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`: estado funcional, tecnico y operativo del proyecto.
- `docs/ToDo.md`: lista corta de hallazgos, pendientes y contexto operativo.
- `docs/chrome/projecttrack-ui.html`: guia viva del sistema UI de la extension Chrome.
- `docs/chrome/deployment-github-releases.md`: guia de empaquetado y actualizacion privada de la extension Chrome.

## Chrome Extension

La extension usa Manifest V3. La entrada visible actual es `Chrome/popup.html`, que abre la experiencia principal en `Chrome/dashboard.html`.

El side panel queda oculto temporalmente hasta nuevo aviso. `Chrome/sidepanel.html` permanece en el repo, pero no esta publicado en `manifest.json` ni aparece como accion del popup.

Puntos importantes:

- `Chrome/src/main.js`: entrypoint del runtime.
- `Chrome/src/projecttrack-app.js`: app shell, wiring de acciones y estado principal.
- `Chrome/src/projecttrack-router.js`: router de pantallas.
- `Chrome/styles/projecttrack.css`: estilos globales y design system Bootstrap-ProjectTrack.

Para probar la extension localmente:

1. Abre `chrome://extensions/`.
2. Activa `Developer mode`.
3. Haz clic en `Load unpacked`.
4. Selecciona la carpeta `Chrome/`.

### Deployment y actualizaciones

La distribucion privada de Chrome ya no depende de OneDrive como punto principal de entrega.

- GitHub Releases privado guarda los paquetes `.zip`.
- Supabase guarda solo la metadata de version en `public.app_releases`.
- La extension consulta esa metadata despues del login y avisa si hay una version nueva.
- La extension no guarda tokens de GitHub.

Chrome no permite que una extension instalada como `Load unpacked` se reemplace sola. Por eso la actualizacion sigue siendo manual:

1. Abrir `Profile / Extension Updates`.
2. Abrir el release privado de GitHub.
3. Descargar `ProjectTrack-Chrome.zip`.
4. Descomprimirlo sobre la carpeta local usada en `Load unpacked`.
5. Presionar `Reload` en `chrome://extensions`.

## Android

La app Android vive en `Android/ProjectTrack`.

Para abrirla localmente:

1. Abre `Android Studio`.
2. Selecciona `Open`.
3. Elige la carpeta `Android/ProjectTrack`.

Notas:

- `local.properties` y carpetas de build no se versionan.
- El repo incluye `.gitignore` raiz para cubrir Android, Chrome y archivos locales comunes.

## Backend

El proyecto usa Supabase para:

- autenticacion
- lectura remota
- escritura remota
- borrado logico

La implementacion activa de la extension Chrome ya trabaja con ese backend y la documentacion central explica el alcance actual.

## Estado actual

Resumen corto:

- Android sigue siendo la base funcional principal.
- Chrome ya tiene runtime web activo; el side panel queda oculto temporalmente.
- Chrome usa una capa UI propia documentada como Bootstrap-ProjectTrack.
- El trabajo activo se sigue desde `docs/ToDo.md`.

## Recomendaciones para contribuir

- Revisa primero `docs/DOCUMENTACION_CENTRAL_PROJECTTRACK.md`.
- Revisa luego `docs/ToDo.md` antes de empezar cambios.
- En Chrome, prioriza clases y patrones Bootstrap-ProjectTrack antes de crear clases custom nuevas.
- Evita subir caches, builds o archivos locales sensibles; el `.gitignore` raiz ya cubre la mayoria de esos casos.
