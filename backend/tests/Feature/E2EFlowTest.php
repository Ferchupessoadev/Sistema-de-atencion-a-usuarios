<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class E2EFlowTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function test_flujo_completo_usuario_y_tecnico_con_todas_las_reglas_de_negocio(): void
    {
        // ── 1. Setup Base ─────────────────────────────────────────
        $categoria = Categoria::create(['nombre' => 'Hardware y Pantallas']);
        $receta = Receta::create([
            'titulo'       => 'Reemplazo o calibración de cable HDMI/DisplayPort',
            'solucion'     => '1. Desconectar el cable. 2. Verificar pines. 3. Probar en puerto alternativo.',
            'id_categoria' => $categoria->id,
            'usos'         => 0,
        ]);

        $usuario = User::create([
            'nombre'     => 'Juan Pérez',
            'correo'     => 'juan@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $tecnico = User::create([
            'nombre'     => 'Carlos Técnico',
            'correo'     => 'tecnico@ctm.com',
            'contrasena' => Hash::make('tecnico123'),
            'es_tecnico' => true,
        ]);

        // ── 2. Login de Usuario ───────────────────────────────────
        $loginRes = $this->postJson('/api/login', [
            'correo'     => 'juan@ctm.com',
            'contrasena' => 'usuario123',
        ]);
        $loginRes->assertStatus(200)
                 ->assertJsonPath('user.es_tecnico', false);

        // ── 3. Usuario crea su 1er incidente ──────────────────────
        $inc1Res = $this->actingAs($usuario, 'sanctum')
                        ->postJson('/api/incidentes', [
                            'descripcion'  => 'El monitor no muestra imagen tras encender la PC.',
                            'id_categoria' => $categoria->id,
                        ]);
        $inc1Res->assertStatus(201)
                ->assertJsonPath('incidente.estado', 'ABIERTO')
                ->assertJsonPath('incidente.prioridad', 'MEDIA');
        $idIncidente1 = $inc1Res->json('incidente.id');

        // Usuario crea 2do y 3er incidente
        $this->actingAs($usuario, 'sanctum')
             ->postJson('/api/incidentes', ['descripcion' => 'Incidente 2', 'id_categoria' => $categoria->id])
             ->assertStatus(201);
        $this->actingAs($usuario, 'sanctum')
             ->postJson('/api/incidentes', ['descripcion' => 'Incidente 3', 'id_categoria' => $categoria->id])
             ->assertStatus(201);

        // ── 4. Validación RN-005 (Bloqueo al 4to incidente abierto) ───
        $bloqueoRes = $this->actingAs($usuario, 'sanctum')
                           ->postJson('/api/incidentes', [
                               'descripcion'  => 'Intento de 4to incidente que debe ser rechazado',
                               'id_categoria' => $categoria->id,
                           ]);
        $bloqueoRes->assertStatus(422)
                   ->assertJsonPath('errors.id_usuario.0', 'Límite alcanzado: no se permiten más de 3 incidentes en estado ABIERTO simultáneamente.');

        // ── 5. Login de Técnico ───────────────────────────────────
        $loginTec = $this->postJson('/api/login', [
            'correo'     => 'tecnico@ctm.com',
            'contrasena' => 'tecnico123',
        ]);
        $loginTec->assertStatus(200)
                 ->assertJsonPath('user.es_tecnico', true);

        // ── 6. Técnico lista incidentes y toma el caso ────────────
        $listaTec = $this->actingAs($tecnico, 'sanctum')
                         ->getJson('/api/incidentes');
        $listaTec->assertStatus(200);
        $this->assertCount(3, $listaTec->json());

        // Asignarse y cambiar prioridad (RN-001)
        $updateRes = $this->actingAs($tecnico, 'sanctum')
                          ->putJson("/api/incidentes/{$idIncidente1}", [
                              'id_tecnico' => $tecnico->id,
                              'estado'     => 'EN_CURSO',
                              'prioridad'  => 'ALTA',
                          ]);
        $updateRes->assertStatus(200)
                  ->assertJsonPath('incidente.id_tecnico', $tecnico->id)
                  ->assertJsonPath('incidente.estado', 'EN_CURSO')
                  ->assertJsonPath('incidente.prioridad', 'ALTA');

        // ── 7. Validación RN-002 (Intentar resolver sin solución) ───
        $failResolve = $this->actingAs($tecnico, 'sanctum')
                            ->putJson("/api/incidentes/{$idIncidente1}", [
                                'estado' => 'RESUELTO',
                            ]);
        $failResolve->assertStatus(422)
                    ->assertJsonValidationErrors(['resolucion']);

        // ── 8. Técnico resuelve con Receta (RN-002 cumplido) ──────
        $okResolve = $this->actingAs($tecnico, 'sanctum')
                          ->putJson("/api/incidentes/{$idIncidente1}", [
                              'estado'    => 'RESUELTO',
                              'id_receta' => $receta->id,
                          ]);
        $okResolve->assertStatus(200)
                  ->assertJsonPath('incidente.estado', 'RESUELTO')
                  ->assertJsonPath('incidente.id_receta', $receta->id);

        $this->assertNotNull($okResolve->json('incidente.resolucion'));
        $this->assertEquals(1, $receta->fresh()->usos);

        // ── 9. Ahora que Juan tiene 1 resuelto y 2 abiertos, RN-005 le permite crear otro ──
        $juanPuedeCrear = $this->actingAs($usuario, 'sanctum')
                               ->postJson('/api/incidentes', [
                                   'descripcion'  => 'Nuevo incidente ahora permitido tras resolución del anterior.',
                                   'id_categoria' => $categoria->id,
                               ]);
        $juanPuedeCrear->assertStatus(201);

        // ── 10. Validación RN-003 (Derivar incidente) ─────────────
        $idNuevoInc = $juanPuedeCrear->json('incidente.id');
        $derivarRes = $this->actingAs($tecnico, 'sanctum')
                           ->putJson("/api/incidentes/{$idNuevoInc}/derivar", [
                               'unidad_especializada' => 'Laboratorio Central de Hardware',
                               'motivo'               => 'Se requiere reemplazo físico de placa madre.',
                           ]);
        $derivarRes->assertStatus(200)
                   ->assertJsonPath('incidente.estado', 'EN_CURSO')
                   ->assertJsonPath('notificacion.destinatario', 'juan@ctm.com')
                   ->assertJsonPath('notificacion.unidad_especializada', 'Laboratorio Central de Hardware');
    }
}
