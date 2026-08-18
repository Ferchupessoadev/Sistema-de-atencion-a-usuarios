# Sistema de Atención a Usuarios — Plan de Implementación

## Objetivo

Construir un sistema de Mesa de Ayuda (gestión de incidentes) con arquitectura Cliente-Servidor separada:

- **Backend**: PHP 8.5 + Laravel (API REST con Sanctum para autenticación)
- **Frontend**: React (Vite) — compilable para móvil con Capacitor/React Native en etapa posterior
- **Base de Datos**: SQLite (desarrollo local) → **PostgreSQL** (producción)
- **Compilación Móvil**: **Capacitor** — empaqueta la app React como APK/IPA nativa

> [!IMPORTANT]
> En esta primera fase priorizamos **funcionalidad 100%** sobre estética. La interfaz será básica pero todos los flujos de datos deben funcionar correctamente.

---

## Entorno Detectado

| Herramienta | Versión |
|---|---|
| PHP | 8.5.0 |
| Composer | 2.8.12 |
| Node.js | v24.19.0 |
| npm | 11.17.0 |

---

## Estructura de Carpetas

```
c:\Users\CTM\Desktop\sistemactm\
├── backend/          ← Proyecto Laravel (API REST)
│   ├── app/
│   │   ├── Models/        ← Usuario, Incidente, Receta, Categoria, Consulta, Boceto
│   │   ├── Http/
│   │   │   ├── Controllers/Api/
│   │   │   ├── Middleware/
│   │   │   └── Requests/  ← Form Requests con validaciones RN-001..RN-005
│   │   └── Notifications/
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/
│       └── api.php
│
└── frontend/         ← Proyecto React (Vite)
    └── src/
        ├── components/
        ├── pages/
        ├── services/    ← API client (axios)
        ├── context/     ← AuthContext (token + rol)
        └── App.jsx
```

---

## Fases de Desarrollo

### Fase 1 — Estructura Base y Autenticación (ACTUAL)

Este es el primer entregable. Se construirá:

#### Backend (Laravel)

##### [NEW] Proyecto Laravel completo
- `composer create-project laravel/laravel backend`
- Configurar `.env` con SQLite para desarrollo rápido (sin necesidad de instalar MySQL)
- Instalar Laravel Sanctum para tokens de API

##### [NEW] Migración `create_users_table`
- Campos: `id`, `nombre`, `correo` (unique), `contrasena`, `es_tecnico` (boolean, default false), `timestamps`

##### [NEW] [UserController](file:///c:/Users/CTM/Desktop/sistemactm/backend/app/Http/Controllers/Api/UserController.php)
- `POST /api/register` — Registro de usuario
- `POST /api/login` — Login con validación de credenciales, devuelve token Sanctum + datos del usuario (incluyendo `es_tecnico`)
- `POST /api/logout` — Revoca token actual
- `GET /api/user` — Devuelve datos del usuario autenticado

##### Validaciones de login
- Correo debe existir en BD
- Contraseña debe coincidir (bcrypt)
- Respuesta incluye `es_tecnico` para que el frontend sepa qué rol tiene

#### Frontend (React + Vite)

##### [NEW] Proyecto React con Vite
- `npx create-vite frontend --template react`
- Instalar `axios` y `react-router-dom`

##### [NEW] [AuthContext.jsx](file:///c:/Users/CTM/Desktop/sistemactm/frontend/src/context/AuthContext.jsx)
- Context de React para manejar estado de autenticación
- Almacena token en `localStorage`
- Provee `user`, `login()`, `logout()`, `isAuthenticated`

##### [NEW] [LoginPage.jsx](file:///c:/Users/CTM/Desktop/sistemactm/frontend/src/pages/LoginPage.jsx)
- Formulario básico: correo + contraseña
- Llama a `POST /api/login`
- Redirige según rol: Técnico → Dashboard Técnico, Usuario → Dashboard Usuario

##### [NEW] [DashboardTecnico.jsx](file:///c:/Users/CTM/Desktop/sistemactm/frontend/src/pages/DashboardTecnico.jsx)
- Página placeholder que muestra "Panel de Técnico" + nombre del usuario
- Ruta protegida (requiere `es_tecnico === true`)

##### [NEW] [DashboardUsuario.jsx](file:///c:/Users/CTM/Desktop/sistemactm/frontend/src/pages/DashboardUsuario.jsx)
- Página placeholder que muestra "Panel de Usuario" + nombre del usuario
- Ruta protegida (requiere autenticación)

---

### Fase 2 — Modelos y Migraciones del Diccionario de Datos (siguiente paso)

##### Migraciones
- `categorias`: id, nombre
- `consultas`: id, descripcion, id_usuario (FK)
- `incidentes`: id, descripcion, estado (ENUM: ABIERTO/EN_CURSO/RESUELTO), **prioridad (ENUM: BAJA/MEDIA/ALTA)**, resolucion (datetime nullable), id_usuario (FK), id_consulta (FK nullable), id_tecnico (FK nullable), id_categoria (FK), id_receta (FK nullable)
- `recetas`: id, titulo, solucion (text), id_categoria (FK)
- `bocetos`: id, titulo, solucion_previa (text)

##### Modelos Eloquent
- Relaciones: Usuario hasMany Incidentes, Categoría hasMany Incidentes, Receta belongsTo Categoría, etc.

---

### Fase 3 — Gestión de Incidentes + Reglas de Negocio

##### Endpoints
- `POST /api/incidentes` — Crear incidente (**RN-005**: bloquear si usuario tiene ≥3 abiertos)
- `GET /api/incidentes` — Listar incidentes (filtrado por rol)
- `PUT /api/incidentes/{id}` — Actualizar estado (**RN-002**: requiere solución o receta para cerrar)
- `PUT /api/incidentes/{id}/derivar` — Derivar a unidad especializada (**RN-003**: notificar usuario)

##### Validaciones críticas
- **RN-001**: Si `es_tecnico`, debe incluir `id_categoria` y `prioridad`
- **RN-005**: Conteo de incidentes ABIERTOS por usuario < 3

---

### Fase 4 — Base de Conocimientos (Recetas)

- `GET /api/recetas` — Búsqueda pública
- `POST /api/recetas` — Crear receta (solo técnicos)
- Conteo automático de uso al asociar receta a incidente

---

### Fase 5 — Alertas y Notificaciones

- **RN-004**: Job programado que revisa incidentes Alta prioridad > 2h sin resolver
- **RN-003**: Notificación al derivar

---

## Plan de Verificación

### Pruebas Automatizadas
```bash
# Desde backend/
php artisan test
```
- Test de registro de usuario
- Test de login válido e inválido
- Test de respuesta con rol correcto (`es_tecnico`)
- Test de rutas protegidas sin token

### Verificación Manual
1. Registrar un usuario normal y un técnico vía API (Swagger o Postman)
2. Login con ambos y verificar que el token funciona
3. Abrir frontend en navegador, hacer login y confirmar redirección por rol
4. Verificar que rutas protegidas rechazan acceso sin token

---

## Decisiones de Diseño

> [!NOTE]
> **¿Por qué SQLite para desarrollo?** Permite arrancar sin instalar MySQL/PostgreSQL. En producción se cambia solo la variable `DB_CONNECTION` en `.env`.

> [!NOTE]
> **¿Por qué Sanctum y no Passport?** Sanctum es más ligero, ideal para SPAs y apps móviles con tokens simples. No necesitamos OAuth completo.

---

## Decisiones Confirmadas

| Decisión | Resolución |
|---|---|
| Base de datos producción | **PostgreSQL** |
| Campo `prioridad` en Incidentes | **ENUM: BAJA / MEDIA / ALTA** (requerido por RN-001 y RN-004) |
| Compilación móvil | **Capacitor** — empaqueta React como app nativa Android/iOS |
