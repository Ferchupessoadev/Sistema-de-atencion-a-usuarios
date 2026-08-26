<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Incidente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    private function crearUsuario(bool $esTecnico = false, array $overrides = []): User
    {
        $user = User::create(array_merge([
            'nombre'     => 'Usuario Test',
            'correo'     => 'usuario_' . uniqid() . '@ctm.com',
            'contrasena' => Hash::make('Password123'),
            'es_tecnico' => $esTecnico,
        ], $overrides));

        $user->assignRole($esTecnico ? 'tecnico' : 'default');

        return $user;
    }

    /** @test */
    public function test_registro_rechaza_contrasenas_debiles(): void
    {
        // Menos de 8 caracteres
        $res1 = $this->postJson('/api/register', [
            'nombre'     => 'Test User',
            'correo'     => 'test1@ctm.com',
            'contrasena' => '12345',
        ]);
        $res1->assertStatus(422)->assertJsonValidationErrors(['contrasena']);

        // Solo números
        $res2 = $this->postJson('/api/register', [
            'nombre'     => 'Test User',
            'correo'     => 'test2@ctm.com',
            'contrasena' => '12345678',
        ]);
        $res2->assertStatus(422)->assertJsonValidationErrors(['contrasena']);

        // Solo letras
        $res3 = $this->postJson('/api/register', [
            'nombre'     => 'Test User',
            'correo'     => 'test3@ctm.com',
            'contrasena' => 'sololetras',
        ]);
        $res3->assertStatus(422)->assertJsonValidationErrors(['contrasena']);

        // Contraseña válida con letras y números (>= 8 chars)
        $resValido = $this->postJson('/api/register', [
            'nombre'     => 'Test User',
            'correo'     => 'valido@ctm.com',
            'contrasena' => 'Valida1234',
        ]);
        $resValido->assertStatus(201);
    }

    /** @test */
    public function test_login_revoca_tokens_anteriores_para_sesion_unica(): void
    {
        $user = $this->crearUsuario(false, ['correo' => 'login@ctm.com']);

        // Primer login
        $res1 = $this->postJson('/api/login', [
            'correo'     => 'login@ctm.com',
            'contrasena' => 'Password123',
        ]);
        $res1->assertStatus(200);
        $token1 = $res1->json('token');

        $this->assertDatabaseCount('personal_access_tokens', 1);

        // Segundo login (debe revocar el token previo)
        $res2 = $this->postJson('/api/login', [
            'correo'     => 'login@ctm.com',
            'contrasena' => 'Password123',
        ]);
        $res2->assertStatus(200);
        $token2 = $res2->json('token');

        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertNotEquals($token1, $token2);
    }

    /** @test */
    public function test_sanitizacion_html_elimina_scripts_maliciosos_en_incidentes(): void
    {
        $user = $this->crearUsuario(false);
        $cat = Categoria::create(['nombre' => 'General']);

        $payloadMalicioso = '<p>Error normal</p><script>alert("XSS")</script><img src="x" onerror="stealCookies()">';

        $res = $this->actingAs($user, 'sanctum')->postJson('/api/incidentes', [
            'id_categoria' => $cat->id,
            'descripcion'  => $payloadMalicioso,
        ]);

        $res->assertStatus(201);

        $inc = Incidente::first();
        $this->assertStringNotContainsString('<script>', $inc->descripcion);
        $this->assertStringNotContainsString('onerror', $inc->descripcion);
        $this->assertStringContainsString('<p>Error normal</p>', $inc->descripcion);
    }

    /** @test */
    public function test_exportar_csv_neutraliza_inyeccion_de_formulas(): void
    {
        $tecnico = $this->crearUsuario(true);
        $cat = Categoria::create(['nombre' => 'Redes']);

        Incidente::create([
            'id_usuario'   => $tecnico->id,
            'id_categoria' => $cat->id,
            'descripcion'  => '=SUM(1+1)*cmd|"/C calc"!A0',
            'estado'       => 'ABIERTO',
            'prioridad'    => 'MEDIA',
        ]);

        $res = $this->actingAs($tecnico, 'sanctum')->get('/api/reportes/incidentes/exportar');
        $res->assertStatus(200);

        $content = $res->streamedContent();
        // Debe prefijar con comilla simple para que Excel no ejecute la fórmula
        $this->assertStringContainsString("\"'=SUM(1+1)*cmd|", $content);
    }

    /** @test */
    public function test_rate_limiting_en_endpoint_de_login(): void
    {
        $this->crearUsuario(false, ['correo' => 'throttle@ctm.com']);

        // Ejecutar hasta alcanzar el límite (15 por minuto)
        for ($i = 0; $i < 15; $i++) {
            $this->postJson('/api/login', [
                'correo'     => 'throttle@ctm.com',
                'contrasena' => 'Password123',
            ]);
        }

        // La petición 16 debe ser bloqueada con 429 Too Many Requests
        $bloqueado = $this->postJson('/api/login', [
            'correo'     => 'throttle@ctm.com',
            'contrasena' => 'Password123',
        ]);

        $bloqueado->assertStatus(429);
    }

    /** @test */
    public function test_tecnico_puede_gestionar_crud_de_categorias(): void
    {
        $tecnico = $this->crearUsuario(true);
        $usuario = $this->crearUsuario(false);

        // 1. Técnico crea categoría
        $resCrear = $this->actingAs($tecnico, 'sanctum')->postJson('/api/categorias', [
            'nombre' => 'Nueva Categoria Test',
        ]);
        $resCrear->assertStatus(201);
        $catId = $resCrear->json('categoria.id');

        // 2. Usuario común no puede editar ni borrar
        $this->actingAs($usuario, 'sanctum')
            ->putJson("/api/categorias/{$catId}", ['nombre' => 'Hacked'])
            ->assertStatus(403);

        $this->actingAs($usuario, 'sanctum')
            ->deleteJson("/api/categorias/{$catId}")
            ->assertStatus(403);

        // 3. Técnico edita categoría
        $resEdit = $this->actingAs($tecnico, 'sanctum')
            ->putJson("/api/categorias/{$catId}", ['nombre' => 'Categoria Actualizada']);
        $resEdit->assertStatus(200);

        // 4. Técnico elimina categoría sin dependencias
        $resDel = $this->actingAs($tecnico, 'sanctum')
            ->deleteJson("/api/categorias/{$catId}");
        $resDel->assertStatus(200);
        $this->assertDatabaseMissing('categorias', ['id' => $catId]);
    }

    /** @test */
    public function test_usuario_puede_subir_y_eliminar_foto_de_perfil(): void
    {
        \Illuminate\Support\Facades\Storage::fake('public');
        $usuario = $this->crearUsuario(false);

        // Crear archivo de imagen simulado
        $file = \Illuminate\Http\UploadedFile::fake()->create('avatar.jpg', 50, 'image/jpeg');

        // 1. Subir foto
        $res = $this->actingAs($usuario, 'sanctum')
            ->postJson('/api/profile/foto', [
                'foto' => $file,
            ]);

        $res->assertStatus(200)
            ->assertJsonPath('message', 'Foto de perfil optimizada y actualizada correctamente.');

        $this->assertNotNull($res->json('foto_url'));
        $usuarioFresh = $usuario->fresh();
        $this->assertNotNull($usuarioFresh->foto);
        $this->assertEquals(1, $usuarioFresh->getMedia('avatars')->count());

        // 2. Eliminar foto
        $resDel = $this->actingAs($usuario, 'sanctum')
            ->deleteJson('/api/profile/foto');

        $resDel->assertStatus(200);
        $this->assertNull($usuario->fresh()->foto);
        $this->assertEquals(0, $usuario->fresh()->getMedia('avatars')->count());
    }
}
