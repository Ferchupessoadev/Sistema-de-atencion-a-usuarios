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
        'id_categoria',
        'usos',
    ];

    protected $casts = [
        'usos' => 'integer',
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
}
