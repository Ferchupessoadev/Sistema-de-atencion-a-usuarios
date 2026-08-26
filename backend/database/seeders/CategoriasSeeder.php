<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriasSeeder extends Seeder
{
    public function run()
    {

        // ── Categorías Oficiales de Incidentes y Soluciones ────────────────────
        $cComputadora = Categoria::create(['nombre' => 'Computadora y Hardware', 'icono' => '💻']);
        $cImpresora   = Categoria::create(['nombre' => 'Impresoras y Fotocopiadoras', 'icono' => '🖨️']);
        $cRedes       = Categoria::create(['nombre' => 'Redes e Internet', 'icono' => '🌐']);
        $cWIFI        = Categoria::create(['nombre' => 'WIFI y Conectividad', 'icono' => '📶']);
        $cTelefonia   = Categoria::create(['nombre' => 'Telefonía e Internos', 'icono' => '📞']);
        $cK2B         = Categoria::create(['nombre' => 'K2B y Sistemas ERP', 'icono' => '🏢']);
        $cSoftware    = Categoria::create(['nombre' => 'Software y Aplicaciones', 'icono' => '📦']);
        $cAccesos     = Categoria::create(['nombre' => 'Accesos y Seguridad', 'icono' => '🔒']);
    }
}