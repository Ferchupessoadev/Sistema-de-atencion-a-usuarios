<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Boceto extends Model
{
    protected $table = 'bocetos';

    protected $fillable = [
        'titulo',
        'solucion_previa',
    ];
}
