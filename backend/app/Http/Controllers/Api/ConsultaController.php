<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consulta;
use Illuminate\Http\Request;

class ConsultaController extends Controller
{
    /**
     * GET /api/consultas
     * Lista las consultas del usuario autenticado.
     */
    public function index(Request $request)
    {
        $consultas = Consulta::where('id_usuario', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($consultas);
    }

    /**
     * POST /api/consultas
     * Crea una nueva consulta para el usuario autenticado.
     */
    public function store(Request $request)
    {
        $request->validate([
            'descripcion' => 'required|string|min:5',
        ], [
            'descripcion.required' => 'La descripción de la consulta es obligatoria.',
            'descripcion.min' => 'La descripción debe tener al menos 5 caracteres.',
        ]);

        $consulta = Consulta::create([
            'descripcion' => $request->descripcion,
            'id_usuario'  => $request->user()->id,
        ]);

        return response()->json($consulta, 201);
    }
}
