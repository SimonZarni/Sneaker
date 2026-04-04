<?php

namespace App\Events;

use App\Models\Order;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewOrderPlaced implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Order $order) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('admin-notifications'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'id'            => $this->order->id,
            'order_number'  => $this->order->order_number,
            'customer_name' => $this->order->shipping_full_name,
            'total_amount'  => $this->order->total_amount,
            'placed_at'     => $this->order->placed_at?->toISOString(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.placed';
    }
}
