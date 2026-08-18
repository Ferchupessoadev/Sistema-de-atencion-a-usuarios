<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private function crearUsuario(array $overrides = []): User
    {
        return User::create(array_merge([
            'nombre'     => 'Juan Pérez',
            'correo'     => 'juan@example.com',
            'contrasena' => Hash::make('password123'),
            'es_tecnico' => false,
        ], $overrides));
    }

    // ─── Tests de Registro ────────────────────────────────────────────────────

    /** @test */
    public function test_registro_de_usuario_exitoso(): void
    {
        $response = $this->postJson('/api/register', [
            'nombre'     => 'Ana García',
            'correo'     => 'ana@example.com',
            'contrasena' => 'secreta123',
            'es_tecnico' => false,
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure([
                     'message', 'token', 'token_type',
                     'user' => ['id', 'nombre', 'correo', 'es_tecnico'],
                 ])
                 ->assertJsonPath('user.correo', 'ana@example.com')
                 ->assertJsonPath('user.es_tecnico', false);

        $this->assertDatabaseHas('users', ['correo' => 'ana@example.com']);
    }

    /** @test */
    public function test_registro_falla_con_correo_duplicado(): void
    {
        $this->crearUsuario(['correo' => 'dup@example.com']);

        $response = $this->postJson('/api/register', [
            'nombre'     => 'Otro Usuario',
            'correo'     => 'dup@example.com',
            'contrasena' => 'password123',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['correo']);
    }

    /** @test */
    public function test_registro_falla_sin_campos_requeridos(): void
    {
        $response = $this->postJson('/api/register', []);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['nombre', 'correo', 'contrasena']);
    }

    // ─── Tests de Login ───────────────────────────────────────────────────────

    /** @test */
    public function test_login_valido_devuelve_token_y_rol(): void
    {
        $this->crearUsuario([
            'correo'     => 'user@test.com',
            'contrasena' => Hash::make('mipassword'),
            'es_tecnico' => false,
        ]);

        $response = $this->postJson('/api/login', [
            'correo'     => 'user@test.com',
            'contrasena' => 'mipassword',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'message', 'token', 'token_type',
                     'user' => ['id', 'nombre', 'correo', 'es_tecnico'],
                 ])
                 ->assertJsonPath('user.es_tecnico', false);

        $this->assertNotEmpty($response->json('token'));
    }

    /** @test */
    public function test_login_tecnico_devuelve_es_tecnico_true(): void
    {
        $this->crearUsuario([
            'correo'     => 'tecnico@test.com',
            'contrasena' => Hash::make('tecnico123'),
            'es_tecnico' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'correo'     => 'tecnico@test.com',
            'contrasena' => 'tecnico123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('user.es_tecnico', true);
    }

    /** @test */
    public function test_login_invalido_con_password_incorrecta(): void
    {
        $this->crearUsuario(['correo' => 'real@test.com']);

        $response = $this->postJson('/api/login', [
            'correo'     => 'real@test.com',
            'contrasena' => 'password_incorrecta',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['correo']);
    }

    /** @test */
    public function test_login_invalido_con_correo_inexistente(): void
    {
        $response = $this->postJson('/api/login', [
            'correo'     => 'noexiste@test.com',
            'contrasena' => 'cualquiera',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['correo']);
    }

    // ─── Tests de Rutas Protegidas ────────────────────────────────────────────

    /** @test */
    public function test_ruta_user_requiere_autenticacion(): void
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }

    /** @test */
    public function test_ruta_user_autenticada_devuelve_datos(): void
    {
        $user = $this->crearUsuario([
            'nombre' => 'María López',
            'correo' => 'maria@test.com',
        ]);

        $response = $this->actingAs($user, 'sanctum')
                         ->getJson('/api/user');

        $response->assertStatus(200)
                 ->assertJsonPath('nombre', 'María López')
                 ->assertJsonPath('correo', 'maria@test.com');
    }

    /** @test */
    public function test_logout_revoca_token(): void
    {
        $user = $this->crearUsuario();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer {$token}")
                         ->postJson('/api/logout');

        $response->assertStatus(200)
                 ->assertJsonPath('message', 'Sesión cerrada exitosamente.');

        // Verificar que el token fue revocado
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }
}
