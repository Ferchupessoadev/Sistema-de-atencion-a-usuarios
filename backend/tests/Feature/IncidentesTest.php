<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class IncidentesTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function crearUsuario(bool $esTecnico = false, array $overrides = []): User
    {
        $attributes = array_merge([
            'nombre'     => $esTecnico ? 'Técnico '.uniqid() : 'Usuario '.uniqid(),
            'correo'     => ($esTecnico ? 'tecnico_' : 'usuario_').uniqid().'@test.com',
            'contrasena' => Hash::make('password123'),
            'es_tecnico' => $esTecnico,
        ], $overrides);

        $user = User::create($attributes);
        $user->assignRole($esTecnico ? 'tecnico' : 'default');

        return $user;
    }

    private function crearCategoria(string $nombre = 'Soporte General'): Categoria
    {
        return Categoria::create(['nombre' => $nombre . '_' . uniqid()]);
    }

    private function crearReceta(int $idCategoria): Receta
    {
        return Receta::create([
            'titulo'       => 'Guía de solución '.uniqid(),
            'solucion'     => 'Pasos detallados para resolver el problema.',
            'id_categoria' => $idCategoria,
            'usos'         => 0,
        ]);
    }

    // ─── Tests de Listado (GET /api/incidentes) ───────────────────────────────

    /** @test */
    public function test_usuario_comun_puede_listar_solo_sus_incidentes(): void
    {
        $usuario1 = $this->crearUsuario(false);
        $usuario2 = $this->crearUsuario(false);
        $cat      = $this->crearCategoria();

        Incidente::create(['descripcion' => 'Incidente de U1', 'id_usuario' => $usuario1->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Incidente de U2', 'id_usuario' => $usuario2->id, 'id_categoria' => $cat->id]);

        $response = $this->actingAs($usuario1, 'sanctum')
                         ->getJson('/api/incidentes');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data);
        $this->assertEquals('Incidente de U1', $data[0]['descripcion']);
    }

    /** @test */
    public function test_tecnico_puede_listar_todos_los_incidentes(): void
    {
        $tecnico  = $this->crearUsuario(true);
        $usuario1 = $this->crearUsuario(false);
        $usuario2 = $this->crearUsuario(false);
        $cat      = $this->crearCategoria();

        Incidente::create(['descripcion' => 'Incidente A', 'id_usuario' => $usuario1->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Incidente B', 'id_usuario' => $usuario2->id, 'id_categoria' => $cat->id]);

        $response = $this->actingAs($tecnico, 'sanctum')
                         ->getJson('/api/incidentes');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json());
    }

    // ─── Tests de Creación y RN-001 / RN-005 ─────────────────────────────────

    /** @test */
    public function test_usuario_puede_crear_incidente_valido(): void
    {
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        $response = $this->actingAs($usuario, 'sanctum')
                         ->postJson('/api/incidentes', [
                             'descripcion'  => 'La pantalla parpadea constantemente al usar Excel.',
                             'id_categoria' => $cat->id,
                         ]);

        $response->assertStatus(201)
                 ->assertJsonPath('incidente.estado', 'ABIERTO')
                 ->assertJsonPath('incidente.prioridad', 'MEDIA')
                 ->assertJsonPath('incidente.id_usuario', $usuario->id);

        $this->assertDatabaseHas('incidentes', ['descripcion' => 'La pantalla parpadea constantemente al usar Excel.']);
    }

    /** @test */
    public function test_rn_001_tecnico_debe_especificar_prioridad_y_categoria(): void
    {
        $tecnico = $this->crearUsuario(true);
        $cat     = $this->crearCategoria();

        // Sin prioridad → debe fallar por RN-001
        $response = $this->actingAs($tecnico, 'sanctum')
                         ->postJson('/api/incidentes', [
                             'descripcion'  => 'Falla en el switch principal del rack de servidores.',
                             'id_categoria' => $cat->id,
                             // falta 'prioridad'
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['prioridad']);

        // Con prioridad y categoría → debe pasar
        $responseOk = $this->actingAs($tecnico, 'sanctum')
                           ->postJson('/api/incidentes', [
                               'descripcion'  => 'Falla en el switch principal del rack de servidores.',
                               'id_categoria' => $cat->id,
                               'prioridad'    => 'ALTA',
                           ]);

        $responseOk->assertStatus(201)
                   ->assertJsonPath('incidente.prioridad', 'ALTA');
    }

    /** @test */
    public function test_rn_005_bloquea_creacion_si_usuario_tiene_3_o_mas_incidentes_abiertos(): void
    {
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        // Crear 3 incidentes ABIERTOS
        Incidente::create(['descripcion' => 'Incidente 1', 'estado' => 'ABIERTO', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Incidente 2', 'estado' => 'ABIERTO', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Incidente 3', 'estado' => 'ABIERTO', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);

        // Intentar crear el 4to incidente
        $response = $this->actingAs($usuario, 'sanctum')
                         ->postJson('/api/incidentes', [
                             'descripcion'  => 'No puedo crear este 4to incidente.',
                             'id_categoria' => $cat->id,
                         ]);

        $response->assertStatus(422)
                 ->assertJsonPath('errors.id_usuario.0', 'Límite alcanzado: no se permiten más de 3 incidentes en estado ABIERTO simultáneamente.');
    }

    /** @test */
    public function test_rn_005_permite_crear_si_los_anteriores_estan_resueltos(): void
    {
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        // 2 resueltos + 2 abiertos = total 4 en BD pero solo 2 abiertos
        Incidente::create(['descripcion' => 'Inc Resuelto 1', 'estado' => 'RESUELTO', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Inc Resuelto 2', 'estado' => 'RESUELTO', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Inc Abierto 1',  'estado' => 'ABIERTO',  'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Inc Abierto 2',  'estado' => 'ABIERTO',  'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);

        $response = $this->actingAs($usuario, 'sanctum')
                         ->postJson('/api/incidentes', [
                             'descripcion'  => 'Este 3er incidente abierto sí está permitido.',
                             'id_categoria' => $cat->id,
                         ]);

        $response->assertStatus(201);
    }

    // ─── Tests de Detalle (GET /api/incidentes/{id}) ─────────────────────────

    /** @test */
    public function test_usuario_no_puede_ver_incidente_ajeno(): void
    {
        $usuario1 = $this->crearUsuario(false);
        $usuario2 = $this->crearUsuario(false);
        $cat      = $this->crearCategoria();

        $inc = Incidente::create(['descripcion' => 'Privado de U2', 'id_usuario' => $usuario2->id, 'id_categoria' => $cat->id]);

        $response = $this->actingAs($usuario1, 'sanctum')
                         ->getJson("/api/incidentes/{$inc->id}");

        $response->assertStatus(403);
    }

    /** @test */
    public function test_tecnico_puede_ver_cualquier_incidente(): void
    {
        $tecnico = $this->crearUsuario(true);
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        $inc = Incidente::create(['descripcion' => 'Incidente de usuario', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);

        $response = $this->actingAs($tecnico, 'sanctum')
                         ->getJson("/api/incidentes/{$inc->id}");

        $response->assertStatus(200)
                 ->assertJsonPath('descripcion', 'Incidente de usuario');
    }

    // ─── Tests de Actualización y RN-002 ─────────────────────────────────────

    /** @test */
    public function test_rn_002_tecnico_no_puede_marcar_resuelto_sin_receta_ni_solucion(): void
    {
        $tecnico = $this->crearUsuario(true);
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Problema pendiente',
            'estado'       => 'EN_CURSO',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        // Intentar resolver sin solución ni receta
        $response = $this->actingAs($tecnico, 'sanctum')
                         ->putJson("/api/incidentes/{$inc->id}", [
                             'estado' => 'RESUELTO',
                         ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['resolucion']);
    }

    /** @test */
    public function test_rn_002_tecnico_puede_marcar_resuelto_con_receta_e_incrementa_usos(): void
    {
        $tecnico = $this->crearUsuario(true);
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();
        $receta  = $this->crearReceta($cat->id);

        $this->assertEquals(0, $receta->usos);

        $inc = Incidente::create([
            'descripcion'  => 'Problema con solución conocida',
            'estado'       => 'EN_CURSO',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $response = $this->actingAs($tecnico, 'sanctum')
                         ->putJson("/api/incidentes/{$inc->id}", [
                             'estado'    => 'RESUELTO',
                             'id_receta' => $receta->id,
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('incidente.estado', 'RESUELTO')
                 ->assertJsonPath('incidente.id_receta', $receta->id);

        $this->assertNotNull($response->json('incidente.resolucion'));
        $this->assertEquals(1, $receta->fresh()->usos);
    }

    /** @test */
    public function test_rn_002_tecnico_puede_marcar_resuelto_con_solucion_texto_y_crea_receta_reutilizable(): void
    {
        $tecnico = $this->crearUsuario(true);
        $usuario = $this->crearUsuario(false);
        $cat     = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Problema resuelto manualmente',
            'estado'       => 'EN_CURSO',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $response = $this->actingAs($tecnico, 'sanctum')
                         ->putJson("/api/incidentes/{$inc->id}", [
                             'estado'         => 'RESUELTO',
                             'titulo_receta'  => 'Procedimiento de reinicio de Apache',
                             'solucion_texto' => "1. Detener servicio Apache\n2. Renovar certificado SSL\n3. Iniciar servicio",
                         ]);

        $response->assertStatus(200)->assertJsonPath('incidente.estado', 'RESUELTO');

        $this->assertNotNull($response->json('incidente.resolucion'));
        $this->assertDatabaseHas('recetas', [
            'titulo'       => 'Procedimiento de reinicio de Apache',
            'id_categoria' => $cat->id,
            'usos'         => 1,
        ]);
    }


    // ─── Tests de Derivación y RN-003 ─────────────────────────────────────────

    /** @test */
    public function test_rn_003_tecnico_puede_derivar_incidente_y_genera_notificacion(): void
    {
        $tecnico1 = $this->crearUsuario(true);
        $tecnico2 = $this->crearUsuario(true);
        $usuario  = $this->crearUsuario(false);
        $cat      = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Falla en firewall corporativo que requiere revisión de redes avanzadas.',
            'estado'       => 'ABIERTO',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $response = $this->actingAs($tecnico1, 'sanctum')
                         ->putJson("/api/incidentes/{$inc->id}/derivar", [
                             'id_tecnico'           => $tecnico2->id,
                             'unidad_especializada' => 'Área de Seguridad y Redes',
                             'motivo'               => 'Requiere acceso nivel 3 a configuraciones de firewall perimetral.',
                         ]);

        $response->assertStatus(200)
                 ->assertJsonPath('incidente.id_tecnico', $tecnico2->id)
                 ->assertJsonPath('incidente.estado', 'EN_CURSO')
                 ->assertJsonPath('notificacion.destinatario', $usuario->correo)
                 ->assertJsonPath('notificacion.unidad_especializada', 'Área de Seguridad y Redes');
    }

    /** @test */
    public function test_usuario_comun_no_puede_derivar_incidente(): void
    {
        $usuario1 = $this->crearUsuario(false);
        $usuario2 = $this->crearUsuario(false);
        $cat      = $this->crearCategoria();

        $inc = Incidente::create(['descripcion' => 'Incidente de U1', 'id_usuario' => $usuario1->id, 'id_categoria' => $cat->id]);

        $response = $this->actingAs($usuario1, 'sanctum')
                         ->putJson("/api/incidentes/{$inc->id}/derivar", [
                             'motivo' => 'Derivar a soporte',
                         ]);

        $response->assertStatus(403);
    }

    /** @test */
    public function test_crear_incidente_guarda_interno_telefonico(): void
    {
        $usuario = $this->crearUsuario(false);
        $usuario->update(['interno' => '3210']);
        $cat     = $this->crearCategoria();

        // 1. Usar interno provisto en request
        $res = $this->actingAs($usuario, 'sanctum')
                    ->postJson('/api/incidentes', [
                        'descripcion'  => 'Problema con interno específico',
                        'id_categoria' => $cat->id,
                        'interno'      => '3777',
                    ]);

        $res->assertStatus(201)
            ->assertJsonPath('incidente.interno', '3777');

        // 2. Fallback al interno por defecto del usuario
        $res2 = $this->actingAs($usuario, 'sanctum')
                     ->postJson('/api/incidentes', [
                         'descripcion'  => 'Otro problema sin especificar interno',
                         'id_categoria' => $cat->id,
                     ]);

        $res2->assertStatus(201)
             ->assertJsonPath('incidente.interno', '3210');
    }
}

