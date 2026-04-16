# Deployment Chrome con GitHub Releases

Este flujo reemplaza OneDrive como punto de entrega manual para la extension Chrome.

## Que queda automatizado

1. Se empaqueta la carpeta `Chrome/` como `ProjectTrack-Chrome.zip`.
2. Se genera `projecttrack-chrome-release.json` con version, fecha y hash.
3. Un release por tag `vX.Y.Z` puede subir esos assets a GitHub Releases.
4. La tabla `public.app_releases` en Supabase registra cual es la ultima version privada.
5. La extension consulta Supabase al abrir y avisa si hay una version nueva.

## Que sigue siendo manual

Chrome no permite que una extension desempaque y reemplace sus propios archivos. Cuando haya una version nueva, el usuario debe:

1. Descargar `ProjectTrack-Chrome.zip`.
2. Descomprimirlo sobre la carpeta local usada con `Load unpacked`.
3. Abrir `chrome://extensions`.
4. Presionar `Reload` en ProjectTrack.

## Repositorio privado + Supabase

Si el repositorio sigue privado, la extension no debe guardar un token de GitHub. En este modo:

1. Supabase guarda solo metadata liviana en `public.app_releases`.
2. `Profile / Extension Updates` compara `Chrome/manifest.json` contra la version activa en Supabase.
3. `Open Release` abre el release privado de GitHub.
4. El usuario descarga el zip usando una cuenta de GitHub con acceso al repo.
5. La instalacion sigue siendo manual: descomprimir y recargar en `chrome://extensions`.

Este flujo no agrega tokens ni secretos de GitHub dentro de la extension.

## Activar metadata en Supabase

Aplicar una vez:

```sql
-- Android/sql/app_releases_chrome_20260416.sql
```

Ese script crea `public.app_releases`, habilita RLS, permite lectura a usuarios `authenticated` e inserta la version inicial `0.1.0`.

Para publicar una version nueva, agregar o actualizar una fila:

```sql
insert into public.app_releases (
  app_name,
  version,
  release_id,
  release_name,
  release_url,
  download_url,
  asset_name,
  active,
  published_at
) values (
  'projecttrack-chrome',
  '0.1.1',
  'v0.1.1',
  'ProjectTrack Chrome 0.1.1',
  'https://github.com/jmirsteinban/ProjectTack/releases/tag/v0.1.1',
  'https://github.com/jmirsteinban/ProjectTack/releases/tag/v0.1.1',
  'ProjectTrack-Chrome.zip',
  true,
  now()
)
on conflict (app_name, version) do update
set active = excluded.active,
    release_url = excluded.release_url,
    download_url = excluded.download_url,
    published_at = excluded.published_at,
    updated_at = now();
```

## Crear paquete local

Desde la raiz del repo:

```powershell
.\scripts\package-chrome-release.ps1
```

El script genera:

- `dist/chrome/ProjectTrack-Chrome.zip`
- `dist/chrome/ProjectTrack-Chrome-vX.Y.Z.zip`
- `dist/chrome/projecttrack-chrome-release.json`

## Publicar release

1. Subir el cambio de version en `Chrome/manifest.json`.
2. Crear tag con la misma version:

```powershell
git tag -a v0.2.0 -m "ProjectTrack Chrome 0.2.0"
git push origin v0.2.0
```

El workflow `.github/workflows/chrome-release.yml` valida que el tag coincida con `manifest.json` y publica los assets.

## Probar el canal de actualizacion

Prueba base con la version actual `0.1.0`:

1. Aplicar `Android/sql/app_releases_chrome_20260416.sql` en Supabase.
2. Abrir la extension e iniciar sesion.
3. Ir a `Profile / Extension Updates`.
4. Confirmar que el estado indique que la version instalada esta al dia.

Prueba simulando una version nueva:

1. Insertar una fila temporal con `version = '0.1.1'`, `app_name = 'projecttrack-chrome'` y `active = true`.
2. Volver a `Profile / Extension Updates`.
3. Presionar `Check for updates`.
4. Confirmar que aparece el aviso de nueva version.
5. Presionar `Open Release` y validar que abre GitHub Releases.
6. Desactivar o borrar la fila temporal para volver al estado real.

## Nota de costo

Este flujo usa Supabase solo para una tabla pequena de metadata. No usa Supabase Storage, Edge Functions ni descarga archivos desde Supabase.

El costo depende del plan y de las cuotas reales del proyecto, pero este uso deberia ser minimo porque la extension solo lee una fila de `public.app_releases` cuando revisa actualizaciones.

Referencias utiles:

- https://supabase.com/pricing
- https://supabase.com/docs/guides/platform/billing-on-supabase
