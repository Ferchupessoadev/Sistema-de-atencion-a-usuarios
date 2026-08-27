# Requisitos funcionales (RF)

Documento derivado del código en `backend/` y `frontend/`.  
Prioridad: **Alta** = flujo principal o regla de negocio (RN); **Media** = operación de soporte; **Baja** = mejora o dato auxiliar.

---

## RF-001 — Registro de usuario

| | |
|---|---|
| **Prioridad** | Alta |
| **Actor** | Visitante |
| **Descripción** | El sistema permite crear una cuenta con nombre, correo único y contraseña. |
| **Entrada** | `nombre`, `correo`, `contrasena` |
| **Reglas** | Correo normalizado a minúsculas. Contraseña ≥ 8 caracteres con letras y números. Correo único en `users`. |
| **Salida** | HTTP 201, token Sanctum, usuario con rol `default`, `es_tecnico: false`. |
| **API** | `POST /api/register` |
| **UI** | `/registro` |

---

## RF-002 — Inicio de sesión

| | |
|---|---|
| **Prioridad** | Alta |
| **Actor** | Usuario registrado |
| **Descripción** | Autenticación por correo y contraseña. |
| **Reglas** | Credenciales inválidas → error de validación en `correo`. Éxito → se revocan tokens anteriores (una sesión activa). |
| **Salida** | Token Bearer, `es_tecnico`, `es_representante_de_area`. |
| **API** | `POST /api/login` |
| **UI** | `/login` → redirección `/tecnico` o `/usuario` |

---

## RF-003 — Cierre de sesión y sesión autenticada

| | |
|---|---|
| **Prioridad** | Alta |
| **Descripción** | Revocar el token actual. Consultar el usuario autenticado. |
| **API** | `POST /api/logout`, `GET /api/user` |
| **UI** | Botón salir en dashboards; `AuthContext` |

---

## RF-004 — Gestión de perfil

| | |
|---|---|
| **Prioridad** | Media |
| **Actor** | Usuario autenticado |
| **Descripción** | Ver y actualizar nombre, correo e interno; subir o eliminar foto (≤ 2 MB, jpeg/png/jpg/webp); cambiar contraseña validando la actual. |
| **API** | `GET/PUT /api/profile`, `POST/DELETE /api/profile/foto`, `PUT /api/profile/password` |
| **UI** | `/perfil` |

---

## RF-005 — Consulta pública de la base de conocimientos

| | |
|---|---|
| **Prioridad** | Alta |
| **Actor** | Visitante o autenticado |
| **Descripción** | Listar recetas ordenadas por usos y votos útiles. Filtrar por texto (`q` en título, solución, keywords) y por categoría. Ver detalle. |
| **API** | `GET /api/recetas`, `GET /api/recetas/{id}` |
| **UI** | `/`, `/recetas/:id` |

---

## RF-006 — Consulta pública de categorías

| | |
|---|---|
| **Prioridad** | Alta |
| **Descripción** | Listar categorías con icono, conteo de recetas e incidentes, y títulos de recetas asociadas. |
| **API** | `GET /api/categorias`, `GET /api/categorias/{id}` |

---

## RF-007 — Alta de incidente (usuario)

| | |
|---|---|
| **Prioridad** | Alta |
| **Actor** | Usuario autenticado con `incidentes.crear` |
| **Descripción** | Registrar un problema con descripción (HTML, mín. 5 caracteres), categoría e interno opcional. |
| **Reglas** | **RN-005:** si el usuario tiene ≥ 3 incidentes ABIERTO, se rechaza. Prioridad default MEDIA si no se envía. Estado inicial ABIERTO. `id_usuario` = usuario autenticado. |
| **API** | `POST /api/incidentes` |
| **UI** | Dashboard usuario — modal “Tengo un problema” |

---

## RF-008 — Alta de incidente (técnico)

| | |
|---|---|
| **Prioridad** | Alta |
| **Actor** | Técnico |
| **Descripción** | Igual que RF-007, con **RN-001:** prioridad obligatoria. Puede indicar `id_tecnico` en la creación. |
| **API** | `POST /api/incidentes` |

---

## RF-009 — Listado y detalle de incidentes

| | |
|---|---|
| **Prioridad** | Alta |
| **Descripción** | El usuario ve solo sus incidentes. El técnico ve todos, con filtros: `estado`, `prioridad`, `id_categoria`, `id_usuario`, `id_tecnico`. Paginación de 10. Detalle con relaciones usuario, técnico, categoría, receta. |
| **API** | `GET /api/incidentes`, `GET /api/incidentes/{id}` |
| **UI** | Dashboards técnico y usuario |

---

## RF-010 — Actualización de incidente por usuario

| | |
|---|---|
| **Prioridad** | Media |
| **Reglas** | Solo descripción; solo si el incidente está ABIERTO y es propio. Policy `incidentes.actualizar` (el rol `default` **no** tiene este permiso en el seeder: la actualización de usuario puede fallar 403 salvo que se asigne el permiso). |
| **API** | `PUT /api/incidentes/{id}` |

---

## RF-011 — Atención y resolución de incidente (técnico)

| | |
|---|---|
| **Prioridad** | Alta |
| **Descripción** | El técnico actualiza estado, prioridad, categoría, técnico asignado y descripción. |
| **Reglas** | **RN-002:** estado RESUELTO exige `id_receta` (existente o ya asociada) o `solucion_texto` (mín. 5). Si hay texto y no receta, se crea receta (título opcional `titulo_receta`) en la misma categoría y `usos = 1`. Si hay receta distinta a la actual, se incrementa `usos`. Se guarda `resolucion = now()`. **No se puede resolver** si `id_tecnico` no es el técnico autenticado (debe “tomar” el ticket antes). |
| **API** | `PUT /api/incidentes/{id}` |
| **UI** | `/tecnico/incidentes/:id/resolver`; acciones rápidas en dashboard |

---

## RF-012 — Derivación de incidente

| | |
|---|---|
| **Prioridad** | Alta |
| **Actor** | Técnico con `incidentes.derivar` |
| **Descripción** | Reasignar a otro técnico y/o indicar unidad especializada. |
| **Reglas** | **RN-003:** `motivo` obligatorio. Estado → EN_CURSO. Notificación en BD al usuario dueño. |
| **API** | `PUT /api/incidentes/{id}/derivar` body: `id_tecnico`, `unidad_especializada`, `motivo` |
| **UI** | Modal derivar en dashboard técnico |

---

## RF-013 — Exportación de reporte de incidentes

| | |
|---|---|
| **Prioridad** | Media |
| **Actor** | Técnico / admin (policy) |
| **Descripción** | Descargar CSV de todos los incidentes: ID, fechas, estado, prioridad, categoría, usuario, interno, técnico, descripción, resolución, tiempo de atención en horas, receta. |
| **API** | `GET /api/reportes/incidentes/exportar` |
| **UI** | Botón exportar en dashboard técnico |

---

## RF-014 — Alertas de incidentes críticos

| | |
|---|---|
| **Prioridad** | Alta |
| **Actor** | Técnico |
| **Descripción** | Listar incidentes prioridad ALTA, no RESUELTO, con `created_at` ≤ ahora − 2 horas. |
| **Reglas** | **RN-004.** Comando Artisan envía notificación a todos los técnicos. |
| **API** | `GET /api/alertas/criticas` |
| **UI** | Pestaña “Incidentes críticos” |

---

## RF-015 — Notificaciones in-app

| | |
|---|---|
| **Prioridad** | Media |
| **Actor** | Usuario autenticado |
| **Descripción** | Listar últimas 20 notificaciones, contar no leídas, marcar una o todas como leídas. |
| **API** | `GET /api/notificaciones`, `PUT /api/notificaciones/{id}/leer`, `POST /api/notificaciones/marcar-todas` |
| **UI** | `NotificationBell` |

---

## RF-016 — ABM de recetas (técnico)

| | |
|---|---|
| **Prioridad** | Alta |
| **Descripción** | Crear, editar y eliminar recetas (título, solución ≥ 10, keywords, categoría). HTML sanitizado. |
| **API** | `POST/PUT/DELETE /api/recetas` |
| **UI** | `RecetasManager`, detalle de receta |

---

## RF-017 — Valoración de recetas

| | |
|---|---|
| **Prioridad** | Media |
| **Actor** | Usuario autenticado |
| **Descripción** | Votar UTIL o NO_UTIL. Un voto por usuario y receta (se actualiza si cambia). La lista pública incluye `mi_voto` si hay token Sanctum. |
| **API** | `POST /api/recetas/{id}/votar` |

---

## RF-018 — ABM de categorías (técnico / permisos)

| | |
|---|---|
| **Prioridad** | Media |
| **Descripción** | Crear/editar nombre único e icono. Eliminar solo si no hay incidentes ni recetas. |
| **API** | `POST/PUT/DELETE /api/categorias` |
| **UI** | `CategoriasManager`, `/categorias/:id` |

---

## RF-019 — Listado de usuarios institucionales

| | |
|---|---|
| **Prioridad** | Media |
| **Actor** | Técnico |
| **Descripción** | Ver id, nombre, correo, interno, foto, roles y fecha de alta. |
| **API** | `GET /api/users` |
| **UI** | Pestaña Usuarios del dashboard técnico |

---

## RF-020 — Protección de rutas en el cliente

| | |
|---|---|
| **Prioridad** | Alta |
| **Descripción** | Rutas de técnico inaccesibles si `es_tecnico` es falso (redirect a `/usuario`). Rutas de usuario/perfil requieren autenticación (redirect a `/login`). Login/registro redirigen si ya hay sesión. |

---

## Requisitos no funcionales relevantes (del código)

| ID | Requisito |
|---|---|
| RNF-001 | Rate limiting anti fuerza bruta en login/registro. |
| RNF-002 | Respuestas API JSON; excepciones JSON en rutas `/api/*`. |
| RNF-003 | Sanitización XSS en campos de texto enriquecido. |
| RNF-004 | Export CSV resistente a formula injection. |
| RNF-005 | Proxy de desarrollo Vite hacia Laravel. |
| RNF-006 | Pruebas automatizadas PHPUnit de autenticación, incidentes, recetas, alertas y seguridad. |

---

## Trazabilidad RN → RF

| Regla | RF |
|---|---|
| RN-001 | RF-008 |
| RN-002 | RF-011 |
| RN-003 | RF-012 |
| RN-004 | RF-014 |
| RN-005 | RF-007 |
