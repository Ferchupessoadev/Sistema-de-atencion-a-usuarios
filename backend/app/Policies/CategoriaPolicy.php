<?php

namespace App\Policies;

use App\Models\Categoria;
use App\Models\User;

class CategoriaPolicy
{

    /**
     * Determina si el usuario puede ver la lista de categorías.
     * 
     * @param User $user
     * @return bool
     */ 
    public function viewAny(User $user): bool
    {
        return $user->can('categorias.ver');
    }

    /**
     * Determina si el usuario puede crear una nueva categoría.
     * 
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        return $user->can('categorias.crear');
    }

    /**
     * Determina si el usuario puede ver una categoría específica.
     * 
     * @param User $user
     * @param Categoria $categoria
     * @return bool
     */
    public function view(User $user, Categoria $categoria): bool
    {
        return $user->can('categorias.ver');
    }

    /**
     * Determina si el usuario puede actualizar una categoría específica.
     * 
     * @param User $user
     * @param Categoria $categoria
     * @return bool
     */
    public function update(User $user, Categoria $categoria): bool
    {
        return $user->can('categorias.editar');
    }

    /**
     * Determina si el usuario puede eliminar una categoría específica.
     * 
     * @param User $user
     * @param Categoria $categoria
     * @return bool
     */
    public function delete(User $user, Categoria $categoria): bool
    {
        return $user->can('categorias.eliminar') && $categoria->incidentes()->count() === 0;
    }
}
