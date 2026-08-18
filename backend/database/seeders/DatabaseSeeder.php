<?php

namespace Database\Seeders;

use App\Models\Boceto;
use App\Models\Categoria;
use App\Models\Consulta;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // ── 1. Usuarios ──────────────────────────────────────────────────

        $admin = User::create([
            'nombre'     => 'Administrador CTM',
            'correo'     => 'admin@ctm.com',
            'contrasena' => Hash::make('admin123'),
            'es_tecnico' => true,
        ]);

        $tecnico1 = User::create([
            'nombre'     => 'Técnico Soporte',
            'correo'     => 'tecnico@ctm.com',
            'contrasena' => Hash::make('tecnico123'),
            'es_tecnico' => true,
        ]);

        $usuario1 = User::create([
            'nombre'     => 'Juan Pérez',
            'correo'     => 'juan@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $usuario2 = User::create([
            'nombre'     => 'María González',
            'correo'     => 'maria@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        // ── 2. Categorías ────────────────────────────────────────────────

        $catHardware = Categoria::create(['nombre' => 'Hardware']);
        $catSoftware = Categoria::create(['nombre' => 'Software']);
        $catRed      = Categoria::create(['nombre' => 'Red y Conectividad']);
        $catAcceso   = Categoria::create(['nombre' => 'Acceso y Permisos']);
        $catImpresion = Categoria::create(['nombre' => 'Impresión']);

        // ── 3. Recetas ───────────────────────────────────────────────────

        $receta1 = Receta::create([
            'titulo'      => 'Reinicio de drivers de impresora',
            'solucion'    => "1. Ir a Panel de Control > Dispositivos e impresoras\n2. Hacer clic derecho en la impresora afectada\n3. Seleccionar 'Ver qué se está imprimiendo'\n4. Cancelar todos los trabajos pendientes\n5. Reiniciar el servicio 'Spooler de impresión' desde services.msc",
            'id_categoria' => $catImpresion->id,
        ]);

        $receta2 = Receta::create([
            'titulo'      => 'Restablecer contraseña de red WiFi corporativa',
            'solucion'    => "1. Ingresar al portal interno: http://intranet/wifi\n2. Hacer clic en 'Olvidé mi contraseña'\n3. Verificar identidad con código enviado al correo\n4. Establecer nueva contraseña siguiendo política (min. 8 caracteres, mayúsculas, números)\n5. Reconectar el dispositivo",
            'id_categoria' => $catRed->id,
        ]);

        $receta3 = Receta::create([
            'titulo'      => 'Limpiar caché del navegador corporativo',
            'solucion'    => "1. Abrir Chrome/Edge\n2. Presionar Ctrl+Shift+Delete\n3. Seleccionar 'Todo el tiempo' como rango\n4. Marcar: Caché, Cookies, Historial\n5. Hacer clic en 'Borrar datos'\n6. Reiniciar el navegador",
            'id_categoria' => $catSoftware->id,
        ]);

        // ── 4. Consultas ─────────────────────────────────────────────────

        $consulta1 = Consulta::create([
            'descripcion' => 'Mi impresora no responde al imprimir documentos PDF desde el área de contabilidad.',
            'id_usuario'  => $usuario1->id,
        ]);

        $consulta2 = Consulta::create([
            'descripcion' => 'No puedo conectarme a la red WiFi desde mi laptop nueva.',
            'id_usuario'  => $usuario2->id,
        ]);

        // ── 5. Incidentes ────────────────────────────────────────────────

        // Incidente ABIERTO, sin técnico asignado
        Incidente::create([
            'descripcion'  => 'Impresora HP LaserJet no imprime desde equipo de contabilidad. Se enviaron 3 trabajos y ninguno salió.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_ALTA,
            'id_usuario'   => $usuario1->id,
            'id_consulta'  => $consulta1->id,
            'id_categoria' => $catImpresion->id,
        ]);

        // Incidente EN_CURSO, técnico asignado
        $incEn = Incidente::create([
            'descripcion'  => 'Laptop HP nueva no detecta la red WiFi corporativa "CTM-Corp" aunque otros dispositivos sí se conectan.',
            'estado'       => Incidente::ESTADO_EN_CURSO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'id_usuario'   => $usuario2->id,
            'id_consulta'  => $consulta2->id,
            'id_tecnico'   => $tecnico1->id,
            'id_categoria' => $catRed->id,
        ]);

        // Incidente RESUELTO con receta aplicada
        $incResuelto = Incidente::create([
            'descripcion'  => 'El portal web de facturación se carga muy lento y a veces muestra error 502.',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'resolucion'   => now()->subHours(2),
            'id_usuario'   => $usuario1->id,
            'id_tecnico'   => $admin->id,
            'id_categoria' => $catSoftware->id,
            'id_receta'    => $receta3->id,
        ]);

        // Incrementar usos de la receta aplicada
        $receta3->incrementarUsos();

        // Segundo incidente abierto de usuario1 (para testear RN-005)
        Incidente::create([
            'descripcion'  => 'No puedo acceder a la carpeta compartida \\servidor\contabilidad desde mi equipo.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_BAJA,
            'id_usuario'   => $usuario1->id,
            'id_categoria' => $catAcceso->id,
        ]);

        // ── 6. Bocetos ───────────────────────────────────────────────────

        Boceto::create([
            'titulo'         => 'Guía preliminar: problemas de pantalla azul',
            'solucion_previa' => "Verificar drivers de video actualizados.\nRevisar temperatura del procesador.\nCorrer sfc /scannow en CMD como administrador.\nConsultar visor de eventos (eventvwr.msc) para código de error.",
        ]);

        Boceto::create([
            'titulo'         => 'Procedimiento tentativo: migración de cuentas',
            'solucion_previa' => "Exportar perfil de usuario desde Configuración > Cuentas.\nRealizar backup de Documentos, Escritorio y Descargas.\nCrear nueva cuenta en dominio.\nImportar perfil.\nVerificar accesos a recursos de red.",
        ]);

        $this->command->info('✅ Seeder completado — datos de prueba cargados exitosamente.');
    }
}
