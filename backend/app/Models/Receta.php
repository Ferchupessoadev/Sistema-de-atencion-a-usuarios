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
        'votos_util',
        'votos_no_util',
    ];

    protected $casts = [
        'usos'          => 'integer',
        'votos_util'    => 'integer',
        'votos_no_util' => 'integer',
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

    /**
     * Incrementa el contador de usos de la receta.
     * Se llama al asociar la receta a un incidente.
     */
    public function incrementarUsos(): void
    {
        $this->increment('usos');
    }

    /**
     * Registra un voto positivo.
     */
    public function votarUtil(): void
    {
        $this->increment('votos_util');
    }

    /**
     * Registra un voto negativo.
     */
    public function votarNoUtil(): void
    {
        $this->increment('votos_no_util');
    }
}

