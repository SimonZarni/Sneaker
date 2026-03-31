<?php

namespace App\Http\Requests;

use App\Enums\MessageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'text' => ['required', 'string', 'max:2000'],
            'message_type' => ['sometimes', 'string', Rule::in(array_column(MessageType::cases(), 'value'))],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
        ];
    }

    public function messageType(): MessageType
    {
        return MessageType::from($this->input('message_type', MessageType::Text->value));
    }
}
