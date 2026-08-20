<?php

namespace App\Policies;

use App\Models\Incidente;
use App\Models\User;

class IncidentePolicy
{
    /**
     * Permite ver la lista de incidentes completa, solo los tecnicos pueden ver la lista de incidentes completa.
     *
     * @param User $user
     * @return bool
     */
    public function viewAny(User $user): bool
    {
        return $user->can('incidentes.ver') && $user->HasRole('tecnico');
    }

    /**
     * Determina si el usuario puede visualizar un incidente específico.
     *
     * Los técnicos pueden visualizar cualquier incidente.
     * Los demás usuarios solamente pueden visualizar los incidentes
     * que les pertenecen.
     *
     * @param User $user
     * @param Incidente $incidente
     * @return bool
     */
    public function view(User $user, Incidente $incidente): bool
    {
        if ($user->can('incidentes.ver') && $user->HasRole('tecnico')) {
            return true;
        }

        # TODO: implements derivations
        # if($user->HasRole('representante_de_area')) {
        #   ...
        # }

        return $user->can('incidentes.ver') && $user->id === $incidente->id_usuario;
    }

    /**
     * Determina si el usuario puede crear un nuevo incidente.
     *
     * @param User $user
     * @return bool
     */
    public function create(User $user): bool
    {
        return $user->can('incidentes.crear');
    }

    /**
     * Determina si el usuario puede actualizar un incidente específico.
     *
     * Los técnicos pueden actualizar cualquier incidente.
     * Los demás usuarios solamente pueden actualizar los incidentes
     * que les pertenecen y para los cuales poseen el permiso
     * "incidentes.actualizar".
     *
     * @param User $user
     * @param Incidente $incidente
     * @return bool
     */
    public function update(User $user, Incidente $incidente): bool
    {
        if ($user->can('incidentes.actualizar') && $user->HasRole('tecnico')) {
            return true;
        }

        return $user->can('incidentes.actualizar') && $user->id === $incidente->id_usuario;
    }
    
    /**
     * Determina si el usuario puede derivar un incidente específico.
     *
     * Solo los técnicos pueden derivar incidentes.
     *
     * @param User $user
     * @param Incidente $incidente
     * @return bool
     */
    public function derive(User $user, Incidente $incidente): bool
    {
        return$user->can('incidentes.derivar') && $user->hasRole('tecnico');
    }

    /**
     * Determina si el usuario puede exportar la lista de incidentes.
     *
     * Solo los técnicos pueden exportar incidentes, ya sea en formato csv o excel.
     *
     * @param User $user
     * @return bool
     */
    public function export(User $user): bool
    {
        return $user->HasRole('tecnico');
    }
}
