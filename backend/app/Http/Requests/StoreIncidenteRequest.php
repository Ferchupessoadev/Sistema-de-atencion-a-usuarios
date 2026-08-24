<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Validator;

class StoreIncidenteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $es_tecnico = $this->user()->hasRole('tecnico');

        return [
            'descripcion'  => 'required|string|min:5|max:2000',
            'id_categoria' => 'required|exists:categorias,id',
            'interno'      => 'nullable|string|max:20',
            'prioridad' => [$es_tecnico ? 'required' : 'sometimes', 'in:BAJA,MEDIA,ALTA',
        ],
        ];
    }

    public function after()
    {
        return [
            function (Validator $validator) {
                $user = $this->user();

                $targetUserId = $user->id;

                $targetUser = User::find($targetUserId);

                if (!$targetUser) {
                    return;
                }

                if ($targetUser->contarIncidentesAbiertos() >= 3) {
                    $validator->errors()->add(
                        'id_usuario',
                        'Límite alcanzado: no se permiten más de 3 incidentes en estado ABIERTO simultáneamente.'
                    );
                }
            },
        ];
    }
}
