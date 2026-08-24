<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'nombre'  => 'required|string|max:255',
            'correo'  => "required|email|unique:users,correo,{$userId}",
            'interno' => 'nullable|string|max:20',
        ];
    }
}
