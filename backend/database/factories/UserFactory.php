<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'nombre'     => fake()->name(),
            'correo'     => fake()->unique()->safeEmail(),
            'interno'    => (string) fake()->numberBetween(3000, 3999),
            'contrasena' => static::$password ??= Hash::make('password123'),
            'es_tecnico' => false,
        ];
    }

    /**
     * Define un estado de técnico.
     */
    public function tecnico(): static
    {
        return $this->state(fn (array $attributes) => [
            'es_tecnico' => true,
        ]);
    }
}
