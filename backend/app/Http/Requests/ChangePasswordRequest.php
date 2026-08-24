<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contrasena_actual' => 'required|string',
            'contrasena'        => 'required|string|min:6|confirmed',
        ];
    }

    public function messages(): array
    {
        return [
            'contrasena_actual.required' => 'Debés ingresar tu contraseña actual.',
            'contrasena.required'        => 'La nueva contraseña es obligatoria.',
            'contrasena.min'             => 'La nueva contraseña debe tener al menos 6 caracteres.',
            'contrasena.confirmed'       => 'La confirmación de la nueva contraseña no coincide.',
        ];
    }
}
