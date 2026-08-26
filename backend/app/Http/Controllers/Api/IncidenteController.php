<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreIncidenteRequest;
use App\Models\Boceto;
use App\Models\Incidente;
use App\Models\Receta;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

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
        Gate::authorize('viewAny', Incidente::class);

        $query = Incidente::with(['usuario', 'tecnico', 'categoria', 'receta']);

        if (!$user->hasRole(['tecnico'])) {
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
    public function show(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $incidente = Incidente::with(['usuario', 'tecnico', 'categoria', 'receta'])->findOrFail($id);
        Gate::authorize('view', $incidente);

        return response()->json($incidente);
    }

    /**
     * POST /api/incidentes
     * Crear un nuevo incidente.
     * RN-001: Si es_tecnico, debe incluir id_categoria y prioridad obligatoriamente.
     * RN-005: Bloquea si el usuario tiene >= 3 incidentes en estado ABIERTO.
     */
    public function store(StoreIncidenteRequest $request): JsonResponse
    {
        $user = $request->user();
        Gate::authorize('create', Incidente::class);
        $validated = $request->validated();

        $targetUserId = $user->id;

        $incidente = Incidente::create([
            'descripcion'  => $validated['descripcion'],
            'id_categoria' => $validated['id_categoria'],
            'id_usuario'   => $targetUserId,
            'interno'      => $validated['interno'] ?? ($targetUser->interno ?? null),
            'prioridad'    => $validated['prioridad'] ?? Incidente::PRIORIDAD_MEDIA,
            'estado'       => Incidente::ESTADO_ABIERTO,
            'id_tecnico'   => $user->hasRole(['tecnico']) ? ($validated['id_tecnico'] ?? null) : null,
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
    public function update(int $id, Request $request): JsonResponse
    {
        $user = $request->user();
        $incidente = Incidente::findOrFail($id);
        Gate::authorize('update', $incidente);

        if ($user->hasRole(['tecnico'])) {
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

            if ($nuevoEstado === Incidente::ESTADO_RESUELTO && $incidente->id_tecnico !== $user->id) {
                return response()->json([
                    'message' => 'Debes tomar el incidente antes de poder resolverlo.',
                ], 403);
            }

            // RN-002: Si se marca como RESUELTO, verificar que haya receta o solución explicada
            if ($nuevoEstado === Incidente::ESTADO_RESUELTO) {
                $tieneReceta   = $request->filled('id_receta') || $incidente->id_receta;
                $tieneSolucion = $request->filled('solucion_texto');

                if (! $tieneReceta && ! $tieneSolucion) {
                    return response()->json([
                        'message' => 'Para cerrar/resolver el incidente se requiere indicar una receta o detallar una solución.',
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

                    Boceto::create([
                        'titulo' => $tituloReceta,
                        'solucion_previa' => $request->solucion_texto,
                    ]);
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
                'descripcion' => 'required|string|min:5|max:50000',
            ]);

            $incidente->descripcion = $request->descripcion;
            $incidente->save();
        }

        return response()->json([
            'message'   => 'Incidente actualizado correctamente.',
            'incidente' => $incidente->fresh()->load(['usuario', 'tecnico', 'categoria', 'receta']),
        ]);
    }

    /**
     * PUT /api/incidentes/{id}/derivar
     * RN-003: Derivar incidente a otro técnico o unidad especializada y notificar al usuario.
     */
    public function derivar(int $id, Request $request): JsonResponse
    {
        $incidente = Incidente::with('usuario')->findOrFail($id);
        Gate::authorize('derive', $incidente);

        $validated = $request->validate([
            'id_tecnico'            => 'nullable|exists:users,id',
            'unidad_especializada'  => 'nullable|string|max:255',
            'motivo'                => 'required|string|min:5|max:50000',
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
            'message'      => 'Incidente derivado correctamente. Notificación enviada al usuario.',
            'incidente'    => $incidente->fresh()->load(['usuario', 'tecnico', 'categoria', 'receta']),
            'notificacion' => $notificacion,
        ]);
    }

    /**
     * GET /api/reportes/incidentes/exportar
     * Exporta todos los incidentes a formato CSV estructurado para auditoría y Excel.
     */
    public function exportar(Request $request)
    {
        Gate::authorize('export', Incidente::class);

        $incidentes = Incidente::with(['categoria', 'usuario', 'tecnico', 'receta'])
            ->orderBy('id', 'desc')
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="reporte_incidentes_ctm_' . date('Ymd_His') . '.csv"',
        ];

        $callback = function () use ($incidentes) {
            $file = fopen('php://output', 'w');
            // BOM UTF-8 para visualización correcta de acentos en Microsoft Excel
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($file, [
                'ID',
                'Fecha Creacion',
                'Estado',
                'Prioridad',
                'Categoria',
                'Usuario Afectado',
                'Interno / Telefono',
                'Tecnico Asignado',
                'Descripcion',
                'Fecha Resolucion',
                'Tiempo Atencion (Horas)',
                'Receta / Solucion Aplicada',
            ], ';');

            foreach ($incidentes as $inc) {
                $tiempoHoras = '';
                if ($inc->resolucion && $inc->created_at) {
                    $tiempoHoras = round($inc->created_at->diffInMinutes($inc->resolucion) / 60, 2);
                }

                fputcsv($file, [
                    $inc->id,
                    $inc->created_at ? $inc->created_at->format('d/m/Y H:i') : '',
                    $inc->estado,
                    $inc->prioridad,
                    $inc->categoria ? $inc->categoria->nombre : 'Sin Categoria',
                    $inc->usuario ? $inc->usuario->nombre . ' (' . $inc->usuario->correo . ')' : '',
                    $inc->interno ?? ($inc->usuario->interno ?? 'Sin registrar'),
                    $inc->tecnico ? $inc->tecnico->nombre : 'Sin Asignar',
                    str_replace(["\r", "\n"], ' ', $inc->descripcion),
                    $inc->resolucion ? $inc->resolucion->format('d/m/Y H:i') : 'Pendiente',
                    $tiempoHoras !== '' ? $tiempoHoras . ' h' : 'N/A',
                    $inc->receta ? $inc->receta->titulo : 'N/A',
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

