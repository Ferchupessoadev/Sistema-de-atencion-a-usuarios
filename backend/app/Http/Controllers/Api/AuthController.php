<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Registrar un nuevo usuario.
     * POST /api/register
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'nombre'     => 'required|string|max:255',
            'correo'     => 'required|email|unique:users,correo',
            'contrasena' => 'required|string|min:6',
            'es_tecnico' => 'sometimes|boolean',
        ]);

        $user = User::create([
            'nombre'     => $request->nombre,
            'correo'     => $request->correo,
            'contrasena' => Hash::make($request->contrasena),
            'es_tecnico' => $request->boolean('es_tecnico', false),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Usuario registrado correctamente.',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => [
                'id'         => $user->id,
                'nombre'     => $user->nombre,
                'correo'     => $user->correo,
                'es_tecnico' => $user->es_tecnico,
            ],
        ], 201);
    }

    /**
     * Iniciar sesión y obtener token.
     * POST /api/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'correo'     => 'required|email',
            'contrasena' => 'required|string',
        ]);

        $user = User::where('correo', $request->correo)->first();

        if (! $user || ! Hash::check($request->contrasena, $user->contrasena)) {
            throw ValidationException::withMessages([
                'correo' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Revocar tokens anteriores del mismo dispositivo (opcional, mantiene sesión única)
        // $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Inicio de sesión exitoso.',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => [
                'id'         => $user->id,
                'nombre'     => $user->nombre,
                'correo'     => $user->correo,
                'es_tecnico' => $user->es_tecnico,
            ],
        ]);
    }

    /**
     * Cerrar sesión (revocar token actual).
     * POST /api/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }

    /**
     * Obtener datos del usuario autenticado.
     * GET /api/user
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'         => $user->id,
            'nombre'     => $user->nombre,
            'correo'     => $user->correo,
            'es_tecnico' => $user->es_tecnico,
        ]);
    }
}
