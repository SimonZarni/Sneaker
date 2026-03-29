<?php

namespace App\Events;

use App\Models\Order;
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
        // Only set properties here — no side effects in the constructor.
        // Push notifications (FCM + Web Push) are sent by
        // App\Listeners\SendOrderPushNotification which is registered in
        // AppServiceProvider. Keeping them out of the constructor ensures
        // a push failure never prevents the Pusher broadcast from firing.
        $map = [
            'confirmed'   => ['🎉', 'Order Confirmed',   "Order {$order->order_number} was placed successfully."],
            'processing'  => ['⚙️',  'Order Processing',  "Order {$order->order_number} is being prepared."],
            'shipped'     => ['📦', 'Order Shipped',     "Order {$order->order_number} is on its way to you."],
            'delivered'   => ['✅', 'Order Delivered',   "Order {$order->order_number} has arrived. Enjoy your kicks!"],
            'cancelled'   => ['❌', 'Order Cancelled',   "Order {$order->order_number} has been cancelled."],
        ];

        [$this->icon, $this->title, $this->message] = $map[$type] ?? ['🔔', 'Order Update', "Order {$order->order_number} was updated."];
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("orders.{$this->order->user_id}"),
        ];
    }

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
