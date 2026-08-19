<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Agregar interno a users
        Schema::table('users', function (Blueprint $table) {
            $table->string('interno', 20)->nullable()->after('correo');
        });

        // 2. Agregar interno a incidentes
        Schema::table('incidentes', function (Blueprint $table) {
            $table->string('interno', 20)->nullable()->after('id_usuario');
        });

        // 3. Agregar keywords y votos a recetas
        Schema::table('recetas', function (Blueprint $table) {
            $table->text('keywords')->nullable()->after('solucion');
            $table->unsignedBigInteger('votos_util')->default(0)->after('usos');
            $table->unsignedBigInteger('votos_no_util')->default(0)->after('votos_util');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('interno');
        });

        Schema::table('incidentes', function (Blueprint $table) {
            $table->dropColumn('interno');
        });

        Schema::table('recetas', function (Blueprint $table) {
            $table->dropColumn(['keywords', 'votos_util', 'votos_no_util']);
        });
    }
};
