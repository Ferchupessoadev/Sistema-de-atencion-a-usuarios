<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RecetasYAlertasTest extends TestCase
{
    use RefreshDatabase;

    private function crearUsuario(bool $esTecnico = false): User
    {
        return User::create([
            'nombre'     => $esTecnico ? 'Técnico Test' : 'Usuario Test',
            'correo'     => ($esTecnico ? 'tecnico_' : 'usuario_').uniqid().'@test.com',
            'contrasena' => Hash::make('password123'),
            'es_tecnico' => $esTecnico,
        ]);
    }

    private function crearCategoria(): Categoria
    {
        return Categoria::create(['nombre' => 'Categoría '.uniqid()]);
    }

    // ─── FASE 4: Base de Conocimientos (Recetas) ──────────────────────────────

    /** @test */
    public function test_cualquiera_puede_listar_y_buscar_recetas_publicas(): void
    {
        $cat = $this->crearCategoria();
        Receta::create(['titulo' => 'Solución VPN Cisco', 'solucion' => 'Pasos de VPN', 'id_categoria' => $cat->id]);
        Receta::create(['titulo' => 'Solución Impresora Brother', 'solucion' => 'Pasos de Impresora', 'id_categoria' => $cat->id]);

        // Sin auth
        $res = $this->getJson('/api/recetas');
        $res->assertStatus(200);
        $this->assertCount(2, $res->json());

        // Búsqueda por término
        $searchRes = $this->getJson('/api/recetas?q=Cisco');
        $searchRes->assertStatus(200);
        $this->assertCount(1, $searchRes->json());
        $this->assertEquals('Solución VPN Cisco', $searchRes->json()[0]['titulo']);
    }

    /** @test */
    public function test_tecnico_puede_crear_editar_y_eliminar_recetas(): void
    {
        $tecnico = $this->crearUsuario(true);
        $cat     = $this->crearCategoria();

        // 1. Crear
        $createRes = $this->actingAs($tecnico, 'sanctum')
                          ->postJson('/api/recetas', [
                              'titulo'       => 'Guía de recuperación de clave',
                              'solucion'     => 'Ingresar al portal y solicitar link de reseteo.',
                              'id_categoria' => $cat->id,
                          ]);
        $createRes->assertStatus(201)
                  ->assertJsonPath('receta.titulo', 'Guía de recuperación de clave');

        $recetaId = $createRes->json('receta.id');

        // 2. Editar
        $updateRes = $this->actingAs($tecnico, 'sanctum')
                          ->putJson("/api/recetas/{$recetaId}", [
                              'titulo' => 'Guía de recuperación de clave (Actualizada)',
                          ]);
        $updateRes->assertStatus(200)
                  ->assertJsonPath('receta.titulo', 'Guía de recuperación de clave (Actualizada)');

        // 3. Eliminar
        $deleteRes = $this->actingAs($tecnico, 'sanctum')
                          ->deleteJson("/api/recetas/{$recetaId}");
        $deleteRes->assertStatus(200);

        $this->assertDatabaseMissing('recetas', ['id' => $recetaId]);
    }

    /** @test */
    public function test_usuario_comun_no_puede_crear_editar_ni_eliminar_recetas(): void
    {
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();
        $receta  = Receta::create(['titulo' => 'Receta Protegida', 'solucion' => 'Pasos seguros...', 'id_categoria' => $cat->id]);

        $this->actingAs($usuario, 'sanctum')
             ->postJson('/api/recetas', ['titulo' => 'X', 'solucion' => 'Y', 'id_categoria' => $cat->id])
             ->assertStatus(403);

        $this->actingAs($usuario, 'sanctum')
             ->putJson("/api/recetas/{$receta->id}", ['titulo' => 'Hack'])
             ->assertStatus(403);

        $this->actingAs($usuario, 'sanctum')
             ->deleteJson("/api/recetas/{$receta->id}")
             ->assertStatus(403);
    }

    // ─── FASE 5: Alertas y Notificaciones (RN-003 & RN-004) ───────────────────

    /** @test */
    public function test_rn_003_derivar_guarda_notificacion_en_base_de_datos_para_usuario(): void
    {
        $tecnico = $this->crearUsuario(true);
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Problema con cableado estructurado',
            'estado'       => 'ABIERTO',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $this->actingAs($tecnico, 'sanctum')
             ->putJson("/api/incidentes/{$inc->id}/derivar", [
                 'unidad_especializada' => 'Infraestructura y Redes Físicas',
                 'motivo'               => 'Se requiere crimpeo y prueba de enlace con tester.',
             ])
             ->assertStatus(200);

        // Verificar que el usuario recibió la notificación en BD
        $this->assertEquals(1, $usuario->notifications()->count());
        $notif = $usuario->notifications()->first();
        $this->assertEquals('INCIDENTE_DERIVADO', $notif->data['tipo']);
        $this->assertEquals('Infraestructura y Redes Físicas', $notif->data['unidad_especializada']);

        // Consultar endpoint de notificaciones del usuario
        $notifRes = $this->actingAs($usuario, 'sanctum')
                         ->getJson('/api/notificaciones');
        $notifRes->assertStatus(200)
                 ->assertJsonPath('no_leidas', 1);

        // Marcar como leída
        $this->actingAs($usuario, 'sanctum')
             ->putJson("/api/notificaciones/{$notif->id}/leer")
             ->assertStatus(200);

        $this->assertEquals(0, $usuario->unreadNotifications()->count());
    }

    /** @test */
    public function test_rn_004_comando_artisan_detecta_incidentes_alta_prioridad_mayores_a_2_horas_y_notifica_tecnicos(): void
    {
        $tecnico1 = $this->crearUsuario(true);
        $tecnico2 = $this->crearUsuario(true);
        $usuario  = $this->crearUsuario(false);
        $cat      = $this->crearCategoria();

        // 1. Incidente crítico antiguo (> 2 horas)
        $incCritico = Incidente::create([
            'descripcion'  => 'Servidor de base de datos no responde a consultas.',
            'estado'       => 'ABIERTO',
            'prioridad'    => 'ALTA',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);
        // Forzar created_at a hace 3 horas
        $incCritico->created_at = now()->subHours(3);
        $incCritico->save();

        // 2. Incidente reciente (< 2 horas) que NO debe alertar
        $incReciente = Incidente::create([
            'descripcion'  => 'Impresora sin toner.',
            'estado'       => 'ABIERTO',
            'prioridad'    => 'ALTA',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);
        $incReciente->created_at = now()->subMinutes(30);
        $incReciente->save();

        // Ejecutar comando Artisan RN-004
        $exitCode = Artisan::call('incidentes:revisar-alertas', ['--horas' => 2]);
        $this->assertEquals(0, $exitCode);

        // Ambos técnicos deben haber recibido la notificación
        $this->assertEquals(1, $tecnico1->notifications()->count());
        $this->assertEquals(1, $tecnico2->notifications()->count());

        $alerta = $tecnico1->notifications()->first();
        $this->assertEquals('ALERTA_CRITICA', $alerta->data['tipo']);
        $this->assertEquals($incCritico->id, $alerta->data['incidente_id']);
    }

    /** @test */
    public function test_rn_004_endpoint_alertas_criticas_retorna_incidentes_vencidos_a_tecnicos(): void
    {
        $tecnico = $this->crearUsuario(true);
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        $incVencido = Incidente::create([
            'descripcion'  => 'Caída total de enlace de fibra óptica.',
            'estado'       => 'EN_CURSO',
            'prioridad'    => 'ALTA',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);
        $incVencido->created_at = now()->subHours(4);
        $incVencido->save();

        $res = $this->actingAs($tecnico, 'sanctum')
                    ->getJson('/api/alertas/criticas');

        $res->assertStatus(200)
            ->assertJsonPath('total_criticos', 1)
            ->assertJsonPath('incidentes.0.id', $incVencido->id);

        // Usuario común no puede ver esta consola de alertas
        $this->actingAs($usuario, 'sanctum')
             ->getJson('/api/alertas/criticas')
             ->assertStatus(403);
    }
}
