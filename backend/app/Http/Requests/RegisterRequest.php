<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('correo')) {
            $this->merge([
                'correo' => strtolower(trim($this->correo)),
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nombre'     => 'required|string|max:255',
            'correo'     => 'required|string|email|max:255|unique:users,correo',
            'contrasena' => [
                'required',
                'string',
                Password::min(8)->letters()->numbers(),
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'nombre.required'     => 'El nombre completo es obligatorio.',
            'correo.required'     => 'El correo electrónico es obligatorio.',
            'correo.email'        => 'El formato del correo electrónico es inválido.',
            'correo.unique'       => 'El correo electrónico ya se encuentra registrado.',
            'contrasena.required' => 'La contraseña es obligatoria.',
            'contrasena.min'      => 'La contraseña debe tener al menos 8 caracteres.',
        ];
    }
}
