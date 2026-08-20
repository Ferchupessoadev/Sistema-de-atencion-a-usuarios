<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasPermissions;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, HasPermissions;

    protected $table = 'users';

    protected $fillable = [
        'nombre',
        'correo',
        'interno',
        'contrasena',
        'es_tecnico',
    ];

    protected $hidden = [
        'contrasena',
    ];

    protected $casts = [
        'es_tecnico' => 'boolean',
    ];

    /**
     * Override: campo de contraseña personalizado.
     */
    public function getAuthPassword(): string
    {
        return $this->contrasena;
    }

    // ─── Relaciones ──────────────────────────────────────────

    /** Incidentes abiertos por este usuario */
    public function incidentes(): HasMany
    {
        return $this->hasMany(Incidente::class, 'id_usuario');
    }

    /** Incidentes asignados a este usuario (cuando es técnico) */
    public function incidentesAsignados(): HasMany
    {
        return $this->hasMany(Incidente::class, 'id_tecnico');
    }

    /** Consultas realizadas por este usuario */
    public function consultas(): HasMany
    {
        return $this->hasMany(Consulta::class, 'id_usuario');
    }

    /** Votos emitidos por este usuario en recetas */
    public function votosRecetas(): HasMany
    {
        return $this->hasMany(VotoReceta::class, 'id_usuario');
    }

    // ─── Helpers ─────────────────────────────────────────────

    /**
     * Cuenta los incidentes ABIERTOS del usuario (para RN-005).
     */
    public function contarIncidentesAbiertos(): int
    {
        return $this->incidentes()
                    ->where('estado', Incidente::ESTADO_ABIERTO)
                    ->count();
    }
}
