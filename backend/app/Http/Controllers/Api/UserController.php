<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre'     => 'required|string|max:255',
            'correo'     => 'required|email|unique:users,correo',
            'contrasena' => 'required|string|min:6',
            'es_tecnico' => 'sometimes|boolean',
        ]);

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

    /**
     * POST /api/auth/google
     * Login y Auto-registro rápido mediante Google / Gmail.
     */
    public function loginWithGoogle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'correo'    => 'required|email',
            'nombre'    => 'required|string|max:255',
            'google_id' => 'nullable|string|max:255',
            'avatar'    => 'nullable|string|max:1000',
        ]);

        $correo = strtolower(trim($validated['correo']));

        // Buscar usuario existente por correo o google_id
        $user = User::where('correo', $correo)
            ->orWhere(function ($query) use ($validated) {
                if (! empty($validated['google_id'])) {
                    $query->where('google_id', $validated['google_id']);
                }
            })->first();

        if ($user) {
            // Actualizar datos de Google si no los tenía
            $user->update([
                'google_id' => $validated['google_id'] ?? $user->google_id,
                'avatar'    => $validated['avatar'] ?? $user->avatar,
            ]);
        } else {
            // Auto-registro instantáneo
            $user = User::create([
                'nombre'     => $validated['nombre'],
                'correo'     => $correo,
                'google_id'  => $validated['google_id'] ?? null,
                'avatar'     => $validated['avatar'] ?? null,
                'contrasena' => Hash::make(Str::random(32)),
                'es_tecnico' => false,
            ]);
        }

        // Revocar tokens anteriores para sesión limpia
        $user->tokens()->delete();

        $token = $user->createToken('auth_token_google')->plainTextToken;

        return response()->json([
            'message'    => 'Autenticación con Google exitosa.',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => [
                'id'         => $user->id,
                'nombre'     => $user->nombre,
                'correo'     => $user->correo,
                'es_tecnico' => $user->es_tecnico,
                'avatar'     => $user->avatar,
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
            'es_tecnico' => $user->es_tecnico,
            'avatar'     => $user->avatar,
        ]);
    }
}
