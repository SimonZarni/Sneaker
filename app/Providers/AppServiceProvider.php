<?php

namespace App\Providers;

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
        // REMOVED:
        // Event::listen(OrderStatusChanged::class, SendOrderPushNotification::class);
        //
        // Why:
        // In Laravel 11+ / newer app structure, listeners in app/Listeners
        // are discovered automatically. Keeping manual registration here can
        // make SendOrderPushNotification run twice, which sends duplicate FCM
        // pushes to the native app.

        Vite::prefetch(concurrency: 3);

        // Force HTTPS in production so all generated URLs and asset paths
        // use https:// — prevents Mixed Content errors on Railway.
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }
}
