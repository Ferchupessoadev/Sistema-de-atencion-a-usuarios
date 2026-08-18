<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Consulta extends Model
{
    protected $table = 'consultas';

    protected $fillable = ['descripcion', 'id_usuario'];

    // ─── Relaciones ──────────────────────────────────────────

    /** La consulta pertenece a un usuario */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    /** Una consulta puede derivar en uno o más incidentes */
    public function incidentes(): HasMany
    {
        return $this->hasMany(Incidente::class, 'id_consulta');
    }
}
