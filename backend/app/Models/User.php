<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements HasMedia
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles, InteractsWithMedia;

    protected $table = 'users';

    protected $fillable = [
        'nombre',
        'correo',
        'interno',
        'foto',
        'contrasena',
        'es_tecnico',
    ];

    protected $hidden = [
        'contrasena',
    ];

    protected $casts = [
        'es_tecnico' => 'boolean',
    ];

    protected $appends = [
        'foto_url',
    ];

    /**
     * Registro de colecciones de archivos con Spatie MediaLibrary
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatars')
            ->singleFile();
    }

    /**
     * Registro de conversiones automáticas solo si la extensión GD o Imagick está activa en PHP.
     */
    public function registerMediaConversions(?Media $media = null): void
    {
        if (extension_loaded('gd') || extension_loaded('imagick')) {
            $this->addMediaConversion('thumb')
                ->width(120)
                ->height(120)
                ->nonQueued();

            $this->addMediaConversion('preview')
                ->width(300)
                ->height(300)
                ->nonQueued();
        }
    }

    /**
     * URL completa para acceder a la foto de perfil optimizada con MediaLibrary o fallback.
     */
    public function getFotoUrlAttribute(): ?string
    {
        $media = $this->getFirstMedia('avatars');
        if ($media) {
            return $media->getUrl();
        }

        if (! $this->foto) {
            return null;
        }

        if (str_starts_with($this->foto, 'http://') || str_starts_with($this->foto, 'https://')) {
            return $this->foto;
        }

        return asset('storage/' . $this->foto);
    }

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
