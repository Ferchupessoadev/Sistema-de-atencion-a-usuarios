<?php

namespace Database\Seeders;

use App\Models\Boceto;
use App\Models\Categoria;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use CategoriasSeeder;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([RolesAndPermissionsSeeder::class, CategoriasSeeder::class]);

        $categorias = Categoria::whereIn('nombre', [
            'AICO - Atención a Usuarios',
            'Computadora y Hardware',
            'Impresoras y Fotocopiadoras',
            'Redes e Internet',
            'WIFI y Conectividad',
            'Telefonía e Internos',
            'K2B y Sistemas ERP',
            'Software y Aplicaciones',
            'Accesos y Seguridad',
        ])->get()->keyBy('nombre');

        $cAICO = $categorias->get('AICO - Atención a Usuarios');
        $cComputadora = $categorias->get('Computadora y Hardware');
        $cImpresora = $categorias->get('Impresoras y Fotocopiadoras');
        $cRedes = $categorias->get('Redes e Internet');
        $cWIFI = $categorias->get('WIFI y Conectividad');
        $cTelefonia = $categorias->get('Telefonía e Internos');
        $cK2B = $categorias->get('K2B y Sistemas ERP');
        $cSoftware = $categorias->get('Software y Aplicaciones');
        $cAccesos = $categorias->get('Accesos y Seguridad');

        // ── 1. Usuarios y Especialistas de CTM ──────────────────────────────────

        // Administrador y Técnicos AICO / Soporte
        $admin = User::create([
            'nombre'     => 'Administrador General AICO',
            'correo'     => 'admin@ctm.com',
            'interno'    => '3700',
            'contrasena' => Hash::make('admin123'),
        ]);
        $admin->assignRole('tecnico');

        $tecnicoAico = User::create([
            'nombre'     => 'Técnico Soporte AICO (Int. 3777)',
            'correo'     => 'tecnico@ctm.com',
            'interno'    => '3777',
            'contrasena' => Hash::make('tecnico123'),
        ]);
        $tecnicoAico->assignRole('tecnico');

        $tecnicoRedes = User::create([
            'nombre'     => 'Especialista en Redes y Comunicaciones',
            'correo'     => 'redes@ctm.com',
            'interno'    => '3750',
            'contrasena' => Hash::make('tecnico123'),
        ]);
        $tecnicoRedes->assignRole('tecnico');

        $tecnicoSistemas = User::create([
            'nombre'     => 'Administrador de Sistemas ERP y K2B',
            'correo'     => 'sistemas@ctm.com',
            'interno'    => '3780',
            'contrasena' => Hash::make('tecnico123'),
        ]);
        $tecnicoSistemas->assignRole('tecnico');

        // Usuarios Normales de distintas áreas con sus internos de puesto
        $uJuan = User::create([
            'nombre'     => 'Juan Pérez (Contabilidad)',
            'correo'     => 'juan@ctm.com',
            'interno'    => '3105',
            'contrasena' => Hash::make('usuario123'),
        ]);
        $uJuan->assignRole('default');

        $uMaria = User::create([
            'nombre'     => 'María González (Recursos Humanos)',
            'correo'     => 'maria@ctm.com',
            'interno'    => '3210',
            'contrasena' => Hash::make('usuario123'),
        ]);
        $uMaria->assignRole('default');

        $uCarlos = User::create([
            'nombre'     => 'Carlos Rodríguez (Comercial y Facturación)',
            'correo'     => 'carlos.ventas@ctm.com',
            'interno'    => '3340',
            'contrasena' => Hash::make('usuario123'),
        ]);
        $uCarlos->assignRole('default');

        $uLucia = User::create([
            'nombre'     => 'Lucía Méndez (Compras y Suministros)',
            'correo'     => 'lucia.compras@ctm.com',
            'interno'    => '3415',
            'contrasena' => Hash::make('usuario123'),
        ]);
        $uLucia->assignRole('default');

        $uDiego = User::create([
            'nombre'     => 'Diego Morales (Operaciones y Mantenimiento)',
            'correo'     => 'diego.logistica@ctm.com',
            'interno'    => '3550',
            'contrasena' => Hash::make('usuario123'),
        ]);
        $uDiego->assignRole('default');

        $uAna = User::create([
            'nombre'     => 'Ana Fernández (Relaciones Institucionales)',
            'correo'     => 'ana.marketing@ctm.com',
            'interno'    => '3620',
            'contrasena' => Hash::make('usuario123'),
        ]);
        $uAna->assignRole('default');


        // ── 3. Recetas Oficiales con Keywords y Votos de Utilidad ───────────────

        $recetasData = [
            [
                'titulo'        => 'CAMBIO DE CARTUCHO DE TONER IMPRESORA TOSHIBA 287',
                'id_categoria'  => $cImpresora->id,
                'usos'          => 15,
                'votos_util'    => 14,
                'votos_no_util' => 1,
                'keywords'      => '3777, toshiba, 287, toner, cartucho, tinta, impresion, impresora',
                'solucion'      => "1. Solicite el cartucho de tóner faltante comunicándose con Atención a Usuarios al interno 3777.\n2. Con el cartucho nuevo en mano proceda a abrir la tapa frontal de la impresora Toshiba 287.\n3. Retire el cartucho de tóner vacío y deséchelo en el contenedor de residuos indicado para tal fin.\n4. Retire el cartucho nuevo de la caja y quite la cinta protectora de sellado.\n5. Coloque el cartucho de tóner en la impresora y cierre la tapa frontal.\n6. Espere unos minutos hasta que la impresora calibre e indique que puede continuar con el trabajo de impresión.\n(Cualquier inconveniente solicite asistencia a AICO al int. 3777).",
            ],
            [
                'titulo'        => 'LIMPIAR COOKIES Y CACHE - Error en Sistema K2B',
                'id_categoria'  => $cK2B->id,
                'usos'          => 28,
                'votos_util'    => 26,
                'votos_no_util' => 2,
                'keywords'      => 'k2b, erp, cookies, cache, firefox, historial, sesion, pantalla blanca',
                'solucion'      => "1. Abrir el navegador recomendado: Mozilla Firefox.\n2. Acceder al menú 'Herramientas' > 'Limpiar el historial reciente'.\n3. En 'Rango temporal a limpiar' seleccionar 'TODO'.\n4. Marcar las casillas 'Cookies' y 'Caché'.\n5. Hacer clic en 'Limpiar todo'.\n6. Cerrar todas las ventanas del navegador y volver a ingresar al sistema K2B.\n7. Ante la persistencia del inconveniente, ingresar ticket en la sección 'Tengo un Problema' de la Mesa de Ayuda.",
            ],
            [
                'titulo'        => 'PROBLEMAS FRECUENTES CON TELÉFONO INTERNO',
                'id_categoria'  => $cTelefonia->id,
                'usos'          => 34,
                'votos_util'    => 31,
                'votos_no_util' => 3,
                'keywords'      => 'telefono, interno, transfer, conferencia, no suena, dnd, manos libres, redial, captura',
                'solucion'      => "1. Derivaciones: Presionar la tecla 'Transfer / Transf', marcar el número de interno de destino y colgar.\n2. Conferencias: Con una llamada en curso presionar 'Conf', marcar el tercer interno y pulsar 'Conf' nuevamente.\n3. No suena el interno: Verificar que la luz de 'No Molestar / DND' esté apagada y ajustar el volumen del timbre con las teclas de flecha.\n4. Captura de llamadas: Para capturar la llamada sonando en otro puesto, descolgar y marcar *8.\n5. Manos libres y re-discado: Presionar la tecla 'Speaker' para altavoz y 'Redial' para marcar el último número.\n(Instructivos en video disponibles en Intranet CTM).",
            ],
            [
                'titulo'        => 'CONTRASEÑA PARA RED "WLAN_Invitados"',
                'id_categoria'  => $cWIFI->id,
                'usos'          => 44,
                'votos_util'    => 42,
                'votos_no_util' => 0,
                'keywords'      => 'wifi, wlan, invitados, clave, password, internet, celular, notebook',
                'solucion'      => "1. Seleccionar la red inalámbrica 'WLAN_Invitados' en el dispositivo móvil o portátil.\n2. Ingresar la contraseña: internetCTM\n(Importante: la palabra 'internet' debe ingresarse en minúsculas y 'CTM' en mayúsculas).\n3. Abrir el navegador web para aceptar los términos de uso si el portal de acceso lo solicita.",
            ],
            [
                'titulo'        => 'EQUIPO LENTO EN SU FUNCIONAMIENTO - Windows Update',
                'id_categoria'  => $cComputadora->id,
                'usos'          => 96,
                'votos_util'    => 88,
                'votos_no_util' => 5,
                'keywords'      => 'lento, windows update, actualizacion, parches, pc, notebook, reinicio',
                'solucion'      => "1. Ir al menú Inicio de Windows > Configuración (icono de engranaje).\n2. Seleccionar 'Actualización y seguridad' > 'Windows Update'.\n3. Hacer clic en el botón 'Buscar actualizaciones'.\n4. Si aparecen parches o mejoras disponibles, hacer clic en 'Descargar' e 'Instalar'.\n5. Mantener el equipo conectado a la red y a la corriente eléctrica durante la descarga.\n6. Reiniciar el dispositivo para completar la instalación y optimizar el rendimiento del sistema.",
            ],
            [
                'titulo'        => 'CAMBIAR LA CONTRASEÑA DE USUARIO (Oficina y Teletrabajo / VPN)',
                'id_categoria'  => $cAccesos->id,
                'usos'          => 140,
                'votos_util'    => 135,
                'votos_no_util' => 4,
                'keywords'      => 'contraseña, password, clave, active directory, ctrl alt supr, vpn, escritorio remoto, 172.16.3.123',
                'solucion'      => "--- Caso 1: En la Oficina (Red Corporativa) ---\n1. Presionar simultáneamente las teclas Ctrl + Alt + Supr (Del).\n2. En el menú de seguridad seleccionar 'Cambiar una contraseña'.\n3. Ingresar la contraseña actual y luego la nueva contraseña propuesta dos veces.\n(Requisitos: Mínimo 8 caracteres, mayúsculas, minúsculas y números, sin incluir el nombre de usuario).\n\n--- Caso 2: En Teletrabajo / Remoto ---\n1. Conectar la VPN corporativa de CTM.\n2. Abrir la aplicación 'Conexión a Escritorio remoto' (escribir 'escritorio' en la barra de búsqueda).\n3. En el campo 'Equipo' ingresar: 172.16.3.123 y presionar 'Mostrar opciones'.\n4. En 'Usuario' colocar: ctmgag\\tu_usuario_de_red y conectar.\n5. Ingresar la contraseña actual para acceder a la máquina virtual.\n6. Dentro de la sesión remota, hacer clic en Inicio > 'Seguridad de Windows' > 'Cambiar una contraseña'.\n7. Guardar la nueva clave y desconectar la sesión remota.",
            ],
            [
                'titulo'        => 'CONEXIÓN A VPN CORPORATIVA CISCO / FORTICLIENT',
                'id_categoria'  => $cRedes->id,
                'usos'          => 38,
                'votos_util'    => 35,
                'votos_no_util' => 2,
                'keywords'      => 'vpn, cisco, forticlient, teletrabajo, vpn.ctm.com.ar, otp, authenticator, remoto',
                'solucion'      => "1. Abrir el cliente VPN corporativo desde la barra de tareas de Windows.\n2. Servidor de conexión: vpn.ctm.com.ar\n3. Ingresar el usuario de red y contraseña de dominio institucional.\n4. Introducir el código OTP de doble factor provisto por Microsoft Authenticator.\n5. Comprobar que el estado figure como 'Connected' antes de intentar acceder a carpetas de red o K2B.",
            ],
            [
                'titulo'        => 'DESBLOQUEO DE CUENTA DE ACTIVE DIRECTORY POR INTENTOS FALLIDOS',
                'id_categoria'  => $cAICO->id,
                'usos'          => 45,
                'votos_util'    => 44,
                'votos_no_util' => 1,
                'keywords'      => 'bloqueada, bloqueo, active directory, usuario, clave temporal, ad, 3777',
                'solucion'      => "1. Verificar en el controlador de dominio Active Directory si la cuenta del usuario está bloqueada.\n2. Comprobar que el usuario no tenga dispositivos móviles con credenciales antiguas intentando autenticarse.\n3. En Active Directory Users & Computers > Propiedades de Cuenta > tildar 'Desbloquear cuenta'.\n4. Si el usuario olvidó la clave, generar una contraseña provisoria marcando 'Cambiar contraseña en el próximo inicio'.\n5. Comunicar al usuario el restablecimiento por interno 3777 o correo alternativo.",
            ],
            [
                'titulo'        => 'CONFIGURACIÓN Y REPARACIÓN DE PERFIL EN MICROSOFT OUTLOOK',
                'id_categoria'  => $cSoftware->id,
                'usos'          => 24,
                'votos_util'    => 22,
                'votos_no_util' => 1,
                'keywords'      => 'outlook, correo, mail, exchange, perfil, sincronizar, bandeja de entrada',
                'solucion'      => "1. Cerrar Microsoft Outlook completamente.\n2. Ir a Panel de Control > 'Correo (Microsoft Outlook)'.\n3. Hacer clic en 'Mostrar perfiles' y presionar 'Agregar...'.\n4. Asignar un nombre al perfil (ej. 'CTM-Principal') y completar nombre y correo institucional.\n5. Validar con credenciales de dominio ctmgag\\usuario.\n6. Establecer el nuevo perfil como predeterminado y abrir Outlook para iniciar la sincronización.",
            ],
            [
                'titulo'        => 'CONFIGURACIÓN DE CARTELERA DIGITAL INFORMATIVA XIBO',
                'id_categoria'  => $cSoftware->id,
                'usos'          => 12,
                'votos_util'    => 11,
                'votos_no_util' => 0,
                'keywords'      => 'xibo, cartelera, pantalla, tv, videos, institucional, transmision, 1080p',
                'solucion'      => "1. Ingresar al panel web Xibo en http://xibo.ctm.local con usuario de operador.\n2. Ir a la sección 'Layouts' y seleccionar la pantalla destino (Comedor, Recepción, Sala de Control).\n3. Cargar el contenido institucional en resolución Full HD 1080p (1920x1080).\n4. Configurar el cronograma y presionar 'Publicar cambios'.\n5. En la pantalla física receptora forzar actualización desde el menú de opciones con la tecla 'i'.",
            ],
            [
                'titulo'        => 'MAPEO DE UNIDAD DE RED COMPARTIDA (DISCO Z: / SERVIDOR)',
                'id_categoria'  => $cAccesos->id,
                'usos'          => 30,
                'votos_util'    => 29,
                'votos_no_util' => 1,
                'keywords'      => 'disco z, carpeta compartida, servidor, archivos, smb, red, mapeo',
                'solucion'      => "1. Abrir 'Este equipo' en el Explorador de archivos de Windows.\n2. Hacer clic en 'Conectar a unidad de red'.\n3. Seleccionar la letra Z: (o la requerida por el área).\n4. En la ruta ingresar la dirección del servidor (ej. \\\\192.168.1.10\\Contabilidad).\n5. Marcar 'Conectar de nuevo al iniciar sesión' y validar con usuario ctmgag\\usuario y contraseña.",
            ],
            [
                'titulo'        => 'RENOVACIÓN DE IP Y LIMPIEZA DE CACHÉ DNS EN WINDOWS',
                'id_categoria'  => $cRedes->id,
                'usos'          => 18,
                'votos_util'    => 17,
                'votos_no_util' => 1,
                'keywords'      => 'ipconfig, flushdns, dns, renew, release, ip, red, conexion, internet',
                'solucion'      => "1. Abrir CMD o PowerShell como Administrador.\n2. Ejecutar el comando: ipconfig /flushdns\n3. Ejecutar el comando: ipconfig /release\n4. Ejecutar el comando: ipconfig /renew\n5. Probar respuesta con el comando: ping intranet.ctm.local",
            ],
        ];

        $recetasCreadas = [];
        foreach ($recetasData as $r) {
            $recetasCreadas[] = Receta::create($r);
        }


        // ── 5. Incidentes Realistas con Internos ────────────────────────────────

        // Incidente 1: ABIERTO - ALTA PRIORIDAD (Antigüedad > 2 horas para probar RN-004)
        $incCritico = Incidente::create([
            'descripcion'  => 'Servidor principal de base de datos MySQL no responde a conexiones de la aplicación de facturación K2B.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_ALTA,
            'id_usuario'   => $uJuan->id,
            'interno'      => $uJuan->interno,
            'id_categoria' => $cK2B->id,
        ]);
        $incCritico->created_at = now()->subHours(3);
        $incCritico->save();

        // Incidente 2: EN CURSO - ALTA PRIORIDAD
        Incidente::create([
            'descripcion'  => 'Falla en switch de borde del piso 3. Todo el departamento comercial quedó sin red cableada.',
            'estado'       => Incidente::ESTADO_EN_CURSO,
            'prioridad'    => Incidente::PRIORIDAD_ALTA,
            'id_usuario'   => $uCarlos->id,
            'interno'      => $uCarlos->interno,
            'id_tecnico'   => $tecnicoRedes->id,
            'id_categoria' => $cRedes->id,
        ]);

        // Incidente 3: RESUELTO con Receta de Impresoras (RN-002)
        Incidente::create([
            'descripcion'  => 'Trabajos de impresión de facturas quedaron bloqueados en la cola de la Toshiba 287.',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'resolucion'   => now()->subHours(5),
            'id_usuario'   => $uLucia->id,
            'interno'      => $uLucia->interno,
            'id_tecnico'   => $tecnicoAico->id,
            'id_categoria' => $cImpresora->id,
            'id_receta'    => $recetasCreadas[0]->id,
        ]);

        // Incidente 4: RESUELTO con Receta de K2B Cookies (RN-002)
        Incidente::create([
            'descripcion'  => 'Pantalla blanca y error de sesión al ingresar al módulo de liquidaciones en K2B.',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'resolucion'   => now()->subDays(1),
            'id_usuario'   => $uMaria->id,
            'interno'      => $uMaria->interno,
            'id_tecnico'   => $tecnicoSistemas->id,
            'id_categoria' => $cK2B->id,
            'id_receta'    => $recetasCreadas[1]->id,
        ]);

        // Incidente 5: EN CURSO - Telefonía
        Incidente::create([
            'descripcion'  => 'El teléfono interno 3620 no realiza transferencias y la luz de no molestar queda titilando.',
            'estado'       => Incidente::ESTADO_EN_CURSO,
            'prioridad'    => Incidente::PRIORIDAD_BAJA,
            'id_usuario'   => $uAna->id,
            'interno'      => $uAna->interno,
            'id_tecnico'   => $tecnicoAico->id,
            'id_categoria' => $cTelefonia->id,
        ]);

        // Incidente 6: ABIERTO - Permisos
        Incidente::create([
            'descripcion'  => 'Solicito acceso de lectura/escritura a la carpeta compartida Z:\\Operaciones\\Mantenimiento2026.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_BAJA,
            'id_usuario'   => $uDiego->id,
            'interno'      => $uDiego->interno,
            'id_categoria' => $cAccesos->id,
        ]);

        // Incidente 7: ABIERTO - Correo
        Incidente::create([
            'descripcion'  => 'Outlook solicita contraseña repetidamente y no sincroniza la bandeja de entrada institucional.',
            'estado'       => Incidente::ESTADO_ABIERTO,
            'prioridad'    => Incidente::PRIORIDAD_MEDIA,
            'id_usuario'   => $uCarlos->id,
            'interno'      => $uCarlos->interno,
            'id_categoria' => $cSoftware->id,
        ]);

        // Incidente 8: RESUELTO con Solución de WiFi Invitados (RN-002)
        Incidente::create([
            'descripcion'  => 'Consultores externos solicitan acceso temporal a internet en sala de reuniones de presidencia.',
            'estado'       => Incidente::ESTADO_RESUELTO,
            'prioridad'    => Incidente::PRIORIDAD_BAJA,
            'resolucion'   => now()->subDays(2),
            'id_usuario'   => $uAna->id,
            'interno'      => $uAna->interno,
            'id_tecnico'   => $tecnicoAico->id,
            'id_categoria' => $cWIFI->id,
            'id_receta'    => $recetasCreadas[3]->id,
        ]);

        // ── 6. Bocetos (Drafts) ─────────────────────────────────────────────────

        Boceto::create([
            'titulo'          => 'Migración planificada de servidores a Windows Server 2025',
            'solucion_previa' => "Etapa 1: Backup completo de máquinas virtuales con Veeam.\nEtapa 2: Promoción de DC secundario.\nEtapa 3: Traspaso de roles FSMO.\nEtapa 4: Pruebas de autenticación Kerberos y DNS.",
        ]);

        Boceto::create([
            'titulo'          => 'Procedimiento para despliegue de certificados SSL wildcard *.ctm.com.ar',
            'solucion_previa' => "1. Generar CSR en IIS/Nginx.\n2. Validar challenge DNS con registro TXT en el proveedor.\n3. Descargar bundle fullchain.pem.\n4. Instalar y forzar redirección HTTPS en puerto 443.",
        ]);

        $this->command->info('✅ Datos ampliados con internos, keywords y votos migrados exitosamente.');
    }
}
