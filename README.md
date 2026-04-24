# ProjectTrack

ProjectTrack es un repositorio mixto con dos frentes del producto:

- `Android/`: aplicacion Android, fuente funcional principal.
- `Chrome/`: extension Chrome con experiencia popup/full-tab.

Importante:
- El desarrollo de `Android/` queda pausado hasta nuevo aviso.
- El frente activo para desarrollo y validacion continua es `Chrome/`.

La documentacion canonica del estado actual vive en:

- `docs/PROJECTTRACK.md`

## Estructura

```text
ProjectTack/
|- Android/
|  |- ProjectTrack/
|  `- ...
|- Chrome/
|  |- docs/
|  |- src/
|  |- styles/
|  |- manifest.json
|  |- popup.html
|  |- workspace.html
|  `- sidepanel.html
|- docs/
|  |- PROJECTTRACK.md
|  `- chrome/
|- sql/
`- README.md
```

## Documentacion

- `docs/PROJECTTRACK.md`: estado funcional, tecnico, operativo, pendientes y reglas de mantenimiento.
- `docs/chrome/deployment-github-releases.md`: guia de empaquetado y actualizacion privada de la extension Chrome.
- `docs/chrome/bootstrap-migration-tracking.md`: seguimiento de la migracion Bootstrap Chrome.
- `docs/AGENTES_IA_PROJECTTRACK.md`: playbook para usar agentes IA con roles, prompts y feedback preciso.
- `docs/AGENTES_IA_FEEDBACK_LOG.md`: log de fallas, aciertos y mejoras para ciclos con agentes.

## Chrome Extension

La extension usa Manifest V3. La entrada visible actual es `Chrome/popup.html`, que abre la experiencia principal full-tab en `Chrome/workspace.html`.

El side panel queda oculto temporalmente hasta nuevo aviso. `Chrome/sidepanel.html` permanece en el repo, pero no esta publicado en `manifest.json` ni aparece como accion del popup.

Puntos principales:

- `Chrome/src/main.js`: entrypoint del runtime.
- `Chrome/src/projecttrack-app.js`: app shell, wiring de acciones y estado principal.
- `Chrome/src/projecttrack-router.js`: router de pantallas.
- `Chrome/workspace.html`: runtime principal full-tab con Bootstrap local.
- `Chrome/styles/projecttrack.css`: unica capa custom de ProjectTrack.

Para probar la extension localmente:

1. Abre `chrome://extensions/`.
2. Activa `Developer mode`.
3. Haz clic en `Load unpacked`.
4. Selecciona la carpeta `Chrome/`.

## Deployment Chrome

La distribucion privada de Chrome usa GitHub Releases para paquetes `.zip` y Supabase para metadata de version en `public.app_releases`.

Chrome no permite que una extension instalada como `Load unpacked` se reemplace sola. La actualizacion sigue siendo manual:

1. Abrir `Configuration / Extension Updates`.
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
- metadata del canal privado de releases Chrome

## Contribuir

- Revisa primero `docs/PROJECTTRACK.md`.
- En Chrome, prioriza Bootstrap real y el runtime actual del workspace.
- Si usas agentes IA, sigue `docs/AGENTES_IA_PROJECTTRACK.md` y registra mejoras en `docs/AGENTES_IA_FEEDBACK_LOG.md`.
- Evita subir caches, builds o archivos locales sensibles; el `.gitignore` raiz ya cubre la mayoria de esos casos.
