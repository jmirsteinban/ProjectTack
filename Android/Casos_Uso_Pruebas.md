# Casos de uso de prueba - ProjectTrack
Actualizado: 2026-03-11

| Caso ID | Paso ID | Pantalla | Paso de prueba | Resultado esperado | Estado QA |
|---|---|---|---|---|---|
| CU-001 Login exitoso | CU-001-P01 | Login | Abrir la app sin sesion iniciada. | Se muestra la pantalla `login`. | OK |
| CU-001 Login exitoso | CU-001-P02 | Login | Ingresar correo y contrasena validos y tocar `Ingresar`. | La app autentica y navega a `Inicio / Dashboard` (`home`). | OK |
| CU-002 Login invalido | CU-002-P01 | Login | Ingresar correo o contrasena invalidos y tocar `Ingresar`. | Se mantiene en `login` y se muestra mensaje `Error:`. | OK |
| CU-003 Header avatar | CU-003-P01 | Header global / Menu avatar | En cualquier pantalla autenticada, abrir el menu del avatar. | Se muestran opciones de usuario (Dashboard, Perfil, Cerrar sesion). | OK |
| CU-003 Header avatar | CU-003-P02 | Header global / Menu avatar | Tocar `Dashboard`. | Navega a `home`. | OK |
| CU-003 Header avatar | CU-003-P03 | Header global / Menu avatar | Tocar `Perfil`. | Navega a `profile`. | OK |
| CU-003 Header avatar | CU-003-P04 | Header global / Menu avatar | Tocar `Cerrar sesion`. | Cierra sesion, muestra `Sesion cerrada` y regresa a `login`. | OK |
| CU-004 Dashboard hero | CU-004-P01 | Inicio / Dashboard | Abrir `Inicio / Dashboard`. | Se muestra hero superior con boton `Ir a proyectos`. | OK |
| CU-004 Dashboard hero | CU-004-P02 | Inicio / Dashboard | Tocar `Ir a proyectos`. | Navega a `Inicio / Proyectos` (`projects`). | OK |
| CU-005 Dashboard listas | CU-005-P01 | Inicio / Dashboard | En `Cola de trabajo`, tocar un cambio. | Navega a `change_detail/{changeId}`. | OK |
| CU-005 Dashboard listas | CU-005-P02 | Inicio / Dashboard | En `Ultimas notas donde te mencionan`, tocar una nota con cambio asociado. | Navega al detalle del cambio relacionado. | OK |
| CU-006 Proyectos busqueda/filtro | CU-006-P01 | Inicio / Proyectos | En `Inicio / Proyectos`, escribir en `Buscar proyecto...`. | La lista se filtra en vivo por nombre. | OK |
| CU-006 Proyectos busqueda/filtro | CU-006-P02 | Inicio / Proyectos | Abrir dropdown y cambiar entre `Todos`, `Activos`, `Inactivos`. | Se actualizan contador y lista segun filtro seleccionado. | OK |
| CU-007 Card de proyecto UI | CU-007-P01 | Inicio / Proyectos | Revisar cualquier card de proyecto. | Arriba a la derecha aparece `Creado:` y la fecha en badge, en una sola linea. | OK |
| CU-007 Card de proyecto UI | CU-007-P02 | Inicio / Proyectos | Revisar bloque `CAMBIOS` del card. | Se ve fieldset con borde y etiqueta `CAMBIOS` sobre la linea. | OK |
| CU-007 Card de proyecto UI | CU-007-P03 | Inicio / Proyectos | Si el proyecto tiene mas de 4 cambios, tocar `Ver los N restantes...`. | Navega al detalle del proyecto. | OK |
| CU-008 Navegacion desde proyectos | CU-008-P01 | Inicio / Proyectos | Tocar el cuerpo de un card de proyecto. | Navega a `project_detail/{projectId}`. | OK |
| CU-008 Navegacion desde proyectos | CU-008-P02 | Inicio / Proyectos | Tocar un item de cambio dentro del fieldset. | Navega a `change_detail/{changeId}`. | OK |
| CU-009 Crear proyecto | CU-009-P01 | Inicio / Proyectos | En `Inicio / Proyectos`, tocar `Nuevo Proyecto` en header. | Navega a `project_create`. | OK |
| CU-009 Crear proyecto | CU-009-P02 | Inicio / Proyectos / Nuevo | Completar al menos `Nombre` y guardar. | Crea proyecto y navega a `project_detail/{nuevoId}`. | Mejora (IMP-001) |
| CU-010 Editar proyecto | CU-010-P01 | Inicio / Proyectos / Detalle / Editar | En `Detalle de proyecto`, tocar `Editar`. | Navega a `project_edit/{projectId}` con datos precargados. | OK |
| CU-010 Editar proyecto | CU-010-P02 | Inicio / Proyectos / Detalle / Editar | Cambiar datos y guardar cambios. | Actualiza proyecto y vuelve a la pantalla anterior con datos actualizados. | OK |
| CU-011 Ver cambios de proyecto | CU-011-P01 | Inicio / Proyectos / Detalle | En `Detalle de proyecto`, tocar `Ver cambios`. | Navega a `project_changes/{projectId}`. | OK |
| CU-011 Ver cambios de proyecto | CU-011-P02 | Inicio / Proyectos / Detalle / Cambios | Si no hay cambios, usar accion de crear. | Navega a `change_create/{projectId}`. | OK |
| CU-012 Crear cambio validacion | CU-012-P01 | Inicio / Proyectos / Detalle / Cambios / Nuevo | Entrar a `Nuevo cambio` y dejar vacios campos requeridos. | El submit no procede. | OK |
| CU-012 Crear cambio validacion | CU-012-P02 | Inicio / Proyectos / Detalle / Cambios / Nuevo | Intentar guardar desde header. | Muestra aviso para completar `Nombre`, `Asignados`, `Workfront`, `OneDrive` y al menos un ambiente visible. | OK |
| CU-013 Crear cambio exitoso | CU-013-P01 | Inicio / Proyectos / Detalle / Cambios / Nuevo | Completar requeridos en `Nuevo cambio` (Nombre, Asignados, Workfront, OneDrive, visibilidad). | El boton/accion de guardar queda habilitado. | OK |
| CU-013 Crear cambio exitoso | CU-013-P02 | Inicio / Proyectos / Detalle / Cambios / Nuevo | Guardar cambio. | Crea el cambio y regresa a `project_changes/{projectId}` con el nuevo item visible. | Pendiente verificacion (PV-001) |
| CU-013 Crear cambio exitoso | CU-013-P03 | Inicio / Proyectos / Detalle / Cambios / Nuevo | Abrir dropdown de estado en formulario de cambio. | Aparecen: `Pendiente`, `En desarrollo`, `En revision de QA`, `Completado (QA aprobado)`. | OK |
| CU-014 Editar cambio | CU-014-P01 | Inicio / Proyectos / Detalle / Cambios / Detalle | En `Detalle de cambio`, tocar `Editar`. | Navega a `change_edit/{changeId}` con datos precargados. | OK |
| CU-014 Editar cambio | CU-014-P02 | Inicio / Proyectos / Detalle / Cambios / Editar | Cambiar estado/prioridad/campos y guardar. | Regresa a `project_changes/{projectId}` con datos actualizados. | Pendiente re-test (ERR-001) |
| CU-015 Eliminar cambio | CU-015-P01 | Inicio / Proyectos / Detalle / Cambios / Detalle | En `Detalle de cambio`, usar accion `Eliminar` del header. | Se elimina logicamente y navega a `project_changes/{projectId}`. | OK |
| CU-015 Eliminar cambio | CU-015-P02 | Inicio / Proyectos / Detalle / Cambios | Buscar el cambio eliminado en la lista. | Ya no aparece en el listado visible. | Pendiente re-test (ERR-003) |
| CU-016 Detalle cambio links | CU-016-P01 | Inicio / Proyectos / Detalle / Cambios / Detalle | Abrir `Detalle de cambio`. | Se muestran `Workfront` y `OneDrive` del cambio. | OK |
| CU-016 Detalle cambio links | CU-016-P02 | Inicio / Proyectos / Detalle / Cambios / Detalle | Revisar seccion de ambientes visibles (QA/STG/PROD). | Solo se muestran ambientes habilitados; cada uno lista URLs o mensaje de vacio. | OK |
| CU-017 TO-DO crear nota | CU-017-P01 | Inicio / Proyectos / Detalle / Cambios / Detalle / TO-DO | En `Notas TO-DO relacionadas`, escribir texto y tocar `Agregar`. | Se crea la nota, aumenta contador y aparece en lista con estado inicial. | OK |
| CU-017 TO-DO crear nota | CU-017-P02 | Inicio / Proyectos / Detalle / Cambios / Detalle / TO-DO | Escribir `@` en la nota y seleccionar sugerencia. | Se insertan menciones y se detectan asignados para la nota. | OK |
| CU-018 TO-DO editar y estado | CU-018-P01 | Inicio / Proyectos / Detalle / Cambios / Detalle / TO-DO | En una nota, tocar `Editar`, modificar texto y `Guardar`. | Se actualiza texto de la nota en la lista. | Pendiente re-test (ERR-005) |
| CU-018 TO-DO editar y estado | CU-018-P02 | Inicio / Proyectos / Detalle / Cambios / Detalle / TO-DO | Tocar `Completar` y luego `Reabrir`. | El estado cambia entre `Completado` y `Pendiente`. | Pendiente re-test (ERR-004) |
| CU-019 Perfil | CU-019-P01 | Inicio / Perfil | Ir a `Perfil` desde menu de avatar. | Se muestran datos de cuenta y contadores de proyectos/cambios. | OK |
| CU-019 Perfil | CU-019-P02 | Inicio / Perfil | Cambiar `Nombre visible` y guardar. | Muestra mensaje de exito y actualiza nombre en perfil. | OK |
| CU-021 Consistencia visual global | CU-021-P01 | Global (Dashboard, Proyectos y Editores) | Revisar header global en varias pantallas. | Se percibe sombra inferior fina y consistente. | OK |
| CU-021 Consistencia visual global | CU-021-P02 | Global (Dashboard, Proyectos y Editores) | Revisar hero cards de Dashboard/Proyectos/editores. | Bordes superiores rectos y bordes inferiores redondeados. | OK |
| CU-021 Consistencia visual global | CU-021-P03 | Global (Dashboard, Proyectos y Editores) | Revisar boton `Ir a proyectos` del hero Dashboard. | El icono tiene separacion visible respecto al texto. | OK |
