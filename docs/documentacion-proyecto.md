# Documentación del proyecto

**Sistema:** Mesa de Ayuda CTM — Atención a Usuarios  
**Repositorio:** `sistema-de-usuarios`

---

## 1. Propósito

Aplicación web cliente-servidor para gestionar incidentes de TI, publicar una base de conocimientos (recetas) y notificar a usuarios y técnicos según reglas de negocio institucionales.

---

## 2. Arquitectura

```
┌─────────────────────┐         HTTP / JSON          ┌──────────────────────────┐
│  Frontend React     │  /api  (Vite proxy :5173     │  Backend Laravel         │
│  Vite :5173         │  → localhost:8000)           │  API REST :8000          │
│  AuthContext        │─────────────────────────────▶│  Sanctum + Spatie        │
│  Axios              │     Bearer token             │  Eloquent + SQLite/PG    │
└─────────────────────┘                              └──────────────────────────┘
```

- **Estilo:** SPA + API REST. El frontend no comparte sesión cookie con Laravel; usa token Bearer en `Authorization` y lo persiste en `localStorage` (`auth_token`).
- **Proxy de desarrollo:** `frontend/vite.config.js` reenvía `/api` a `http://localhost:8000`.
- **Health check Laravel:** `GET /up`.

---

## 3. Stack tecnológico

| Capa | Tecnología | Notas |
|---|---|---|
| Backend | PHP ^8.3, Laravel ^13 | `backend/composer.json` |
| Auth API | Laravel Sanctum ^4.3 | Tokens personales |
| Autorización | spatie/laravel-permission 8.3 | Roles y permisos `web` |
| Media | spatie/laravel-medialibrary | Avatares (colección `avatars`) |
| Frontend | React 18, Vite 5, React Router 6 | |
| HTTP cliente | Axios | Base URL `/api` |
| Editor rico | TipTap | Descripciones y soluciones |
| HTML seguro (UI) | DOMPurify | Visualización |
| BD desarrollo | SQLite (típico en `.env`) | Plan: PostgreSQL en producción |
| Tests | PHPUnit 12 | `backend/tests/Feature/` |

---

## 4. Estructura del repositorio

```
sistema-de-usuarios/
├── backend/                 API Laravel
│   ├── app/Http/Controllers/Api/
│   ├── app/Http/Requests/
│   ├── app/Models/
│   ├── app/Policies/
│   ├── app/Notifications/
│   ├── app/Console/Commands/RevisarAlertasIncidentes.php
│   ├── database/migrations/
│   ├── database/seeders/
│   └── routes/api.php
├── frontend/                SPA React
│   └── src/pages, components, context, services
├── docs/                    Esta documentación
└── implementation_plan.md   Plan original por fases
```

---

## 5. Modelo de datos

### 5.1 Diagrama de relaciones (implementado)

```
users 1──* incidentes (id_usuario)
users 1──* incidentes (id_tecnico, nullable)
categorias 1──* incidentes
categorias 1──* recetas
recetas 1──* incidentes (id_receta, nullable)
users 1──* votos_recetas *──1 recetas
users 1──* consultas          (sin API)
bocetos                       (sin API)
notifications                 (Laravel database notifications)
media                         (Spatie MediaLibrary)
roles / permissions           (Spatie)
personal_access_tokens        (Sanctum)
```

### 5.2 Entidades principales

**users**

| Campo | Tipo | Descripción |
|---|---|---|
| id | PK | |
| nombre | string | |
| correo | string unique | Login |
| contrasena | string | bcrypt; campo auth custom |
| interno | string(20) nullable | Teléfono interno |
| foto | string nullable | URL o path; URL canónica vía `foto_url` |
| es_tecnico | boolean | Legacy; el rol real es Spatie `tecnico` |
| timestamps | | |

**incidentes**

| Campo | Tipo | Descripción |
|---|---|---|
| descripcion | text | HTML sanitizado |
| estado | enum | ABIERTO, EN_CURSO, RESUELTO (default ABIERTO) |
| prioridad | enum | BAJA, MEDIA, ALTA (default MEDIA) |
| solucion | longText nullable | Texto al resolver |
| resolucion | datetime nullable | Momento de cierre |
| interno | string(20) nullable | Interno de contacto del ticket |
| id_usuario | FK users | Creador (restrict on delete) |
| id_consulta | FK consultas nullable | Reservado |
| id_tecnico | FK users nullable | Asignado (null on delete) |
| id_categoria | FK categorias | Restrict on delete |
| id_receta | FK recetas nullable | Receta aplicada |

**recetas**

| Campo | Tipo | Descripción |
|---|---|---|
| titulo | string | |
| solucion | text | HTML sanitizado |
| keywords | text nullable | Búsqueda |
| id_categoria | FK | |
| usos | unsigned int | Incrementa al asociar a un incidente resuelto |

**categorias:** `nombre`, `icono` (emoji, max 50).

**votos_recetas:** `tipo` UTIL \| NO_UTIL; unique (`id_usuario`, `id_receta`).

**consultas:** `descripcion`, `id_usuario` (cascade). Sin controladores expuestos.

**bocetos:** `titulo`, `solucion_previa`. Sin API.

---

## 6. Autenticación y autorización

### 6.1 Autenticación

- `POST /api/register` — throttle 10 req/min. Crea usuario, rol `default`, devuelve token.
- `POST /api/login` — throttle 15 req/min. Valida correo/contraseña; **borra todos los tokens** del usuario y emite uno nuevo (sesión única).
- `POST /api/logout` — revoca el token actual.
- `GET /api/user` — perfil mínimo + `es_tecnico` + `es_representante_de_area`.

Contraseña de registro y cambio: mínimo 8 caracteres, letras y números (`Password::min(8)->letters()->numbers()`).

El frontend considera técnico solo si `user.es_tecnico === true` (equivalente a `hasRole('tecnico')` en login/me).

### 6.2 Roles y permisos (seeder)

| Permiso | default | representante_de_area | tecnico / admin |
|---|---|---|---|
| incidentes.ver | sí | sí | sí |
| incidentes.crear | sí | sí | sí |
| incidentes.actualizar | no | sí | sí |
| incidentes.derivar | no | no | sí |
| incidentes.exportar | no | no | sí |
| recetas.ver | sí | sí | sí |
| recetas.crear / editar / eliminar | no | sí | sí |
| categorias.ver | sí | sí | sí |
| categorias.crear / editar / eliminar | no | sí | sí |

Policies adicionales:

- Ver/actualizar incidente: técnico o **administrador** (nombre de rol en policy) ven todos; el resto solo los propios.
- Derivar: permiso + rol `tecnico`.
- Exportar: permiso + `tecnico` o `administrador`.
- Crear/editar/borrar receta: permiso + rol `tecnico` (el representante tiene el permiso pero la policy de receta exige `tecnico`).
- Listar usuarios: rol `tecnico` o `administrador`.
- Categorías: se autorizan por permiso Spatie (el representante podría crear/editar categorías vía API si está autenticado).

**Inconsistencia documentada:** el seeder crea el rol `admin`; varias policies comprueban `administrador`. El usuario semilla `admin@ctm.com` tiene rol `tecnico`.

### 6.3 Rate limiting

| Grupo | Límite |
|---|---|
| Register | 10 / minuto |
| Login | 15 / minuto |
| Recetas/categorías públicas | 60 / minuto |
| Resto autenticado | 180 / minuto |

---

## 7. API REST

Prefijo: `/api`. Autenticadas: middleware `auth:sanctum`.

### Públicas

| Método | Ruta | Acción |
|---|---|---|
| POST | /register | Registro |
| POST | /login | Login |
| GET | /recetas | Listar/buscar (`q`, `id_categoria`) |
| GET | /recetas/{id} | Detalle |
| GET | /categorias | Listado con recetas y conteos |
| GET | /categorias/{id} | Detalle |

### Autenticadas — cuenta

| Método | Ruta | Acción |
|---|---|---|
| POST | /logout | Cerrar sesión |
| GET | /user | Usuario actual |
| GET | /profile | Perfil + roles |
| PUT | /profile | nombre, correo, interno |
| POST | /profile/foto | Imagen jpeg/png/jpg/webp ≤ 2 MB |
| DELETE | /profile/foto | Quitar avatar |
| PUT | /profile/password | Cambio con contraseña actual |
| GET | /users | Listado (técnicos) |

### Autenticadas — catálogo e incidentes

| Método | Ruta | Acción |
|---|---|---|
| POST/PUT/DELETE | /categorias[/{id}] | CRUD categorías |
| POST/PUT/DELETE | /recetas[/{id}] | CRUD recetas |
| POST | /recetas/{id}/votar | `{ "tipo": "UTIL" \| "NO_UTIL" }` |
| GET | /incidentes | Paginado 10; filtros estado, prioridad, id_categoria; técnico: id_usuario, id_tecnico |
| POST | /incidentes | Alta (RN-001, RN-005) |
| GET | /incidentes/{id} | Detalle |
| PUT | /incidentes/{id} | Actualización / resolución (RN-002) |
| PUT | /incidentes/{id}/derivar | Derivación (RN-003) |
| GET | /reportes/incidentes/exportar | CSV UTF-8 BOM, delimitador `;` |

### Autenticadas — notificaciones

| Método | Ruta | Acción |
|---|---|---|
| GET | /notificaciones | Últimas 20 + conteo no leídas |
| PUT | /notificaciones/{id}/leer | Marcar leída |
| POST | /notificaciones/marcar-todas | Marcar todas |
| GET | /alertas/criticas | Solo rol `tecnico` (RN-004) |

---

## 8. Frontend

### 8.1 Rutas (`App.jsx`)

| Ruta | Guard | Página |
|---|---|---|
| `/` | Público | Portal de recetas |
| `/recetas/:id`, `/receta/:id` | Público | Detalle de receta |
| `/login`, `/registro` | Invitado | Auth |
| `/tecnico` | `es_tecnico` | Dashboard técnico |
| `/tecnico/incidentes/:id/resolver` | Técnico | Resolver incidente |
| `/usuario` | Autenticado | Dashboard usuario |
| `/perfil` | Autenticado | Perfil |
| `/categorias/:id` | Técnico | Gestión de categoría |
| `*` | | Redirect a `/` |

### 8.2 Paneles

**Dashboard técnico:** pestañas Incidentes, Base de conocimientos, Categorías, Incidentes críticos, Usuarios. Filtros por estado/prioridad/categoría. Acciones: tomar incidente (`id_tecnico`), cambiar prioridad, derivar, ir a resolver, exportar CSV.

**Dashboard usuario:** listado de incidentes propios, alta de incidente (categoría, descripción rica, interno), consulta de recetas.

**Portal:** búsqueda `q` y filtro de categoría; no requiere login.

Interceptor Axios: HTTP 401 limpia el token y redirige a `/`.

---

## 9. Jobs y comandos

| Comando | Uso |
|---|---|
| `php artisan incidentes:revisar-alertas --horas=2` | RN-004: notifica a todos los usuarios con rol `tecnico` por cada incidente ALTA no resuelto más antiguo que el umbral |

No hay scheduler registrado en `routes/console.php`; el comando debe ejecutarse por cron o de forma manual.

Notificaciones:

- `IncidenteDerivadoNotification` — al usuario dueño del ticket.
- `AlertaIncidenteCriticoNotification` — a técnicos.

Canal: base de datos (`notifications`).

---

## 10. Seguridad implementada

- Hash de contraseñas (bcrypt).
- Tokens Sanctum; logout y sesión única en login.
- Gates/policies + Spatie.
- Throttle en login/registro y API.
- `strip_tags` + limpieza de handlers `on*` y `javascript:` en HTML de incidentes y recetas.
- CSV: BOM UTF-8; prefijo `'` si el campo empieza con `= + - @` (CWE-1236).
- Tests de feature: `AuthTest`, `IncidentesTest`, `RecetasYAlertasTest`, `SecurityTest`, `E2EFlowTest`, `ModelosTest`.

---

## 11. Datos de desarrollo (seeder)

Tras `php artisan db:seed`:

| Correo | Contraseña | Rol |
|---|---|---|
| admin@ctm.com | admin123 | tecnico |
| tecnico@ctm.com | tecnico123 | tecnico |
| redes@ctm.com | tecnico123 | tecnico |
| sistemas@ctm.com | tecnico123 | tecnico |
| juan@ctm.com (y otros) | usuario123 | default |

Categorías semilla: Computadora y Hardware, Impresoras y Fotocopiadoras, Redes e Internet, WIFI y Conectividad, Telefonía e Internos, K2B y Sistemas ERP, Software y Aplicaciones, Accesos y Seguridad.

Incluye recetas de ejemplo, votos e incidentes (uno crítico con `created_at` hace 3 horas para RN-004).

---

## 12. Cómo ejecutar (desarrollo)

```bash
# Backend
cd backend
composer install
php artisan migrate --seed
php artisan serve          # :8000

# Frontend
cd frontend
npm install
npm run dev                # :5173, proxy /api → :8000
```

Tests: `cd backend && php artisan test`.

---

## 13. Decisiones de diseño

- Sanctum en lugar de Passport: tokens simples para SPA.
- SQLite en desarrollo; PostgreSQL previsto en producción (`DB_CONNECTION`).
- Prioridad como enum BAJA/MEDIA/ALTA para RN-001 y RN-004.
- Al resolver con texto libre se **publica automáticamente** una receta en la base de conocimientos.
- Campo `es_tecnico` en `users` se mantiene por compatibilidad; la verdad de autorización es el rol Spatie.
