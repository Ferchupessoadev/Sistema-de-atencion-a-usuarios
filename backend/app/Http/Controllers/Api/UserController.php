<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class UserController extends Controller
{
    /**
     * POST /api/register
     * Registro de un nuevo usuario con credenciales estándar.
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::create([
            'nombre'     => $validated['nombre'],
            'correo'     => $validated['correo'],
            'contrasena' => Hash::make($validated['contrasena']),
            'es_tecnico' => $validated['es_tecnico'] ?? false,
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Usuario registrado exitosamente.',
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
     * POST /api/login
     * Login con correo y contraseña. Devuelve token Sanctum + rol.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('correo', $validated['correo'])->first();

        if (! $user || ! Hash::check($validated['contrasena'], $user->contrasena)) {
            throw ValidationException::withMessages([
                'correo' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Revocar tokens anteriores para sesión única
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Login exitoso.',
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

<<<<<<< HEAD
=======

>>>>>>> 625daac60acdb0fa4e67fa9629ac2008e528049b
    /**
     * POST /api/logout
     * Revoca el token actual del usuario autenticado.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }

    /**
     * GET /api/user
     * Devuelve los datos del usuario autenticado.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'         => $user->id,
            'nombre'     => $user->nombre,
            'correo'     => $user->correo,
            'interno'    => $user->interno,
            'es_tecnico' => $user->es_tecnico,
        ]);
    }
}
