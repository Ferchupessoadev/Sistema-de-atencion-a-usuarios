# Especificación final — Sistema de Mesa de Ayuda CTM

**Versión:** 1.0  
**Fecha:** 27 de agosto de 2026  
**Fuente:** código fuente del repositorio `sistema-de-usuarios` (backend Laravel + frontend React)

---

## 1. Visión del producto

El sistema es una **mesa de ayuda institucional** para CTM (área AICO / Atención a Usuarios). Permite:

1. Que cualquier persona consulte la **base de conocimientos** (recetas de solución) sin autenticarse.
2. Que usuarios internos **registren incidentes** de soporte (hardware, redes, telefonía, K2B, accesos, etc.).
3. Que técnicos **tomen, deriven, resuelvan y auditen** incidentes, y mantengan categorías y recetas.
4. Que el sistema **alerte** cuando un incidente de prioridad ALTA lleva más de 2 horas sin resolverse.

El interno telefónico de Atención a Usuarios de referencia en los datos de ejemplo es **3777**.

---

## 2. Alcance

### Incluido (implementado)

- Registro e inicio de sesión con token Sanctum (sesión única: el login revoca tokens previos).
- Perfil: nombre, correo, interno, foto y cambio de contraseña.
- Portal público de recetas con búsqueda y filtro por categoría.
- CRUD de incidentes con visibilidad por rol, filtros, paginación y exportación CSV.
- Derivación de incidentes con notificación al usuario afectado.
- CRUD de categorías (técnicos) y recetas (técnicos); voto UTIL / NO_UTIL (usuarios autenticados).
- Alertas de incidentes críticos (consulta en tiempo real + comando Artisan).
- Autorización con Spatie Permission (roles y permisos).
- Sanitización de HTML en descripciones/soluciones y protección CSV contra inyección de fórmulas.

### Fuera de alcance o solo modelo (no hay API de negocio)

- Tabla `consultas` y modelo asociado: existen en base de datos; no hay endpoints ni UI de consultas.
- Tabla `bocetos`: existe como borradores de procedimientos; no hay API ni pantallas.
- Compilación móvil con Capacitor: prevista en el plan, no implementada en este repositorio.
- Rol `representante_de_area`: definido en el seeder; la UI trata al usuario principalmente como técnico (`es_tecnico`) o usuario común.
- Rol `administrador` referenciado en policies: el seeder crea el rol **`admin`**, no `administrador`.

---

## 3. Actores

| Actor | Identificación en código | Descripción |
|---|---|---|
| Visitante | No autenticado | Consulta el portal y la base de conocimientos. |
| Usuario (default) | Rol Spatie `default` | Empleado que abre y sigue sus incidentes. |
| Técnico | Rol Spatie `tecnico`; flag API `es_tecnico` | Soporte AICO: ve todos los tickets, resuelve, deriva, exporta, gestiona recetas y categorías. |
| Representante de área | Rol Spatie `representante_de_area` | Permisos de recetas/categorías e incidentes sin derivar ni exportar; UI de técnico no se activa (`es_tecnico` es falso). |
| Administrador | Rol Spatie `admin` (seeder) | Mismos permisos que técnico a nivel seeder. |

Los usuarios nuevos por `POST /api/register` reciben el rol `default`.

---

## 4. Reglas de negocio (RN)

| ID | Regla | Implementación |
|---|---|---|
| **RN-001** | Si el creador es técnico, categoría y prioridad son obligatorias. | `StoreIncidenteRequest`: `id_categoria` siempre requerido; `prioridad` requerida si `hasRole('tecnico')`. Usuario común: prioridad opcional, default MEDIA. |
| **RN-002** | Para pasar a RESUELTO hace falta receta o texto de solución. | `IncidenteController::update`. Si hay texto y no receta, se crea una receta nueva y se incrementa `usos`. Si se asocia receta existente, se incrementa `usos`. El técnico debe estar asignado al incidente (`id_tecnico`) para resolverlo. |
| **RN-003** | Al derivar, se notifica al usuario del incidente. | `IncidenteController::derivar` + `IncidenteDerivadoNotification`. El estado pasa a EN_CURSO. Motivo obligatorio (mín. 5 caracteres). |
| **RN-004** | Incidente ALTA no resuelto con más de 2 h es crítico. | `GET /api/alertas/criticas` (solo técnico) y comando `php artisan incidentes:revisar-alertas --horas=2`, que notifica a todos los técnicos. |
| **RN-005** | Máximo 3 incidentes en estado ABIERTO por usuario. | `StoreIncidenteRequest::after` + `User::contarIncidentesAbiertos()`. |

Reglas adicionales observadas en código:

- Usuario común solo puede editar la **descripción** de un incidente propio y únicamente si está **ABIERTO**.
- No se puede eliminar una categoría con incidentes o recetas asociadas.
- Un usuario tiene **un voto** por receta (`unique` en `votos_recetas`).

---

## 5. Flujos principales

```
Visitante → Portal (/) → busca receta → detalle /recetas/:id
                ↓ (login)
Usuario  → /usuario → crea incidente (RN-005) → espera atención
                ↓
Técnico  → /tecnico → toma ticket → resuelve (RN-002) o deriva (RN-003)
                ↓
Sistema  → alerta si ALTA > 2h (RN-004)
```

---

## 6. Criterios de aceptación globales

- Sin token, las rutas protegidas responden 401.
- Login y registro están limitados por rate limiting (brute force).
- El frontend redirige a `/tecnico` si `es_tecnico`, si no a `/usuario`.
- Las recetas públicas no exponen operaciones de escritura.
- La exportación CSV es exclusiva de técnicos (policy `incidentes.exportar`).

---

## 7. Documentos relacionados

- [Documentación del proyecto](documentacion-proyecto.md)
- [Requisitos funcionales](requisitos-funcionales.md)
- [Casos de uso](casos-de-uso.md)
