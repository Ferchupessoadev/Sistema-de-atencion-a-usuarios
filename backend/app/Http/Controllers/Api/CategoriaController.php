<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class CategoriaController extends Controller
{
    /**
     * GET /api/categorias
     * Listar todas las categorías disponibles con conteo y listado de títulos de recetas.
     */
    public function index(): JsonResponse
    {
        $categorias = Categoria::with(['recetas' => function ($q) {
            $q->select('id', 'titulo', 'id_categoria', 'usos')->orderBy('titulo');
        }])
        ->withCount(['incidentes', 'recetas'])
        ->orderBy('nombre')
        ->get();

        return response()->json($categorias);
    }

    /**
     * GET /api/categorias/{id}
     * Obtener el detalle de una categoría específica con sus recetas y conteos.
     */
    public function show(int $id): JsonResponse
    {
        $categoria = Categoria::with(['recetas' => function ($q) {
            $q->select('id', 'titulo', 'id_categoria', 'usos', 'keywords', 'created_at')->orderBy('titulo');
        }])
        ->withCount(['incidentes', 'recetas'])
        ->findOrFail($id);

        return response()->json($categoria);
    }

    /**
     * POST /api/categorias
     * Crear una nueva categoría con emoji (solo técnicos / AICO).
     */
    public function store(Request $request): JsonResponse
    {
        Gate::authorize('create', Categoria::class);

        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:categorias,nombre',
            'icono'  => 'nullable|string|max:50',
        ]);

        $categoria = Categoria::create($validated);

        return response()->json([
            'message'   => 'Categoría creada con éxito.',
            'categoria' => $categoria->load(['recetas' => function ($q) {
                $q->select('id', 'titulo', 'id_categoria', 'usos');
            }])->loadCount(['incidentes', 'recetas']),
        ], 201);
    }

    /**
     * PUT /api/categorias/{id}
     * Modificar nombre y emoji de una categoría existente.
     */
    public function update(int $id, Request $request): JsonResponse
    {
        $categoria = Categoria::findOrFail($id);
        Gate::authorize('update', $categoria);

        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:categorias,nombre,' . $categoria->id,
            'icono'  => 'nullable|string|max:50',
        ]);

        $categoria->update($validated);

        return response()->json([
            'message'   => 'Categoría actualizada con éxito.',
            'categoria' => $categoria->fresh()->load(['recetas' => function ($q) {
                $q->select('id', 'titulo', 'id_categoria', 'usos');
            }])->loadCount(['incidentes', 'recetas']),
        ]);
    }

    /**
     * DELETE /api/categorias/{id}
     * Eliminar una categoría si no tiene incidentes ni recetas asociados.
     */
    public function destroy(int $id): JsonResponse
    {
        $categoria = Categoria::withCount(['incidentes', 'recetas'])->findOrFail($id);
        Gate::authorize('delete', $categoria);

        if ($categoria->incidentes_count > 0 || $categoria->recetas_count > 0) {
            return response()->json([
                'message' => "No se puede eliminar la categoría '{$categoria->nombre}' porque tiene {$categoria->incidentes_count} incidentes y {$categoria->recetas_count} recetas asociadas.",
            ], 422);
        }

        $categoria->delete();

        return response()->json([
            'message' => 'Categoría eliminada con éxito.',
        ]);
    }
}
