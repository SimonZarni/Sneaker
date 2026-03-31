<?php

namespace App\Enums;

enum MessageType: string
{
    case Text = 'text';
    case OrderRef = 'order_ref';
    case Image = 'image';

    public function label(): string
    {
        return match ($this) {
            MessageType::Text => 'Text Message',
            MessageType::OrderRef => 'Order Reference',
            MessageType::Image => 'Image',
        };
    }
}
