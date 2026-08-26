<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class RecetaController extends Controller
{
    /**
     * GET /api/recetas
     * Listar y buscar recetas en la base de conocimientos.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Receta::with('categoria')
            ->withCount([
                'votos as votos_util' => function ($q) {
                    $q->where('tipo', 'UTIL');
                },
                'votos as votos_no_util' => function ($q) {
                    $q->where('tipo', 'NO_UTIL');
                },
            ]);

        // Filtro por categoría
        if ($request->filled('id_categoria')) {
            $query->where(
                'id_categoria',
                $request->id_categoria
            );
        }

        // Búsqueda
        if ($request->filled('q')) {
            $search = '%' . trim($request->q) . '%';

            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', $search)
                    ->orWhere('solucion', 'like', $search)
                    ->orWhere('keywords', 'like', $search);
            });
        }

        // Ordenar por usos y luego por votos útiles
        $recetas = $query
            ->orderByDesc('usos')
            ->orderByDesc('votos_util')
            ->get();

        // Usuario actual
        $usuarioId = auth('sanctum')->id();

        // Agregar el voto del usuario
        $recetas->each(function (Receta $receta) use ($usuarioId) {

            $receta->mi_voto = null;

            if ($usuarioId) {
                $receta->mi_voto = $receta->votos()
                    ->where('id_usuario', $usuarioId)
                    ->value('tipo');
            }

            // Aseguramos que sean números
            $receta->votos_util = (int) $receta->votos_util;
            $receta->votos_no_util = (int) $receta->votos_no_util;
        });

        return response()->json($recetas);
    }

    /**
     * GET /api/recetas/{id}
     * Ver detalle de una receta.
     */
    public function show(int $id): JsonResponse
    {
        $receta = Receta::with(['categoria', 'incidentes'])->findOrFail($id);

        return response()->json($receta);
    }

    /**
     * Sanitiza texto enriquecido HTML permitiendo solo etiquetas seguras (previene Stored XSS).
     */
    private static function sanitizeRichText(?string $html): ?string
    {
        if ($html === null) {
            return null;
        }

        $allowedTags = '<p><br><b><strong><i><em><u><s><strike><h1><h2><h3><h4><h5><h6><ul><ol><li><blockquote><pre><code><hr><a><span><div>';
        $stripped = strip_tags($html, $allowedTags);

        // Remover manejadores de eventos (onclick, onerror, onload, etc.) y protocolos javascript:
        $sanitized = preg_replace('/\s*on\w+\s*=\s*(["\']).*?\1/i', '', $stripped);
        $sanitized = preg_replace('/href\s*=\s*(["\'])\s*javascript:[^"\']*\1/i', 'href="#"', $sanitized);

        return trim($sanitized);
    }

    /**
     * POST /api/recetas
     * Crear una receta en la base de conocimientos (solo técnicos).
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Receta::class);

        $validated = $request->validate([
            'titulo'       => 'required|string|max:255',
            'solucion'     => 'required|string|min:10',
            'keywords'     => 'nullable|string|max:1000',
            'id_categoria' => 'required|exists:categorias,id',
        ]);

        $validated['solucion'] = self::sanitizeRichText($validated['solucion']);

        $receta = Receta::create($validated);

        return response()->json([
            'message' => 'Receta creada con éxito.',
            'receta'  => $receta->load('categoria'),
        ], 201);
    }

    /**
     * PUT /api/recetas/{id}
     * Actualizar una receta (solo técnicos).
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $receta = Receta::findOrFail($id);
        Gate::authorize('update', $receta);

        $validated = $request->validate([
            'titulo'       => 'sometimes|string|max:255',
            'solucion'     => 'sometimes|string|min:10',
            'keywords'     => 'nullable|string|max:1000',
            'id_categoria' => 'sometimes|exists:categorias,id',
        ]);

        if (isset($validated['solucion'])) {
            $validated['solucion'] = self::sanitizeRichText($validated['solucion']);
        }

        $receta->update($validated);

        return response()->json([
            'message' => 'Receta actualizada con éxito.',
            'receta'  => $receta->fresh()->load('categoria'),
        ]);
    }

    /**
     * POST /api/recetas/{id}/votar
     */
    public function votar(Request $request, int $id): JsonResponse 
    {
        $request->validate([
            'tipo' => [
                'required',
                'in:UTIL,NO_UTIL',
            ],
        ]);

        $usuarioId = auth('sanctum')->id();

        if (!$usuarioId) {
            return response()->json([
                'message' => 'Debes estar autenticado para votar.',
            ], 401);
        }

        $receta = Receta::findOrFail($id);

        // Registrar o actualizar voto
        $receta->registrarVoto(
            $usuarioId,
            $request->tipo
        );

        // Recargar relaciones
        $receta->load('categoria');

        // Recalcular contadores
        $receta->loadCount([
            'votos as votos_util' => function ($q) {
                $q->where('tipo', 'UTIL');
            },
            'votos as votos_no_util' => function ($q) {
                $q->where('tipo', 'NO_UTIL');
            },
        ]);

        // Voto del usuario
        $receta->mi_voto = $receta->votos()
            ->where('id_usuario', $usuarioId)
            ->value('tipo');

        $receta->votos_util = (int) $receta->votos_util;
        $receta->votos_no_util = (int) $receta->votos_no_util;

        return response()->json([
            'message' => 'Voto registrado correctamente.',
            'receta' => $receta,
        ]);
    }


    /**
     * DELETE /api/recetas/{id}
     * Eliminar una receta (solo técnicos).
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        $receta = Receta::findOrFail($id);
        Gate::authorize('delete', $receta);
        $receta->delete();

        return response()->json(['message' => 'Receta eliminada con éxito.']);
    }
}
