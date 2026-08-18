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
        // ── 1. Usuarios y Técnicos ──────────────────────────────────────────────

        // Técnicos y Administradores
        $admin = User::create([
            'nombre'     => 'Administrador General CTM',
            'correo'     => 'admin@ctm.com',
            'contrasena' => Hash::make('admin123'),
            'es_tecnico' => true,
        ]);

        $tecnico1 = User::create([
            'nombre'     => 'Esteban Soporte L1',
            'correo'     => 'tecnico@ctm.com',
            'contrasena' => Hash::make('tecnico123'),
            'es_tecnico' => true,
        ]);

        $tecnicoRedes = User::create([
            'nombre'     => 'Marcos Redes y Ciberseguridad',
            'correo'     => 'redes@ctm.com',
            'contrasena' => Hash::make('tecnico123'),
            'es_tecnico' => true,
        ]);

        $tecnicoSistemas = User::create([
            'nombre'     => 'Valeria Administradora de Sistemas',
            'correo'     => 'sistemas@ctm.com',
            'contrasena' => Hash::make('tecnico123'),
            'es_tecnico' => true,
        ]);

        // Usuarios Normales de distintas áreas
        $uJuan = User::create([
            'nombre'     => 'Juan Pérez (Contabilidad)',
            'correo'     => 'juan@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $uMaria = User::create([
            'nombre'     => 'María González (Recursos Humanos)',
            'correo'     => 'maria@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $uCarlos = User::create([
            'nombre'     => 'Carlos Rodríguez (Ventas)',
            'correo'     => 'carlos.ventas@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $uLucia = User::create([
            'nombre'     => 'Lucía Méndez (Compras)',
            'correo'     => 'lucia.compras@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $uDiego = User::create([
            'nombre'     => 'Diego Morales (Logística)',
            'correo'     => 'diego.logistica@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $uAna = User::create([
            'nombre'     => 'Ana Fernández (Marketing)',
            'correo'     => 'ana.marketing@ctm.com',
            'contrasena' => Hash::make('usuario123'),
            'es_tecnico' => false,
        ]);

        $uGmail = User::create([
            'nombre'     => 'Usuario Gmail Demo',
            'correo'     => 'usuario.demo@gmail.com',
            'google_id'  => 'google_oauth_demo_12345',
            'avatar'     => 'https://lh3.googleusercontent.com/a/default-user',
            'contrasena' => Hash::make('gmail123'),
            'es_tecnico' => false,
        ]);

        // ── 2. Categorías ───────────────────────────────────────────────────────

        $cHardware   = Categoria::create(['nombre' => 'Hardware y Periféricos']);
        $cSoftware   = Categoria::create(['nombre' => 'Software y Aplicaciones']);
        $cRedes      = Categoria::create(['nombre' => 'Redes y Conectividad']);
        $cAccesos    = Categoria::create(['nombre' => 'Accesos y Permisos']);
        $cImpresoras = Categoria::create(['nombre' => 'Impresoras y Escáneres']);
        $cCorreo     = Categoria::create(['nombre' => 'Correo y Comunicaciones']);
        $cERP        = Categoria::create(['nombre' => 'Sistemas ERP y Facturación']);
        $cSeguridad  = Categoria::create(['nombre' => 'Seguridad y Antivirus']);

        // ── 3. Recetas (Base de Conocimientos) ──────────────────────────────────

        $recetasData = [
            [
                'titulo'       => 'Reinicio de servicio de cola de impresión (Spooler)',
                'id_categoria' => $cImpresoras->id,
                'usos'         => 14,
                'solucion'     => "1. Presionar Win + R, escribir 'services.msc' y dar Enter.\n2. Localizar el servicio 'Cola de impresión' (Print Spooler).\n3. Hacer clic derecho y seleccionar 'Reiniciar'.\n4. Si el error persiste, borrar archivos temporales en C:\Windows\System32\spool\PRINTERS.\n5. Volver a iniciar el servicio y enviar prueba de impresión.",
            ],
            [
                'titulo'       => 'Restablecer contraseña de red WiFi corporativa "CTM-Corp"',
                'id_categoria' => $cRedes->id,
                'usos'         => 28,
                'solucion'     => "1. Abrir navegador e ingresar a http://wifi.ctm.local\n2. Ingresar usuario corporativo y solicitar token por SMS/Email.\n3. Establecer contraseña nueva cumpliendo la política de seguridad (mínimo 10 caracteres, mayúsculas, números y símbolos).\n4. Olvidar la red 'CTM-Corp' en Windows/Móvil y reconectar con la nueva clave.",
            ],
            [
                'titulo'       => 'Limpieza profunda de caché y cookies de navegadores',
                'id_categoria' => $cSoftware->id,
                'usos'         => 42,
                'solucion'     => "1. En Chrome o Edge presionar Ctrl + Shift + Supr.\n2. En 'Intervalo de tiempo' seleccionar 'Todos'.\n3. Marcar: 'Historial de navegación', 'Cookies y datos de sitios' y 'Archivos e imágenes en caché'.\n4. Hacer clic en 'Borrar datos'.\n5. Cerrar todas las ventanas del navegador y reiniciar.",
            ],
            [
                'titulo'       => 'Configuración y reparación de perfil en Microsoft Outlook',
                'id_categoria' => $cCorreo->id,
                'usos'         => 19,
                'solucion'     => "1. Ir a Panel de Control > Correo (Microsoft Outlook).\n2. Clic en 'Mostrar perfiles' > 'Agregar'.\n3. Ingresar nombre y correo corporativo (autodescubrimiento Exchange).\n4. Iniciar sesión con credenciales de dominio.\n5. Establecer el nuevo perfil como predeterminado y abrir Outlook.",
            ],
            [
                'titulo'       => 'Conexión a VPN Corporativa Cisco AnyConnect / FortiClient',
                'id_categoria' => $cRedes->id,
                'usos'         => 35,
                'solucion'     => "1. Abrir cliente Cisco AnyConnect o FortiClient desde la barra de tareas.\n2. Servidor de conexión: vpn.ctm.com.ar\n3. Ingresar usuario corporativo y contraseña de dominio.\n4. Introducir el código OTP generado en Microsoft Authenticator.\n5. Verificar estado 'Connected' antes de acceder a carpetas de red.",
            ],
            [
                'titulo'       => 'Desbloqueo de cuenta de Active Directory por intentos fallidos',
                'id_categoria' => $cAccesos->id,
                'usos'         => 22,
                'solucion'     => "1. Abrir 'Usuarios y equipos de Active Directory' en el servidor DC.\n2. Buscar al usuario por nombre o legajo.\n3. Clic derecho > Propiedades > Pestaña 'Cuenta'.\n4. Marcar 'Desbloquear la cuenta' y aplicar cambios.\n5. Pedir al usuario que intente ingresar nuevamente tras 30 segundos.",
            ],
            [
                'titulo'       => 'Solución a error de pantalla azul (BSOD) por drivers de video',
                'id_categoria' => $cHardware->id,
                'usos'         => 8,
                'solucion'     => "1. Iniciar Windows en Modo Seguro con funciones de red.\n2. Descargar Display Driver Uninstaller (DDU) y desinstalar drivers gráficos anteriores.\n3. Descargar el controlador oficial actualizado desde el sitio del fabricante (Intel/NVIDIA/AMD).\n4. Instalar en modo limpio y reiniciar el equipo.\n5. Comprobar registros en 'Visor de eventos' (eventvwr.msc).",
            ],
            [
                'titulo'       => 'Instalación y validación de Certificado Digital AFIP / Facturación',
                'id_categoria' => $cERP->id,
                'usos'         => 11,
                'solucion'     => "1. Obtener archivo .pfx provisto por el área contable.\n2. Hacer doble clic sobre el certificado e iniciar el asistente de importación.\n3. Seleccionar 'Equipo local' > Almacén 'Personal'.\n4. Ingresar la contraseña de clave privada provista.\n5. Reiniciar el software de facturación y verificar el punto de venta habilitado.",
            ],
            [
                'titulo'       => 'Renovación de IP y vaciado de caché DNS en Windows',
                'id_categoria' => $cRedes->id,
                'usos'         => 16,
                'solucion'     => "1. Abrir CMD o PowerShell como Administrador.\n2. Ejecutar: ipconfig /flushdns\n3. Ejecutar: ipconfig /release\n4. Ejecutar: ipconfig /renew\n5. Probar conectividad con: ping 8.8.8.8 y ping intranet.ctm.local",
            ],
            [
                'titulo'       => 'Habilitación y prueba de micrófono/cámara en Microsoft Teams',
                'id_categoria' => $cCorreo->id,
                'usos'         => 25,
                'solucion'     => "1. En Windows ir a Configuración > Privacidad y seguridad > Micrófono.\n2. Verificar que 'Permitir que las aplicaciones accedan al micrófono' esté activado.\n3. En Teams ir a Configuración (...) > Dispositivos.\n4. Seleccionar el auricular/micrófono correcto y hacer clic en 'Hacer una llamada de prueba'.",
            ],
            [
                'titulo'       => 'Mapeo de unidad de red compartida (Disco Z: / Servidor)',
                'id_categoria' => $cAccesos->id,
                'usos'         => 30,
                'solucion'     => "1. Abrir 'Este equipo' en el Explorador de archivos.\n2. Clic en 'Conectar a unidad de red'.\n3. Unidad: Z: | Carpeta: \\\\192.168.1.10\\Contabilidad (o carpeta correspondiente).\n4. Marcar 'Conectar de nuevo al iniciar sesión'.\n5. Ingresar credenciales en formato: DOMINIO\\usuario y contraseña.",
            ],
            [
                'titulo'       => 'Activación y escaneo contra malware con Microsoft Defender',
                'id_categoria' => $cSeguridad->id,
                'usos'         => 7,
                'solucion'     => "1. Abrir 'Seguridad de Windows' desde la barra de tareas.\n2. Ir a 'Protección contra virus y amenazas'.\n3. Clic en 'Buscar actualizaciones' de inteligencia de seguridad.\n4. Seleccionar 'Opciones de examen' > 'Examen completo'.\n5. Si detecta amenazas, poner en cuarentena y notificar a seguridad@ctm.com.",
            ],
        ];

        $recetasCreadas = [];
        foreach ($recetasData as $r) {
            $recetasCreadas[] = Receta::create($r);
        }

        // ── 4. Consultas de Ejemplo ─────────────────────────────────────────────

        $con1 = Consulta::create([
            'descripcion' => '¿Dónde descargo la aplicación de VPN para trabajar desde mi casa?',
            'id_usuario'  => $uMaria->id,
        ]);

        $con2 = Consulta::create([
            'descripcion' => 'La impresora del sector compras no toma las hojas de la bandeja 2.',
            'id_usuario'  => $uLucia->id,
        ]);

        // ── 5. Incidentes Masivos y Realistas ───────────────────────────────────

        // Incidente 1: ABIERTO - ALTA PRIORIDAD (Antigüedad > 2 horas para probar RN-004)
        $incCritico = Incidente::create([
            'descripcion'  => 'Servidor principal de base de datos MySQL no responde a conexiones de la app de facturación.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_ALTA,
            'id_usuario'   => $uJuan->id,
            'id_categoria' => $cERP->id,
        ]);
        $incCritico->created_at = now()->subHours(3);
        $incCritico->save();

        // Incidente 2: EN CURSO - ALTA PRIORIDAD
        Incidente::create([
            'descripcion'  => 'Falla en switch de borde del piso 3. Todo el departamento de ventas quedó sin red cableada.',
            'estado'       => Incidente::ESTADO_EN_CURSO,
            'prioridad'    => Incidente::PRIORIDAD_ALTA,
            'id_usuario'   => $uCarlos->id,
            'id_tecnico'   => $tecnicoRedes->id,
            'id_categoria' => $cRedes->id,
        ]);

        // Incidente 3: RESUELTO con Receta de Impresoras (RN-002)
        Incidente::create([
            'descripcion'  => 'Trabajos de impresión de facturas quedaron bloqueados en la cola de la HP LaserJet.',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'resolucion'   => now()->subHours(5),
            'id_usuario'   => $uLucia->id,
            'id_tecnico'   => $tecnico1->id,
            'id_categoria' => $cImpresoras->id,
            'id_receta'    => $recetasCreadas[0]->id,
        ]);

        // Incidente 4: RESUELTO con Receta de VPN
        Incidente::create([
            'descripcion'  => 'No puedo acceder al sistema de RRHH desde mi domicilio por error de certificado VPN.',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'resolucion'   => now()->subDays(1),
            'id_usuario'   => $uMaria->id,
            'id_tecnico'   => $tecnicoRedes->id,
            'id_categoria' => $cRedes->id,
            'id_receta'    => $recetasCreadas[4]->id,
            'id_consulta'  => $con1->id,
        ]);

        // Incidente 5: EN CURSO - Hardware
        Incidente::create([
            'descripcion'  => 'Monitor secundario LG parpadea y se apaga intermitentemente en el área de diseño.',
            'estado'       => Incidente::ESTADO_EN_CURSO,
            'prioridad'    => Incidente::PRIORIDAD_BAJA,
            'id_usuario'   => $uAna->id,
            'id_tecnico'   => $tecnico1->id,
            'id_categoria' => $cHardware->id,
        ]);

        // Incidente 6: ABIERTO - Permisos
        Incidente::create([
            'descripcion'  => 'Solicito acceso de lectura/escritura a la carpeta compartida Z:\\Logistica\\Envios2026.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_BAJA,
            'id_usuario'   => $uDiego->id,
            'id_categoria' => $cAccesos->id,
        ]);

        // Incidente 7: ABIERTO - Correo
        Incidente::create([
            'descripcion'  => 'Outlook solicita contraseña repetidamente y no sincroniza la bandeja de entrada.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'id_usuario'   => $uCarlos->id,
            'id_categoria' => $cCorreo->id,
        ]);

        // Incidente 8: RESUELTO con solución personalizada (RN-002)
        Incidente::create([
            'descripcion'  => 'La lectora de código de barras USB del depósito no envía el salto de línea al escanear.',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'resolucion'   => now()->subDays(2),
            'id_usuario'   => $uDiego->id,
            'id_tecnico'   => $tecnico1->id,
            'id_categoria' => $cHardware->id,
        ]);

        // Incidente 9: ABIERTO - Usuario Gmail Demo
        Incidente::create([
            'descripcion'  => 'Primer reporte de prueba creado con cuenta autenticada vía Gmail / Google Auth.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'id_usuario'   => $uGmail->id,
            'id_categoria' => $cSoftware->id,
        ]);

        // ── 6. Bocetos (Drafts) ─────────────────────────────────────────────────

        Boceto::create([
            'titulo'          => 'Migración planificada de servidores a Windows Server 2025',
            'solucion_previa' => "Etapa 1: Backup completo con Veeam.\nEtapa 2: Promoción de DC secundario.\nEtapa 3: Traspaso de roles FSMO.\nEtapa 4: Pruebas de autenticación Kerberos.",
        ]);

        Boceto::create([
            'titulo'          => 'Procedimiento para despliegue de certificados SSL wildcard *.ctm.com',
            'solucion_previa' => "Generar CSR en IIS/Nginx.\nValidar challenge DNS con registro TXT.\nInstalar bundle fullchain.pem.\nConfigurar redirección obligatoria HTTPS 443.",
        ]);

        $this->command->info('✅ Seeder masivo completado exitosamente con usuarios, recetas, incidentes y categorías.');
    }
}
