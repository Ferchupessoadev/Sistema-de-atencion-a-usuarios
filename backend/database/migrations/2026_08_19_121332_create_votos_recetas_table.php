<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('votos_recetas', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['UTIL', 'NO_UTIL']);
            $table->foreignId('id_usuario')->constrained('users')->cascadeOnDelete();
            $table->foreignId('id_receta')->constrained('recetas')->cascadeOnDelete();
            $table->timestamps();

            // Un usuario solo puede tener un voto activo por receta
            $table->unique(['id_usuario', 'id_receta']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('votos_recetas');
    }
};