<?php

namespace App\Providers;

use App\Events\OrderStatusChanged;
use App\Listeners\SendOrderPushNotification;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Force HTTPS in production so all generated URLs and asset paths
        // use https:// — prevents Mixed Content errors on Railway.
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Send FCM + Web Push when an order status changes.
        // Registered as a listener (not in the event constructor) so a
        // push failure never blocks the Pusher broadcast.
        Event::listen(OrderStatusChanged::class, SendOrderPushNotification::class);
    }
}
