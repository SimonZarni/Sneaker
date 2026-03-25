<?php

namespace App\Events;

use App\Models\Order;
use App\Services\PushNotificationService;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OrderStatusChanged implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $message;
    public string $icon;
    public string $title;

    public function __construct(public Order $order, public string $type)
    {
        // Map event type to human-readable message and icon
        $map = [
            'confirmed'   => ['🎉', 'Order Confirmed',   "Order {$order->order_number} was placed successfully."],
            'processing'  => ['⚙️',  'Order Processing',  "Order {$order->order_number} is being prepared."],
            'shipped'     => ['📦', 'Order Shipped',     "Order {$order->order_number} is on its way to you."],
            'delivered'   => ['✅', 'Order Delivered',   "Order {$order->order_number} has arrived. Enjoy your kicks!"],
            'cancelled'   => ['❌', 'Order Cancelled',   "Order {$order->order_number} has been cancelled."],
        ];

        [$this->icon, $this->title, $this->message] = $map[$type] ?? ['🔔', 'Order Update', "Order {$order->order_number} was updated."];

        // Send Web Push to all subscribed devices (for installed PWA / closed browser)
        app(PushNotificationService::class)->sendToUser($order->user, [
            'title'    => $this->title,
            'body'     => $this->message,
            'url'      => "/orders/{$order->id}",
            'tag'      => "order-{$order->id}",
            'order_id' => $order->id,
        ]);
    }

    /**
     * Broadcast on a private channel scoped to the order's user.
     * Only the authenticated user who owns the order receives this event.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("orders.{$this->order->user_id}"),
        ];
    }

    /**
     * Data sent to the frontend via Pusher.
     */
    public function broadcastWith(): array
    {
        return [
            'id'               => $this->order->id,
            'order_number'     => $this->order->order_number,
            'type'             => $this->type,
            'title'            => $this->title,
            'message'          => $this->message,
            'icon'             => $this->icon,
            'delivery_status'  => $this->order->delivery_status,
        ];
    }

    public function broadcastAs(): string
    {
        return 'order.status.changed';
    }
}
