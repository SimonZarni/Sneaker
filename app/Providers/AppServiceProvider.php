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
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Event::listen(OrderStatusChanged::class, SendOrderPushNotification::class);

        Vite::prefetch(concurrency: 3);

        // Force HTTPS in production so all generated URLs and asset paths
        // use https:// — prevents Mixed Content errors on Railway.
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
