<?php

namespace Tests\Feature;

use App\Models\Boceto;
use App\Models\Categoria;
use App\Models\Consulta;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ModelosTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function crearUsuario(bool $esTecnico = false): User
    {
        $user = User::create([
            'nombre'     => $esTecnico ? 'Técnico Test' : 'Usuario Test',
            'correo'     => $esTecnico ? 'tecnico_'.uniqid().'@test.com' : 'usuario_'.uniqid().'@test.com',
            'contrasena' => Hash::make('password123'),
            'es_tecnico' => $esTecnico,
        ]);

        $user->assignRole($esTecnico ? 'tecnico' : 'default');

        return $user;
    }

    private function crearCategoria(string $nombre = 'Software'): Categoria
    {
        return Categoria::create(['nombre' => $nombre . '_' . uniqid()]);
    }

    // ─── Tests: Migraciones & Creación de Registros ───────────────────────────

    /** @test */
    public function test_se_puede_crear_categoria(): void
    {
        $cat = Categoria::create(['nombre' => 'Hardware']);
        $this->assertDatabaseHas('categorias', ['nombre' => 'Hardware']);
        $this->assertNotNull($cat->id);
    }

    /** @test */
    public function test_se_puede_crear_receta(): void
    {
        $cat = $this->crearCategoria();
        $receta = Receta::create([
            'titulo'       => 'Reinicio de red',
            'solucion'     => 'Apagar y encender el router.',
            'id_categoria' => $cat->id,
        ]);
        $this->assertDatabaseHas('recetas', ['titulo' => 'Reinicio de red']);
        $this->assertEquals(0, $receta->usos);
    }

    /** @test */
    public function test_se_puede_crear_incidente_con_estado_abierto_por_defecto(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Error al abrir Excel.',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $this->assertEquals(Incidente::ESTADO_ABIERTO, $inc->estado);
        $this->assertEquals(Incidente::PRIORIDAD_MEDIA, $inc->prioridad);
        $this->assertNull($inc->resolucion);
    }

    /** @test */
    public function test_se_puede_crear_boceto(): void
    {
        $boceto = Boceto::create([
            'titulo'         => 'Draft pantalla azul',
            'solucion_previa' => 'Verificar drivers.',
        ]);
        $this->assertDatabaseHas('bocetos', ['titulo' => 'Draft pantalla azul']);
    }

    // ─── Tests: Relaciones Eloquent ───────────────────────────────────────────

    /** @test */
    public function test_usuario_tiene_muchos_incidentes(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = $this->crearCategoria();

        Incidente::create(['descripcion' => 'Inc 1', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'Inc 2', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);

        $this->assertCount(2, $usuario->incidentes);
    }

    /** @test */
    public function test_incidente_pertenece_a_usuario(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Inc test',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $this->assertEquals($usuario->id, $inc->usuario->id);
        $this->assertEquals($usuario->nombre, $inc->usuario->nombre);
    }

    /** @test */
    public function test_incidente_pertenece_a_categoria(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = Categoria::create(['nombre' => 'Red']);

        $inc = Incidente::create([
            'descripcion'  => 'Sin internet',
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $this->assertEquals('Red', $inc->categoria->nombre);
    }

    /** @test */
    public function test_incidente_puede_tener_tecnico_asignado(): void
    {
        $usuario = $this->crearUsuario();
        $tecnico = $this->crearUsuario(true);
        $cat     = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Problema hardware',
            'estado'       => Incidente::ESTADO_EN_CURSO,
            'id_usuario'   => $usuario->id,
            'id_tecnico'   => $tecnico->id,
            'id_categoria' => $cat->id,
        ]);

        $this->assertEquals($tecnico->id, $inc->tecnico->id);
        $this->assertTrue($inc->tecnico->es_tecnico);
    }

    /** @test */
    public function test_receta_pertenece_a_categoria_y_tiene_usos(): void
    {
        $cat    = $this->crearCategoria();
        $receta = Receta::create([
            'titulo'       => 'Fix WiFi',
            'solucion'     => 'Reiniciar adaptador.',
            'id_categoria' => $cat->id,
        ]);

        $this->assertEquals($cat->id, $receta->categoria->id);
        $this->assertEquals(0, $receta->usos);

        $receta->incrementarUsos();
        $this->assertEquals(1, $receta->fresh()->usos);
    }

    /** @test */
    public function test_categoria_tiene_muchas_recetas_e_incidentes(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = Categoria::create(['nombre' => 'Impresión']);

        Receta::create(['titulo' => 'Fix impresora 1', 'solucion' => '...', 'id_categoria' => $cat->id]);
        Receta::create(['titulo' => 'Fix impresora 2', 'solucion' => '...', 'id_categoria' => $cat->id]);

        Incidente::create(['descripcion' => 'Inc imp', 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);

        $cat->refresh();
        $this->assertCount(2, $cat->recetas);
        $this->assertCount(1, $cat->incidentes);
    }

    /** @test */
    public function test_incidente_con_receta_aplicada(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = $this->crearCategoria();
        $receta  = Receta::create(['titulo' => 'Solución', 'solucion' => 'Pasos...', 'id_categoria' => $cat->id]);

        $inc = Incidente::create([
            'descripcion'  => 'Problema resuelto',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'resolucion'   => now(),
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
            'id_receta'    => $receta->id,
        ]);

        $this->assertEquals($receta->id, $inc->receta->id);
        $this->assertTrue($inc->estaResuelto());
        $this->assertNotNull($inc->resolucion);
    }

    // ─── Tests: Helper RN-005 ─────────────────────────────────────────────────

    /** @test */
    public function test_contar_incidentes_abiertos_de_usuario(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = $this->crearCategoria();

        // 2 abiertos
        Incidente::create(['descripcion' => 'A1', 'estado' => Incidente::ESTADO_ABIERTO,  'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        Incidente::create(['descripcion' => 'A2', 'estado' => Incidente::ESTADO_ABIERTO,  'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);
        // 1 resuelto (no debe contar)
        Incidente::create(['descripcion' => 'R1', 'estado' => Incidente::ESTADO_RESUELTO, 'id_usuario' => $usuario->id, 'id_categoria' => $cat->id]);

        $this->assertEquals(2, $usuario->contarIncidentesAbiertos());
    }

    /** @test */
    public function test_helper_esta_abierto_y_es_alta_prioridad(): void
    {
        $usuario = $this->crearUsuario();
        $cat     = $this->crearCategoria();

        $inc = Incidente::create([
            'descripcion'  => 'Urgente',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_ALTA,
            'id_usuario'   => $usuario->id,
            'id_categoria' => $cat->id,
        ]);

        $this->assertTrue($inc->estaAbierto());
        $this->assertFalse($inc->estaResuelto());
        $this->assertTrue($inc->esAltaPrioridad());
    }
}
