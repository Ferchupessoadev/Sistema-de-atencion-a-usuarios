<?php

namespace App\Console\Commands;

use App\Models\Incidente;
use App\Models\User;
use App\Notifications\AlertaIncidenteCriticoNotification;
use Illuminate\Console\Command;

class RevisarAlertasIncidentes extends Command
{
    protected $signature = 'incidentes:revisar-alertas {--horas=2 : Horas de antigüedad para considerar crítico}';
    protected $description = 'RN-004: Revisa incidentes de alta prioridad no resueltos tras más de 2 horas y genera alertas';

    public function handle(): int
    {
        $horas = (int) $this->option('horas');
        $umbral = now()->subHours($horas);

        // Incidentes ALTA prioridad, no resueltos, con antigüedad mayor al umbral
        $incidentesCriticos = Incidente::with(['categoria', 'usuario', 'tecnico'])
            ->where('prioridad', Incidente::PRIORIDAD_ALTA)
            ->where('estado', '!=', Incidente::ESTADO_RESUELTO)
            ->where('created_at', '<=', $umbral)
            ->get();

        $totalCriticos = $incidentesCriticos->count();

        if ($totalCriticos === 0) {
            $this->info("✅ No se detectaron incidentes críticos de alta prioridad con más de {$horas} horas sin resolver.");
            return Command::SUCCESS;
        }

        $this->warn("⚠️ Se detectaron {$totalCriticos} incidente(s) crítico(s) sin resolver (RN-004).");

        $tecnicos = User::role('tecnico')->get();

        foreach ($incidentesCriticos as $incidente) {
            $horasTranscurridas = (int) $incidente->created_at->diffInHours(now());
            $this->line(" - Incidente #{$incidente->id}: {$incidente->descripcion} ({$horasTranscurridas}h abierta)");

            // Enviar notificación a todos los técnicos
            foreach ($tecnicos as $tecnico) {
                $tecnico->notify(new AlertaIncidenteCriticoNotification($incidente, $horasTranscurridas));
            }
        }

        $this->info("📢 Se enviaron alertas a {$tecnicos->count()} técnico(s) para {$totalCriticos} incidente(s) crítico(s).");

        return Command::SUCCESS;
    }
}
