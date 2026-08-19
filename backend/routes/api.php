<?php

use App\Http\Controllers\Api\CategoriaController;
use App\Http\Controllers\Api\IncidenteController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RecetaController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — Mesa de Ayuda CTM
|--------------------------------------------------------------------------
| Rutas públicas (sin autenticación requerida)
*/

Route::post('/register',    [UserController::class, 'register']);
Route::post('/login',       [UserController::class, 'login']);
Route::post('/auth/google', [UserController::class, 'loginWithGoogle']);


// Base de conocimiento pública (Fase 4)
Route::get('/recetas',      [RecetaController::class, 'index']);
Route::get('/recetas/{id}', [RecetaController::class, 'show']);
Route::get('/categorias',   [CategoriaController::class, 'index']);

/*
|--------------------------------------------------------------------------
| Rutas protegidas (requieren token Sanctum)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    // Autenticación & Perfil
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/user',    [UserController::class, 'me']);

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
