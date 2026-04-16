# Deployment Chrome con GitHub Releases

Este flujo reemplaza OneDrive como punto de entrega manual para la extension Chrome.

## Que queda automatizado

1. Se empaqueta la carpeta `Chrome/` como `ProjectTrack-Chrome.zip`.
2. Se genera `projecttrack-chrome-release.json` con version, fecha y hash.
3. Un release por tag `vX.Y.Z` puede subir esos assets a GitHub Releases.
4. La extension consulta el ultimo release al abrir y avisa si hay una version nueva cuando el canal es accesible.

## Que sigue siendo manual

Chrome no permite que una extension desempaque y reemplace sus propios archivos. Cuando haya una version nueva, el usuario debe:

1. Descargar `ProjectTrack-Chrome.zip`.
2. Descomprimirlo sobre la carpeta local usada con `Load unpacked`.
3. Abrir `chrome://extensions`.
4. Presionar `Reload` en ProjectTrack.

## Repositorio privado

Si el repositorio sigue privado, la extension no debe guardar un token de GitHub. En ese modo:

1. El panel `Profile / Extension Updates` muestra el canal como privado.
2. `Open Release` abre GitHub Releases.
3. El usuario descarga el zip usando una cuenta de GitHub con acceso al repo.
4. La instalacion sigue siendo manual: descomprimir y recargar en `chrome://extensions`.

La comparacion automatica de version requiere una fuente legible sin secretos dentro de la extension, por ejemplo un endpoint interno o una tabla de Supabase protegida por el login de ProjectTrack.

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
