<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriasSeeder extends Seeder
{
    public function run()
    {

        // ── 2. Categorías Oficiales ─────────────────────────────────────────────

        $cAICO        = Categoria::create(['nombre' => 'AICO - Atención a Usuarios']);
        $cComputadora = Categoria::create(['nombre' => 'Computadora y Hardware']);
        $cImpresora   = Categoria::create(['nombre' => 'Impresoras y Fotocopiadoras']);
        $cRedes       = Categoria::create(['nombre' => 'Redes e Internet']);
        $cWIFI        = Categoria::create(['nombre' => 'WIFI y Conectividad']);
        $cTelefonia   = Categoria::create(['nombre' => 'Telefonía e Internos']);
        $cK2B         = Categoria::create(['nombre' => 'K2B y Sistemas ERP']);
        $cSoftware    = Categoria::create(['nombre' => 'Software y Aplicaciones']);
        $cAccesos     = Categoria::create(['nombre' => 'Accesos y Seguridad']);
    }
}