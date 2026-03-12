<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // ADD THIS: Global redirect configuration for Laravel 11
        $middleware->redirectTo(
            guests: '/login', // Where to send people who aren't logged in
            users: '/'        // Where to send people who ARE logged in (Home page)
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
