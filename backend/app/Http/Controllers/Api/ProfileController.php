<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * GET /api/profile
     * Devuelve los datos completos del usuario autenticado.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'id'       => $user->id,
            'nombre'   => $user->nombre,
            'correo'   => $user->correo,
            'interno'  => $user->interno,
            'roles'    => $user->getRoleNames(),
            'es_tecnico' => $user->hasRole('tecnico'),
            'created_at' => $user->created_at,
        ]);
    }

    /**
     * PUT /api/profile
     * Actualiza nombre, correo e interno del usuario autenticado.
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        $user->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado correctamente.',
            'user'    => [
                'id'       => $user->id,
                'nombre'   => $user->nombre,
                'correo'   => $user->correo,
                'interno'  => $user->interno,
                'es_tecnico' => $user->hasRole('tecnico'),
            ],
        ]);
    }

    /**
     * PUT /api/profile/password
     * Cambia la contraseña validando la contraseña actual.
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // Verificar contraseña actual
        if (! Hash::check($validated['contrasena_actual'], $user->contrasena)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta.',
                'errors'  => ['contrasena_actual' => ['La contraseña actual es incorrecta.']],
            ], 422);
        }

        $user->update([
            'contrasena' => Hash::make($validated['contrasena']),
        ]);

        return response()->json([
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }

    /**
     * GET /api/users
     * Lista todos los usuarios registrados. Solo accesible para técnicos.
     */
    public function listUsers(Request $request): JsonResponse
    {
        Gate::authorize('viewAny', User::class);

        $users = User::select('id', 'nombre', 'correo', 'interno', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (User $user) {
                return [
                    'id'         => $user->id,
                    'nombre'     => $user->nombre,
                    'correo'     => $user->correo,
                    'interno'    => $user->interno,
                    'roles'      => $user->getRoleNames(),
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json($users);
    }
}
