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
     * Listar y buscar recetas en la base de conocimientos (incluyendo keywords).
     */
    public function index(Request $request): JsonResponse
    {
        $query = Receta::with('categoria');

        if ($request->filled('id_categoria')) {
            $query->where('id_categoria', $request->id_categoria);
        }

        if ($request->filled('q')) {
            $search = '%' . $request->q . '%';
            $query->where(function ($q) use ($search) {
                $q->where('titulo', 'like', $search)
                  ->orWhere('solucion', 'like', $search)
                  ->orWhere('keywords', 'like', $search);
            });
        }

        $recetas = $query->orderBy('usos', 'desc')
                         ->orderByDesc(function ($query) {
                             $query->selectRaw('count(*)')
                                   ->from('votos_recetas')
                                   ->whereColumn('votos_recetas.id_receta', 'recetas.id')
                                   ->where('tipo', 'UTIL');
                         })
                         ->get();

        $usuarioId = auth('sanctum')->id();
        $recetas->each(function (Receta $receta) use ($usuarioId) {
            $receta->setAttribute(
                'mi_voto',
                $usuarioId ? $receta->votos()->where('id_usuario', $usuarioId)->value('tipo') : null
            );
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
     * Permite a usuarios o técnicos calificar si la solución fue útil o no (registra voto por usuario).
     */
    public function votar(int $id, Request $request): JsonResponse
    {
        $request->validate([
            'tipo' => 'required|in:UTIL,NO_UTIL',
        ]);

        $receta = Receta::findOrFail($id);
        $usuarioId = $request->user()->id;

        $receta->registrarVoto($usuarioId, $request->tipo);

        $recetaActualizada = $receta->fresh()->load('categoria');
        $recetaActualizada->setAttribute('mi_voto', $request->tipo);

        return response()->json([
            'message'       => '¡Gracias por tu valoración!',
            'votos_util'    => $recetaActualizada->votos_util,
            'votos_no_util' => $recetaActualizada->votos_no_util,
            'mi_voto'       => $request->tipo,
            'receta'        => $recetaActualizada,
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
