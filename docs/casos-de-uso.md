# Casos de uso

Notación: **CU-nn**. Actores alineados a roles Spatie y a la UI (`es_tecnico`).

Leyenda de inclusión: **Implementado** según controladores y páginas actuales.

---

## Diagrama de actores y casos (resumen)

```
[Visitante] -- CU-01 Consultar recetas
            -- CU-02 Registrarse
            -- CU-03 Iniciar sesión

[Usuario]   -- CU-04 Cerrar sesión / ver perfil
            -- CU-05 Editar perfil y contraseña
            -- CU-06 Crear incidente
            -- CU-07 Consultar mis incidentes
            -- CU-08 Recibir notificación de derivación
            -- CU-09 Votar receta

[Técnico]   -- (todos los de Usuario salvo el alcance de listado)
            -- CU-10 Listar y filtrar todos los incidentes
            -- CU-11 Tomar / asignar incidente
            -- CU-12 Resolver incidente
            -- CU-13 Derivar incidente
            -- CU-14 Ver alertas críticas
            -- CU-15 Exportar CSV
            -- CU-16 ABM recetas
            -- CU-17 ABM categorías
            -- CU-18 Listar usuarios
            -- CU-19 Gestionar categoría en página detalle

[Sistema]   -- CU-20 Generar alertas RN-004 (comando)
```

---

## CU-01 Consultar la base de conocimientos (público)

| Campo | Detalle |
|---|---|
| **Actor primario** | Visitante |
| **Precondición** | Ninguna |
| **Flujo principal** | 1. Entra a `/`. 2. El sistema carga `GET /api/recetas` y `GET /api/categorias`. 3. Filtra por texto y/o categoría. 4. Abre `/recetas/{id}`. |
| **Postcondición** | Visualiza solución (HTML) y metadatos de categoría/usos/votos. |
| **RF** | RF-005, RF-006 |

---

## CU-02 Registrarse

| Campo | Detalle |
|---|---|
| **Actor** | Visitante |
| **Precondición** | Correo no registrado |
| **Flujo** | Completa `/registro` → `POST /api/register` → guarda token → redirige a `/usuario`. |
| **Alternativo** | Correo duplicado o contraseña débil → 422. Rate limit 10/min. |
| **RF** | RF-001 |

---

## CU-03 Iniciar sesión

| Campo | Detalle |
|---|---|
| **Actor** | Usuario o técnico |
| **Flujo** | `/login` → `POST /api/login` → token en `localStorage` → `/tecnico` si `es_tecnico`, si no `/usuario`. |
| **Alternativo** | Credenciales incorrectas. Rate limit 15/min. |
| **RF** | RF-002, RF-020 |

---

## CU-04 Cerrar sesión

| Campo | Detalle |
|---|---|
| **Actor** | Autenticado |
| **Flujo** | Logout en UI → `POST /api/logout` → limpia token → portal `/`. |
| **RF** | RF-003 |

---

## CU-05 Administrar perfil

| Campo | Detalle |
|---|---|
| **Actor** | Autenticado |
| **Flujo** | `/perfil` → ver datos → actualizar nombre/correo/interno; subir/quitar foto; cambiar contraseña con confirmación. |
| **Excepciones** | Foto > 2 MB o tipo inválido; contraseña actual incorrecta. |
| **RF** | RF-004 |

---

## CU-06 Crear un incidente (usuario)

| Campo | Detalle |
|---|---|
| **Actor** | Usuario `default` (o cualquier rol con `incidentes.crear`) |
| **Precondición** | Autenticado; menos de 3 incidentes ABIERTO |
| **Flujo** | Dashboard usuario → formulario → categoría + descripción (≥ 5) + interno opcional → `POST /api/incidentes`. |
| **Excepción RN-005** | 422: “no se permiten más de 3 incidentes en estado ABIERTO”. |
| **Postcondición** | Incidente ABIERTO, prioridad MEDIA, asociado al usuario. |
| **RF** | RF-007 |

---

## CU-07 Consultar y seguir mis incidentes

| Campo | Detalle |
|---|---|
| **Actor** | Usuario |
| **Flujo** | `GET /api/incidentes` filtra por `id_usuario` en servidor. Ve estado, prioridad, categoría. |
| **RF** | RF-009 |

---

## CU-08 Recibir aviso de derivación

| Campo | Detalle |
|---|---|
| **Actor** | Usuario dueño del incidente |
| **Disparador** | CU-13 |
| **Flujo** | Laravel guarda `IncidenteDerivadoNotification`. El usuario ve la campana → `GET /api/notificaciones` → marca leída. |
| **RF** | RF-012, RF-015 |

---

## CU-09 Valorar una receta

| Campo | Detalle |
|---|---|
| **Actor** | Autenticado |
| **Flujo** | En listado o detalle, vota UTIL o NO_UTIL → `POST /api/recetas/{id}/votar`. Puede cambiar el voto (updateOrCreate). |
| **Excepción** | Sin token → 401. |
| **RF** | RF-017 |

---

## CU-10 Supervisar la cola de incidentes (técnico)

| Campo | Detalle |
|---|---|
| **Actor** | Técnico |
| **Precondición** | `es_tecnico` y permiso `incidentes.ver` |
| **Flujo** | `/tecnico` pestaña Incidentes. Filtros estado/prioridad/categoría. Indicadores: total, abiertos, en curso, alta, resueltos. |
| **RF** | RF-009 |

---

## CU-11 Tomar un incidente

| Campo | Detalle |
|---|---|
| **Actor** | Técnico |
| **Flujo** | En dashboard, asigna `id_tecnico` al usuario actual vía `PUT /api/incidentes/{id}`. Necesario antes de CU-12. |
| **RF** | RF-011 |

---

## CU-12 Resolver un incidente

| Campo | Detalle |
|---|---|
| **Actor** | Técnico asignado |
| **Precondición** | `id_tecnico` = técnico logueado |
| **Flujo principal** | `/tecnico/incidentes/{id}/resolver` → elige receta existente **o** escribe solución (y opcionalmente título de receta) → estado RESUELTO. |
| **Flujo receta nueva** | El sistema crea `Receta` en la categoría del ticket y asocia `id_receta`. |
| **Flujo receta existente** | Incrementa `usos`. |
| **Excepción RN-002** | 422 si no hay receta ni texto. |
| **Excepción no asignado** | 403 “Debes tomar el incidente antes de poder resolverlo.” |
| **RF** | RF-011 |

---

## CU-13 Derivar un incidente

| Campo | Detalle |
|---|---|
| **Actor** | Técnico |
| **Precondición** | Permiso `incidentes.derivar` |
| **Flujo** | Modal: motivo (≥ 5), técnico destino opcional, unidad opcional → `PUT /api/incidentes/{id}/derivar` → estado EN_CURSO → notificación al usuario. |
| **RF** | RF-012 |

---

## CU-14 Consultar incidentes críticos

| Campo | Detalle |
|---|---|
| **Actor** | Técnico |
| **Flujo** | Banner y pestaña Alertas → `GET /api/alertas/criticas`. No técnico → 403. |
| **RF** | RF-014 |

---

## CU-15 Exportar historial a CSV

| Campo | Detalle |
|---|---|
| **Actor** | Técnico |
| **Flujo** | Botón exportar → blob CSV → descarga `reporte_incidentes_YYYY-MM-DD.csv`. |
| **RF** | RF-013 |

---

## CU-16 Mantener recetas

| Campo | Detalle |
|---|---|
| **Actor** | Técnico (policy exige rol `tecnico`) |
| **Flujo** | Crear/editar/borrar desde el panel o detalle. Validación título, solución ≥ 10, categoría existente. |
| **RF** | RF-016 |

---

## CU-17 Mantener categorías

| Campo | Detalle |
|---|---|
| **Actor** | Usuario con `categorias.crear/editar/eliminar` |
| **Flujo** | ABM nombre único e icono. Baja rechazada si hay recetas o incidentes. |
| **RF** | RF-018 |

---

## CU-18 Consultar directorio de usuarios

| Campo | Detalle |
|---|---|
| **Actor** | Técnico |
| **Flujo** | Pestaña Usuarios → `GET /api/users`. |
| **RF** | RF-019 |

---

## CU-19 Gestionar una categoría (página dedicada)

| Campo | Detalle |
|---|---|
| **Actor** | Técnico |
| **Flujo** | Navega a `/categorias/{id}` (guard `TecnicoRoute`). Ve recetas de esa categoría y puede administrarla. |
| **RF** | RF-018, RF-006 |

---

## CU-20 Generar alertas programadas (sistema)

| Campo | Detalle |
|---|---|
| **Actor** | Sistema (operador / cron) |
| **Flujo** | `php artisan incidentes:revisar-alertas --horas=2`. Para cada incidente ALTA no resuelto más viejo que el umbral, notifica a **todos** los usuarios con rol `tecnico`. |
| **Postcondición** | Notificaciones en tabla `notifications`. |
| **RF** | RF-014 |

---

## Matriz caso de uso × actor

| CU | Visitante | Usuario | Técnico | Sistema |
|---|---|---|---|---|
| CU-01 | X | X | X | |
| CU-02 | X | | | |
| CU-03 | X | | | |
| CU-04–CU-09 | | X | X | |
| CU-10–CU-19 | | | X | |
| CU-08 (destino) | | X | | |
| CU-20 | | | | X |

---

## Casos de uso no implementados (modelo o plan)

| ID tentativo | Descripción | Estado |
|---|---|---|
| CU-C1 | Registrar una “consulta” previa al incidente (`consultas`) | Tabla y modelo; sin rutas |
| CU-C2 | Gestionar bocetos / procedimientos en borrador (`bocetos`) | Solo seeder |
| CU-C3 | Flujos específicos de `representante_de_area` en UI | Permisos en seeder; UI no distingue el rol |
| CU-C4 | App móvil Capacitor | Planificado, no en el repo |
