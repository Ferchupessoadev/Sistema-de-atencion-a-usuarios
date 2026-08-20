<?php

namespace App\Policies;

use App\Models\Receta;
use App\Models\User;

class RecetaPolicy
{
    public function create(User $user): bool
    {
        return $user->can('recetas.crear') && $user->hasRole('tecnico');
    }

    public function update(User $user, Receta $receta): bool
    {
        return $user->can('recetas.editar') && $user->hasRole('tecnico');
    }

    public function delete(User $user, Receta $receta): bool
    {
        return $user->can('recetas.eliminar') && $user->hasRole('tecnico');
    }

    public function vote(User $user, Receta $receta): bool
    {
        return $user->hasVerifiedEmail();
    }

    public function viewAny(User $user): bool
    {
        return $user->can('recetas.ver');
    }
}
