# Supabase Edge Functions

Funciones server-side para operaciones sensibles que no deben ejecutarse desde la extension Chrome.

## Funcion actual

- `admin-set-password`
  - Cambia la password de un usuario de Supabase Auth usando `service_role`.
  - Solo permite la ejecucion si el usuario autenticado es `jmirsteinban@gmail.com`.
  - No debe exponerse fuera del flujo administrativo de ProjectTrack.
  - El flujo fue validado exitosamente desde `Configuration` el `2026-04-24`.

## Variables requeridas

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` o `SB_PUBLISHABLE_KEY`

## Deploy sugerido

```powershell
supabase functions deploy admin-set-password
```

## Uso esperado desde Chrome

- La extension invoca `POST /functions/v1/admin-set-password`
- Debe enviar el JWT del usuario actual en `Authorization: Bearer <token>`
- Payload:

```json
{
  "userId": "uuid-del-usuario",
  "password": "nueva-clave-segura"
}
```
