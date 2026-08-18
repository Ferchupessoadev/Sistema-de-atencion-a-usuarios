<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Categoria extends Model
{
    protected $table = 'categorias';

    protected $fillable = ['nombre'];

    // ─── Relaciones ──────────────────────────────────────────

    /** Una categoría tiene muchos incidentes */
    public function incidentes(): HasMany
    {
        return $this->hasMany(Incidente::class, 'id_categoria');
    }

    /** Una categoría tiene muchas recetas */
    public function recetas(): HasMany
    {
        return $this->hasMany(Receta::class, 'id_categoria');
    }
}
