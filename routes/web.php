<?php

use App\Http\Controllers\Admin\AdminSessionController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminOrderController;
use App\Http\Controllers\Admin\AdminProductController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\WishlistController;
use App\Http\Controllers\Admin\AdminReviewController;
use App\Http\Controllers\Admin\AdminCustomerController;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // Address book
    Route::post('/profile/addresses',                [ProfileController::class, 'storeAddress'])->name('profile.address.store');
    Route::patch('/profile/addresses/{id}',          [ProfileController::class, 'updateAddress'])->name('profile.address.update');
    Route::delete('/profile/addresses/{id}',         [ProfileController::class, 'destroyAddress'])->name('profile.address.destroy');
    Route::patch('/profile/addresses/{id}/default',  [ProfileController::class, 'setDefaultAddress'])->name('profile.address.setDefault');
});

Route::get('/shop', [ProductController::class, 'index'])->name('shop.index');
Route::get('/shop/{id}', [ProductController::class, 'show'])->name('shop.show');
Route::get('/', [HomeController::class, 'index'])->name('home');

Route::middleware(['auth'])->group(function () {
    Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
    Route::patch('/cart/{id}', [CartController::class, 'update'])->name('cart.update');
    Route::delete('/cart/{id}', [CartController::class, 'destroy'])->name('cart.destroy');
    Route::post('/cart/bulk-update', [CartController::class, 'bulkUpdate'])->name('cart.bulk-update');
    Route::post('/cart/bulk-save', [CartController::class, 'bulkSave'])->name('cart.bulk-save');
});

Route::middleware(['auth'])->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');

    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{id}/success', [OrderController::class, 'success'])->name('orders.success');
    Route::get('/orders/{id}', [OrderController::class, 'show'])->name('orders.show');
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');

    // Wishlist
    Route::get('/wishlist',              [WishlistController::class, 'index'])->name('wishlist.index');
    Route::post('/wishlist/toggle',      [WishlistController::class, 'toggle'])->name('wishlist.toggle');
    Route::delete('/wishlist/{id}',      [WishlistController::class, 'destroy'])->name('wishlist.destroy');

    // Reviews
    Route::post('/reviews',              [ReviewController::class, 'store'])->name('reviews.store');
    Route::delete('/reviews/{id}',       [ReviewController::class, 'destroy'])->name('reviews.destroy');
});

// ── Admin ─────────────────────────────────────────────────────────────────────
Route::prefix('admin')->name('admin.')->group(function () {

    Route::get('/login', [AdminSessionController::class, 'create'])->name('login');
    Route::post('/login', [AdminSessionController::class, 'store']);
    Route::post('/logout', [AdminSessionController::class, 'destroy'])->name('logout');

    Route::middleware('admin')->group(function () {
        // Dashboard
        Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Orders
        Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{id}', [AdminOrderController::class, 'show'])->name('orders.show');
        Route::patch('/orders/{id}/delivery', [AdminOrderController::class, 'updateDeliveryStatus'])->name('orders.updateDelivery');
        Route::post('/orders/{id}/cancel',   [AdminOrderController::class, 'cancel'])->name('orders.cancel');

        // Settings (brands, categories, genders, colors)
        Route::get('/settings',                          [\App\Http\Controllers\Admin\AdminSettingsController::class, 'index'])->name('settings.index');
        Route::post('/settings/{type}',                  [\App\Http\Controllers\Admin\AdminSettingsController::class, 'store'])->name('settings.store');
        Route::patch('/settings/{type}/{id}',            [\App\Http\Controllers\Admin\AdminSettingsController::class, 'update'])->name('settings.update');
        Route::delete('/settings/{type}/{id}',           [\App\Http\Controllers\Admin\AdminSettingsController::class, 'destroy'])->name('settings.destroy');

        // Products
        Route::get('/products',              [AdminProductController::class, 'index'])->name('products.index');
        Route::get('/products/create',       [AdminProductController::class, 'create'])->name('products.create');
        Route::post('/products',             [AdminProductController::class, 'store'])->name('products.store');
        Route::get('/products/{id}/edit',    [AdminProductController::class, 'edit'])->name('products.edit');
        Route::patch('/products/{id}',       [AdminProductController::class, 'update'])->name('products.update');
        Route::patch('/products/{id}/toggle',[AdminProductController::class, 'toggleActive'])->name('products.toggleActive');
        Route::delete('/products/{id}',      [AdminProductController::class, 'destroy'])->name('products.destroy');

        // Reviews
        Route::get('/reviews',                [AdminReviewController::class, 'index'])->name('reviews.index');
        Route::patch('/reviews/{id}/approve', [AdminReviewController::class, 'approve'])->name('reviews.approve');
        Route::delete('/reviews/{id}',        [AdminReviewController::class, 'reject'])->name('reviews.reject');

        // Customers
        Route::get('/customers',                     [AdminCustomerController::class, 'index'])->name('customers.index');
        Route::get('/customers/{id}',                [AdminCustomerController::class, 'show'])->name('customers.show');
        Route::patch('/customers/{id}/toggle-active',[AdminCustomerController::class, 'toggleActive'])->name('customers.toggleActive');
    });
});

require __DIR__.'/auth.php';
