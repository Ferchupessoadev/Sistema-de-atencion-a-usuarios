<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incidente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * GET /api/notificaciones
     * Listar notificaciones del usuario autenticado (leídas y no leídas).
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $notificaciones = $user->notifications()->take(20)->get();
        $noLeidas = $user->unreadNotifications()->count();

        return response()->json([
            'no_leidas'      => $noLeidas,
            'notificaciones' => $notificaciones,
        ]);
    }

    /**
     * PUT /api/notificaciones/{id}/leer
     * Marcar una notificación como leída.
     */
    public function markAsRead(string $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $notification = $user->notifications()->where('id', $id)->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json(['message' => 'Notificación marcada como leída.']);
    }

    /**
     * POST /api/notificaciones/marcar-todas
     * Marcar todas las notificaciones del usuario como leídas.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'Todas las notificaciones marcadas como leídas.']);
    }

    /**
     * GET /api/alertas/criticas
     * RN-004: Endpoint para técnicos que consulta en tiempo real los incidentes de ALTA prioridad > 2h sin resolver.
     */
    public function incidentesCriticos(Request $request): JsonResponse
    {
        if (! $request->user()->es_tecnico) {
            return response()->json(['message' => 'Acceso denegado.'], 403);
        }

        $umbral = now()->subHours(2);

        $criticos = Incidente::with(['categoria', 'usuario', 'tecnico'])
            ->where('prioridad', Incidente::PRIORIDAD_ALTA)
            ->where('estado', '!=', Incidente::ESTADO_RESUELTO)
            ->where('created_at', '<=', $umbral)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'total_criticos' => $criticos->count(),
            'umbral_horas'   => 2,
            'incidentes'     => $criticos,
        ]);
    }
}
