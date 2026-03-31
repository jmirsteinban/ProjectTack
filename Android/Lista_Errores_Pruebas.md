# Lista de Errores de Prueba - ProjectTrack
Actualizado: 2026-03-11

| Error ID | Caso de prueba | Pantalla/flujo | Error observado | Posible causa | Estado |
|---|---|---|---|---|---|
| ERR-001 | CU-014-P02 | Editar cambio -> Guardar cambios | `new row for relation "changes" violates check constraint "changes_status_check"` (HTTP `PATCH`) | El valor de `status` enviado por la app no coincide con los valores permitidos actualmente por el constraint `changes_status_check` en BD. | Corregido en codigo (pendiente QA) |
| ERR-002 | CU-010-P02 | Editar proyecto -> Guardar cambios | `No se pudo confirmar la actualizacion del proyecto (UPDATE devolvio 0 filas...)` y mismatch `workfront esperado='...' actual=''` | Policy RLS de `UPDATE` en `public.projects` bloqueaba la fila para usuarios sin ownership/asignacion. | Corregido en BD (modo equipo con `projects_update_authenticated_all_20260311.sql`) - QA OK |
| ERR-003 | CU-015-P02 | Eliminar cambio -> Volver al listado | El cambio eliminado `sigue apareciendo` en la lista. | El flujo de listado podria no estar filtrando correctamente cambios eliminados logicamente o no refresca datos tras eliminar. | Corregido en codigo (pendiente QA) |
| ERR-004 | CU-018-P02 | Detalle de cambio -> TO-DO -> Completar/Reabrir | Solicitud de `revisar el flujo de nuevo` por comportamiento no conforme en cambio de estado. | Posible inconsistencia entre actualizacion en BD, permisos RLS de notas o refresco de estado en UI tras toggle. | Corregido en codigo (pendiente QA) |
| ERR-005 | CU-018-P01 | Detalle de cambio -> TO-DO -> Modal Editar nota | En el modal de edicion `no aparece la opcion de cambiar el estado`. | El modal `Editar nota TO-DO` solo permite editar texto/asignados; no expone control de estado (Pendiente/Completado). | Corregido en codigo (pendiente QA) |
