<?php

namespace App\Notifications;

use App\Models\Incidente;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class IncidenteDerivadoNotification extends Notification
{
    use Queueable;

    public Incidente $incidente;
    public string $unidadEspecializada;
    public string $motivo;

    public function __construct(Incidente $incidente, string $unidadEspecializada, string $motivo)
    {
        $this->incidente = $incidente;
        $this->unidadEspecializada = $unidadEspecializada;
        $this->motivo = $motivo;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipo'                 => 'INCIDENTE_DERIVADO',
            'titulo'               => "Tu incidente #{$this->incidente->id} ha sido derivado",
            'mensaje'              => "Se derivó a {$this->unidadEspecializada}. Motivo: {$this->motivo}",
            'incidente_id'         => $this->incidente->id,
            'unidad_especializada' => $this->unidadEspecializada,
            'motivo'               => $this->motivo,
            'fecha'                => now()->toDateTimeString(),
        ];
    }
}
