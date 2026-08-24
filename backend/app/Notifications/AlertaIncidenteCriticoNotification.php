<?php

namespace App\Notifications;

use App\Models\Incidente;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class AlertaIncidenteCriticoNotification extends Notification
{
    use Queueable;

    public Incidente $incidente;
    public int $horasTranscurridas;

    public function __construct(Incidente $incidente, int $horasTranscurridas = 2)
    {
        $this->incidente = $incidente;
        $this->horasTranscurridas = $horasTranscurridas;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'tipo'               => 'ALERTA_CRITICA',
            'titulo'             => "⚠️ Incidente crítico #{$this->incidente->id} sin resolver",
            'mensaje'            => "El incidente de ALTA prioridad lleva más de {$this->horasTranscurridas} horas sin resolución.",
            'incidente_id'       => $this->incidente->id,
            'categoria'          => $this->incidente->categoria?->nombre ?? 'General',
            'horas_sin_resolver' => $this->horasTranscurridas,
            'fecha'              => now()->toDateTimeString(),
        ];
    }
}
