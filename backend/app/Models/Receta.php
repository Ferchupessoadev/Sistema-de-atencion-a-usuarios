<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Receta extends Model
{
    protected $table = 'recetas';

    protected $fillable = [
        'titulo',
        'solucion',
        'keywords',
        'id_categoria',
        'usos',
    ];

    protected $casts = [
        'usos'          => 'integer',
    ];

    // ─── Relaciones ──────────────────────────────────────────

    /** La receta pertenece a una categoría */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'id_categoria');
    }

    /** La receta puede estar aplicada a muchos incidentes */
    public function incidentes(): HasMany
    {
        return $this->hasMany(Incidente::class, 'id_receta');
    }

    /** Votos registrados por los usuarios para esta receta */
    public function votos(): HasMany
    {
        return $this->hasMany(VotoReceta::class, 'id_receta');
    }

    /**
     * Incrementa el contador de usos de la receta.
     * Se llama al asociar la receta a un incidente.
     */
    public function incrementarUsos(): void
    {
        $this->increment('usos');
    }

    /**
     * Registra o actualiza el voto del usuario en la misma fila.
     */
    public function registrarVoto(int $usuarioId, string $tipo): void
    {
        VotoReceta::updateOrCreate(
            ['id_usuario' => $usuarioId, 'id_receta' => $this->id],
            ['tipo' => $tipo]
        );
    }

    public function votosUtil(): int
    {
        return $this->votos()->where('tipo', 'UTIL')->count();
    }

    public function votosNoUtil(): int
    {
        return $this->votos()->where('tipo', 'NO_UTIL')->count();
    }

    public function getVotosUtilAttribute(): int
    {
        return $this->votosUtil();
    }

    public function getVotosNoUtilAttribute(): int
    {
        return $this->votosNoUtil();
    }
}

