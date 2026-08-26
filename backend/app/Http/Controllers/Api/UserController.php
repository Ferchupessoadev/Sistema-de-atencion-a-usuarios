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
        ]);

        $user->assignRole('default'); // Asignar rol por defecto

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Usuario registrado exitosamente.',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => [
                'id'         => $user->id,
                'nombre'     => $user->nombre,
                'correo'     => $user->correo,
                'foto'       => $user->foto,
                'foto_url'   => $user->foto_url,
                'es_tecnico' => $user->hasRole(['tecnico']),
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
                'foto'       => $user->foto,
                'foto_url'   => $user->foto_url,
                'es_tecnico' => $user->hasRole(['tecnico']),
                'es_representante_de_area' => $user->hasRole(['representante_de_area']),
            ],
        ]);
    }


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
            'foto'       => $user->foto,
            'foto_url'   => $user->foto_url,
            'es_tecnico' => $user->hasRole(['tecnico']),
            'es_representante_de_area' => $user->hasRole(['representante_de_area']),
        ]);
    }
}
