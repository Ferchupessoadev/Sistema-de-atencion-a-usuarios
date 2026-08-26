<?php

use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\ConsultaController;
use App\Http\Controllers\Api\IncidenteController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RecetaController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Mesa de Ayuda CTM
|--------------------------------------------------------------------------
| Rutas públicas (con protección de Rate Limiting anti-DDoS / Brute Force)
*/

Route::middleware('throttle:10,1')->post('/register', [UserController::class, 'register']);
Route::middleware('throttle:15,1')->post('/login',    [UserController::class, 'login']);

// Base de conocimiento pública (Fase 4 - Rate limit 60 req/min)
Route::middleware('throttle:60,1')->group(function () {
    Route::get('/recetas',      [RecetaController::class, 'index']);
    Route::get('/recetas/{id}', [RecetaController::class, 'show']);
    Route::get('/categorias',   [CategoriaController::class, 'index']);
});

/*
|--------------------------------------------------------------------------
| Rutas protegidas (requieren token Sanctum + Rate Limit)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'throttle:180,1'])->group(function () {
    // Autenticación & Perfil
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/user',    [UserController::class, 'me']);

    // Perfil de usuario
    Route::get('/profile',          [ProfileController::class, 'show']);
    Route::put('/profile',          [ProfileController::class, 'update']);
    Route::put('/profile/password', [ProfileController::class, 'changePassword']);

    // Listado de usuarios (solo técnicos)
    Route::get('/users', [ProfileController::class, 'listUsers']);

    // Categorías
    Route::post('/categorias', [CategoriaController::class, 'store']);


    // Base de Conocimientos - Recetas (Fase 4 y Mejoras)
    Route::post('/recetas',            [RecetaController::class, 'store']);
    Route::put('/recetas/{id}',         [RecetaController::class, 'update']);
    Route::delete('/recetas/{id}',      [RecetaController::class, 'destroy']);
    Route::post('/recetas/{id}/votar',  [RecetaController::class, 'votar']);

    // Incidentes & Reglas de Negocio (RN-001 .. RN-005)
    Route::get('/incidentes',                   [IncidenteController::class, 'index']);
    Route::post('/incidentes',                  [IncidenteController::class, 'store']);
    Route::get('/incidentes/{id}',              [IncidenteController::class, 'show']);
    Route::put('/incidentes/{id}',              [IncidenteController::class, 'update']);
    Route::put('/incidentes/{id}/derivar',      [IncidenteController::class, 'derivar']);
    Route::get('/reportes/incidentes/exportar', [IncidenteController::class, 'exportar']);


    // Notificaciones y Alertas (Fase 5 - RN-003 & RN-004)
    Route::get('/notificaciones',                 [NotificationController::class, 'index']);
    Route::put('/notificaciones/{id}/leer',        [NotificationController::class, 'markAsRead']);
    Route::post('/notificaciones/marcar-todas',   [NotificationController::class, 'markAllAsRead']);
    Route::get('/alertas/criticas',               [NotificationController::class, 'incidentesCriticos']);
});
