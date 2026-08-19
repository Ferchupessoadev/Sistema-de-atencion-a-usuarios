<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VotoReceta extends Model
{
    use HasFactory;

    protected $table = 'votos_recetas';

    protected $fillable = [
        'id_usuario',
        'id_receta',
        'tipo',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    public function receta(): BelongsTo
    {
        return $this->belongsTo(Receta::class, 'id_receta');
    }
}
