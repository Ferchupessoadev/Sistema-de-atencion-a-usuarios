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
use Illuminate\Support\Facades\Storage;

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
            'id'         => $user->id,
            'nombre'     => $user->nombre,
            'correo'     => $user->correo,
            'interno'    => $user->interno,
            'foto'       => $user->foto,
            'foto_url'   => $user->foto_url,
            'roles'      => $user->getRoleNames(),
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
                'id'         => $user->id,
                'nombre'     => $user->nombre,
                'correo'     => $user->correo,
                'interno'    => $user->interno,
                'foto'       => $user->foto,
                'foto_url'   => $user->foto_url,
                'es_tecnico' => $user->hasRole('tecnico'),
            ],
        ]);
    }

    /**
     * POST /api/profile/foto
     * Sube y actualiza la foto de perfil del usuario optimizándola con Spatie MediaLibrary.
     */
    public function uploadFoto(Request $request): JsonResponse
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpeg,png,jpg,webp|max:2048', // Max 2MB
        ], [
            'foto.required' => 'Debes seleccionar una imagen para tu foto de perfil.',
            'foto.image'    => 'El archivo seleccionado debe ser una imagen.',
            'foto.mimes'    => 'Formatos permitidos: JPG, PNG, WEBP o JPEG.',
            'foto.max'      => 'La foto no debe superar los 2 MB de tamaño.',
        ]);

        $user = $request->user();

        // Limpiar colección previa y almacenar la nueva imagen en Spatie MediaLibrary
        $user->clearMediaCollection('avatars');
        $media = $user->addMediaFromRequest('foto')
            ->toMediaCollection('avatars');

        $user->update([
            'foto' => $media->getUrl(),
        ]);

        return response()->json([
            'message'  => 'Foto de perfil optimizada y actualizada correctamente.',
            'foto'     => $media->getUrl(),
            'foto_url' => $user->foto_url,
            'user'     => [
                'id'         => $user->id,
                'nombre'     => $user->nombre,
                'correo'     => $user->correo,
                'interno'    => $user->interno,
                'foto'       => $user->foto,
                'foto_url'   => $user->foto_url,
                'es_tecnico' => $user->hasRole('tecnico'),
            ],
        ]);
    }

    /**
     * DELETE /api/profile/foto
     * Elimina la foto de perfil del usuario.
     */
    public function removeFoto(Request $request): JsonResponse
    {
        $user = $request->user();

        $user->clearMediaCollection('avatars');

        if ($user->foto && !str_starts_with($user->foto, 'http') && Storage::disk('public')->exists($user->foto)) {
            Storage::disk('public')->delete($user->foto);
        }

        $user->update([
            'foto' => null,
        ]);

        return response()->json([
            'message'  => 'Foto de perfil eliminada correctamente.',
            'foto'     => null,
            'foto_url' => null,
            'user'     => [
                'id'         => $user->id,
                'nombre'     => $user->nombre,
                'correo'     => $user->correo,
                'interno'    => $user->interno,
                'foto'       => null,
                'foto_url'   => null,
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

        $users = User::select('id', 'nombre', 'correo', 'interno', 'foto', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function (User $user) {
                return [
                    'id'         => $user->id,
                    'nombre'     => $user->nombre,
                    'correo'     => $user->correo,
                    'interno'    => $user->interno,
                    'foto'       => $user->foto,
                    'foto_url'   => $user->foto_url,
                    'roles'      => $user->getRoleNames(),
                    'created_at' => $user->created_at,
                ];
            });

        return response()->json($users);
    }
}
