<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IncidenteController extends Controller
{
    /**
     * GET /api/incidentes
     * Listar incidentes con relaciones cargadas.
     * - Técnicos: Ven todos los incidentes con filtros opcionales.
     * - Usuarios comunes: Solo ven sus propios incidentes.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Incidente::with(['usuario', 'tecnico', 'categoria', 'receta', 'consulta']);

        if (! $user->es_tecnico) {
            $query->where('id_usuario', $user->id);
        } else {
            // Filtros para técnicos
            if ($request->filled('id_usuario')) {
                $query->where('id_usuario', $request->id_usuario);
            }
            if ($request->filled('id_tecnico')) {
                $query->where('id_tecnico', $request->id_tecnico);
            }
        }

        if ($request->filled('estado')) {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('prioridad')) {
            $query->where('prioridad', $request->prioridad);
        }

        if ($request->filled('id_categoria')) {
            $query->where('id_categoria', $request->id_categoria);
        }

        $incidentes = $query->orderBy('created_at', 'desc')->get();

        return response()->json($incidentes);
    }

    /**
     * GET /api/incidentes/{id}
     * Ver el detalle de un incidente específico.
     */
    public function show($id, Request $request): JsonResponse
    {
        $user = $request->user();
        $incidente = Incidente::with(['usuario', 'tecnico', 'categoria', 'receta', 'consulta'])->findOrFail($id);

        if (! $user->es_tecnico && $incidente->id_usuario !== $user->id) {
            return response()->json(['message' => 'No tienes permiso para ver este incidente.'], 403);
        }

        return response()->json($incidente);
    }

    /**
     * POST /api/incidentes
     * Crear un nuevo incidente.
     * RN-001: Si es_tecnico, debe incluir id_categoria y prioridad obligatoriamente.
     * RN-005: Bloquea si el usuario tiene >= 3 incidentes en estado ABIERTO.
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        // Determinar el usuario titular del incidente
        $targetUserId = $user->id;
        if ($user->es_tecnico && $request->filled('id_usuario')) {
            $targetUserId = $request->id_usuario;
        }

        // RN-005: Validar que el usuario no supere el límite de 3 incidentes ABIERTOS
        $targetUser = User::findOrFail($targetUserId);
        if ($targetUser->contarIncidentesAbiertos() >= 3) {
            return response()->json([
                'message' => 'El usuario ya tiene 3 o más incidentes abiertos. Debe resolverlos antes de abrir uno nuevo (RN-005).',
                'errors'  => [
                    'id_usuario' => ['Límite alcanzado: no se permiten más de 3 incidentes en estado ABIERTO simultáneamente.'],
                ],
            ], 422);
        }

        // RN-001: Reglas de validación condicionales según el rol
        $rules = [
            'descripcion'  => 'required|string|min:5|max:2000',
            'id_categoria' => 'required|exists:categorias,id',
            'id_consulta'  => 'nullable|exists:consultas,id',
        ];

        if ($user->es_tecnico) {
            // Técnicos deben especificar obligatoriamente prioridad y categoría (RN-001)
            $rules['prioridad']  = 'required|in:BAJA,MEDIA,ALTA';
            $rules['id_usuario'] = 'sometimes|exists:users,id';
            $rules['id_tecnico'] = 'nullable|exists:users,id';
        } else {
            $rules['prioridad']  = 'sometimes|in:BAJA,MEDIA,ALTA';
        }

        $validated = $request->validate($rules);

        $incidente = Incidente::create([
            'descripcion'  => $validated['descripcion'],
            'id_categoria' => $validated['id_categoria'],
            'id_usuario'   => $targetUserId,
            'prioridad'    => $validated['prioridad'] ?? Incidente::PRIORIDAD_MEDIA,
            'estado'       => Incidente::ESTADO_ABIERTO,
            'id_consulta'  => $validated['id_consulta'] ?? null,
            'id_tecnico'   => $user->es_tecnico ? ($validated['id_tecnico'] ?? null) : null,
        ]);

        return response()->json([
            'message'   => 'Incidente registrado exitosamente.',
            'incidente' => $incidente->load(['usuario', 'tecnico', 'categoria']),
        ], 201);
    }

    /**
     * PUT /api/incidentes/{id}
     * Actualizar datos, estado o técnico asignado.
     * RN-002: Requiere solución (texto o id_receta) para pasar a estado RESUELTO.
     */
    public function update($id, Request $request): JsonResponse
    {
        $user = $request->user();
        $incidente = Incidente::findOrFail($id);

        if (! $user->es_tecnico && $incidente->id_usuario !== $user->id) {
            return response()->json(['message' => 'No autorizado para modificar este incidente.'], 403);
        }

        if ($user->es_tecnico) {
            $request->validate([
                'estado'         => 'sometimes|in:ABIERTO,EN_CURSO,RESUELTO',
                'prioridad'      => 'sometimes|in:BAJA,MEDIA,ALTA',
                'id_categoria'   => 'sometimes|exists:categorias,id',
                'id_tecnico'     => 'nullable|exists:users,id',
                'id_receta'      => 'nullable|exists:recetas,id',
                'solucion_texto' => 'nullable|string|min:5',
                'descripcion'    => 'sometimes|string|min:5',
            ]);

            $nuevoEstado = $request->input('estado', $incidente->estado);

            // RN-002: Si se marca como RESUELTO, verificar que haya receta o solución explicada
            if ($nuevoEstado === Incidente::ESTADO_RESUELTO) {
                $tieneReceta   = $request->filled('id_receta') || $incidente->id_receta;
                $tieneSolucion = $request->filled('solucion_texto');

                if (! $tieneReceta && ! $tieneSolucion) {
                    return response()->json([
                        'message' => 'Para cerrar/resolver el incidente se requiere indicar una receta o detallar una solución (RN-002).',
                        'errors'  => [
                            'resolucion' => ['Debe asociar una receta existente o ingresar una solución detallada para marcar el incidente como RESUELTO.'],
                        ],
                    ], 422);
                }

                $incidente->resolucion = now();

                // Si ingresó una solución personalizada, guardarla automáticamente como nueva Receta en la Base de Conocimientos
                if ($tieneSolucion && ! $request->filled('id_receta')) {
                    $tituloReceta = $request->input('titulo_receta') 
                        ?: ('Solución para: ' . \Illuminate\Support\Str::limit($incidente->descripcion, 50));

                    $nuevaReceta = Receta::create([
                        'titulo'       => $tituloReceta,
                        'solucion'     => $request->solucion_texto,
                        'id_categoria' => $request->input('id_categoria', $incidente->id_categoria),
                        'usos'         => 1,
                    ]);

                    $incidente->id_receta = $nuevaReceta->id;
                } elseif ($request->filled('id_receta') && $request->id_receta != $incidente->id_receta) {
                    // Si se asoció una receta existente, incrementar contador de uso
                    $receta = Receta::find($request->id_receta);
                    if ($receta) {
                        $receta->incrementarUsos();
                    }
                    $incidente->id_receta = $request->id_receta;
                }
            } elseif ($request->filled('estado') && $nuevoEstado !== Incidente::ESTADO_RESUELTO) {
                $incidente->resolucion = null;
            }


            if ($request->filled('estado')) {
                $incidente->estado = $request->estado;
            }
            if ($request->filled('prioridad')) {
                $incidente->prioridad = $request->prioridad;
            }
            if ($request->filled('id_categoria')) {
                $incidente->id_categoria = $request->id_categoria;
            }
            if ($request->has('id_tecnico')) {
                $incidente->id_tecnico = $request->id_tecnico;
            }
            if ($request->filled('descripcion')) {
                $incidente->descripcion = $request->descripcion;
            }

            $incidente->save();
        } else {
            // Usuario común solo puede actualizar la descripción si está ABIERTO
            if ($incidente->estado !== Incidente::ESTADO_ABIERTO) {
                return response()->json(['message' => 'No puedes modificar un incidente en curso o resuelto.'], 422);
            }

            $request->validate([
                'descripcion' => 'required|string|min:5|max:2000',
            ]);

            $incidente->descripcion = $request->descripcion;
            $incidente->save();
        }

        return response()->json([
            'message'   => 'Incidente actualizado correctamente.',
            'incidente' => $incidente->fresh()->load(['usuario', 'tecnico', 'categoria', 'receta', 'consulta']),
        ]);
    }

    /**
     * PUT /api/incidentes/{id}/derivar
     * RN-003: Derivar incidente a otro técnico o unidad especializada y notificar al usuario.
     */
    public function derivar($id, Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->es_tecnico) {
            return response()->json(['message' => 'Solo los técnicos pueden derivar incidentes.'], 403);
        }

        $incidente = Incidente::with('usuario')->findOrFail($id);

        $validated = $request->validate([
            'id_tecnico'            => 'nullable|exists:users,id',
            'unidad_especializada'  => 'nullable|string|max:255',
            'motivo'                => 'required|string|min:5|max:1000',
        ]);

        if (array_key_exists('id_tecnico', $validated)) {
            $incidente->id_tecnico = $validated['id_tecnico'];
        }
        $incidente->estado = Incidente::ESTADO_EN_CURSO;
        $incidente->save();

        // RN-003: Disparar notificación real en base de datos al usuario
        $unidad = $validated['unidad_especializada'] ?? 'Soporte Especializado';
        $motivo = $validated['motivo'];
        
        $incidente->usuario->notify(new \App\Notifications\IncidenteDerivadoNotification($incidente, $unidad, $motivo));

        $notificacion = [
            'destinatario'         => $incidente->usuario->correo,
            'nombre_usuario'       => $incidente->usuario->nombre,
            'incidente_id'         => $incidente->id,
            'unidad_especializada' => $unidad,
            'motivo'               => $motivo,
            'fecha'                => now()->toDateTimeString(),
        ];


        return response()->json([
            'message'      => 'Incidente derivado correctamente. Notificación enviada al usuario (RN-003).',
            'incidente'    => $incidente->fresh()->load(['usuario', 'tecnico', 'categoria', 'receta']),
            'notificacion' => $notificacion,
        ]);
    }
}
