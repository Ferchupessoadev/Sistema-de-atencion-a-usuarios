<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Receta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecetaController extends Controller
{
    /**
     * GET /api/recetas
     * Listar y buscar recetas en la base de conocimientos.
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
                  ->orWhere('solucion', 'like', $search);
            });
        }

        $recetas = $query->orderBy('usos', 'desc')->get();

        return response()->json($recetas);
    }

    /**
     * GET /api/recetas/{id}
     * Ver detalle de una receta.
     */
    public function show($id): JsonResponse
    {
        $receta = Receta::with(['categoria', 'incidentes'])->findOrFail($id);

        return response()->json($receta);
    }

    /**
     * POST /api/recetas
     * Crear una receta en la base de conocimientos (solo técnicos).
     */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()->es_tecnico) {
            return response()->json(['message' => 'Solo técnicos pueden crear recetas.'], 403);
        }

        $validated = $request->validate([
            'titulo'       => 'required|string|max:255',
            'solucion'     => 'required|string|min:10',
            'id_categoria' => 'required|exists:categorias,id',
        ]);

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
    public function update($id, Request $request): JsonResponse
    {
        if (! $request->user()->es_tecnico) {
            return response()->json(['message' => 'Solo técnicos pueden editar recetas.'], 403);
        }

        $receta = Receta::findOrFail($id);

        $validated = $request->validate([
            'titulo'       => 'sometimes|string|max:255',
            'solucion'     => 'sometimes|string|min:10',
            'id_categoria' => 'sometimes|exists:categorias,id',
        ]);

        $receta->update($validated);

        return response()->json([
            'message' => 'Receta actualizada con éxito.',
            'receta'  => $receta->fresh()->load('categoria'),
        ]);
    }

    /**
     * DELETE /api/recetas/{id}
     * Eliminar una receta (solo técnicos).
     */
    public function destroy($id, Request $request): JsonResponse
    {
        if (! $request->user()->es_tecnico) {
            return response()->json(['message' => 'Solo técnicos pueden eliminar recetas.'], 403);
        }

        $receta = Receta::findOrFail($id);
        $receta->delete();

        return response()->json(['message' => 'Receta eliminada con éxito.']);
    }
}
