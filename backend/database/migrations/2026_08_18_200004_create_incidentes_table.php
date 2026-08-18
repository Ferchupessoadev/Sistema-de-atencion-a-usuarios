<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidentes', function (Blueprint $table) {
            $table->id();
            $table->text('descripcion');

            // ENUM estado
            $table->enum('estado', ['ABIERTO', 'EN_CURSO', 'RESUELTO'])
                  ->default('ABIERTO');

            // ENUM prioridad (RN-001: requerido cuando lo crea un técnico)
            $table->enum('prioridad', ['BAJA', 'MEDIA', 'ALTA'])
                  ->default('MEDIA');

            // Fecha/hora de resolución (nullable hasta que se cierre)
            $table->dateTime('resolucion')->nullable();

            // FK requerida: usuario que abrió el incidente
            $table->foreignId('id_usuario')
                  ->constrained('users')
                  ->restrictOnDelete();

            // FK opcional: consulta previa que derivó en incidente
            $table->foreignId('id_consulta')
                  ->nullable()
                  ->constrained('consultas')
                  ->nullOnDelete();

            // FK opcional: técnico asignado
            $table->foreignId('id_tecnico')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // FK requerida: categoría del incidente
            $table->foreignId('id_categoria')
                  ->constrained('categorias')
                  ->restrictOnDelete();

            // FK opcional: receta aplicada para resolución
            $table->foreignId('id_receta')
                  ->nullable()
                  ->constrained('recetas')
                  ->nullOnDelete();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidentes');
    }
};
