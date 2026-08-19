<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incidente extends Model
{
    protected $table = 'incidentes';

    protected $fillable = [
        'descripcion',
        'estado',
        'prioridad',
        'resolucion',
        'interno',
        'id_usuario',
        'id_consulta',
        'id_tecnico',
        'id_categoria',
        'id_receta',
    ];


    /** Valores por defecto al crear instancias vía Eloquent */
    protected $attributes = [
        'estado'    => 'ABIERTO',
        'prioridad' => 'MEDIA',
    ];



    protected $casts = [
        'resolucion' => 'datetime',
    ];

    // ─── Constantes de ENUM ───────────────────────────────────

    const ESTADO_ABIERTO   = 'ABIERTO';
    const ESTADO_EN_CURSO  = 'EN_CURSO';
    const ESTADO_RESUELTO  = 'RESUELTO';

    const PRIORIDAD_BAJA   = 'BAJA';
    const PRIORIDAD_MEDIA  = 'MEDIA';
    const PRIORIDAD_ALTA   = 'ALTA';

    // ─── Relaciones ──────────────────────────────────────────

    /** Usuario que creó el incidente */
    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_usuario');
    }

    /** Técnico asignado (nullable) */
    public function tecnico(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_tecnico');
    }

    /** Consulta que derivó en el incidente (nullable) */
    public function consulta(): BelongsTo
    {
        return $this->belongsTo(Consulta::class, 'id_consulta');
    }

    /** Categoría del incidente */
    public function categoria(): BelongsTo
    {
        return $this->belongsTo(Categoria::class, 'id_categoria');
    }

    /** Receta aplicada para resolución (nullable) */
    public function receta(): BelongsTo
    {
        return $this->belongsTo(Receta::class, 'id_receta');
    }

    // ─── Helpers de estado ────────────────────────────────────

    public function estaAbierto(): bool
    {
        return $this->estado === self::ESTADO_ABIERTO;
    }

    public function estaResuelto(): bool
    {
        return $this->estado === self::ESTADO_RESUELTO;
    }

    public function esAltaPrioridad(): bool
    {
        return $this->prioridad === self::PRIORIDAD_ALTA;
    }
}
