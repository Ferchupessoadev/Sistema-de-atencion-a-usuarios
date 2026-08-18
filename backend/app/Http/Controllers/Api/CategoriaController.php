<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categoria;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoriaController extends Controller
{
    /**
     * GET /api/categorias
     * Listar todas las categorías disponibles.
     */
    public function index(): JsonResponse
    {
        $categorias = Categoria::orderBy('nombre')->get();

        return response()->json($categorias);
    }

    /**
     * POST /api/categorias
     * Crear una nueva categoría (solo técnicos).
     */
    public function store(Request $request): JsonResponse
    {
        if (! $request->user()->es_tecnico) {
            return response()->json(['message' => 'Solo técnicos pueden crear categorías.'], 403);
        }

        $validated = $request->validate([
            'nombre' => 'required|string|max:100|unique:categorias,nombre',
        ]);

        $categoria = Categoria::create($validated);

        return response()->json([
            'message'   => 'Categoría creada con éxito.',
            'categoria' => $categoria,
        ], 201);
    }
}
