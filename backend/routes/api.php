<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\{
    AuthController,
    ProductController,
    CartController,
    OrderController,
    AdminController,
    AdminUserController,
    StockRequestController,
    AdminStockRequestController
};


// =====================================================
// محصولات و دسته‌بندی‌ها
// =====================================================

Route::middleware('auth:sanctum')->group(function () {

    Route::get('/products', [ProductController::class, 'index']);

    Route::get('/products/{product}', [ProductController::class, 'show']);

    Route::get('/categories', [ProductController::class, 'categories']);

    Route::delete(
        '/products/{product}/images/{image}',
        [ProductController::class, 'deleteImage']
    );

    Route::get('/brands', [ProductController::class, 'brands']);
});


// =====================================================
// احراز هویت
// =====================================================

Route::post('/auth/register', [AuthController::class, 'register']);

Route::post('/auth/login', [AuthController::class, 'login']);


// =====================================================
// مسیرهای کاربران واردشده
// =====================================================

Route::middleware('auth:sanctum')->group(function () {

    // -------------------------
    // Auth
    // -------------------------

    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/me', [AuthController::class, 'me']);


    // -------------------------
    // Cart
    // -------------------------

    Route::get('/cart', [CartController::class, 'show']);

    Route::post('/cart/items', [CartController::class, 'add']);

    Route::patch('/cart/items/{item}', [CartController::class, 'update']);

    Route::delete('/cart/items/{item}', [CartController::class, 'remove']);


    // -------------------------
    // درخواست موجود شدن محصول
    // -------------------------

    Route::post(
        '/products/{product}/stock-request',
        [StockRequestController::class, 'store']
    );

    Route::get(
        '/products/{product}/stock-request',
        [StockRequestController::class, 'check']
    );

    Route::delete(
        '/products/{product}/stock-request',
        [StockRequestController::class, 'destroy']
    );


    // -------------------------
    // Orders
    // -------------------------

    Route::post('/orders', [OrderController::class, 'store']);

    Route::get('/orders', [OrderController::class, 'index']);

    Route::get('/orders/{order}', [OrderController::class, 'show']);

    Route::post(
        '/orders/{order}/payment',
        [OrderController::class, 'uploadPayment']
    );


    // =================================================
    // Admin
    // =================================================

    Route::middleware('role:admin')
        ->prefix('admin')
        ->group(function () {

            // -------------------------
            // Dashboard
            // -------------------------

            Route::get(
                '/dashboard',
                [AdminController::class, 'dashboard']
            );


            // -------------------------
            // Products
            // -------------------------

            Route::delete(
                '/products/{product}/images/{image}',
                [ProductController::class, 'deleteImage']
            );

            Route::apiResource(
                '/products',
                ProductController::class
            );

            Route::get(
                '/products-list',
                [AdminController::class, 'products']
            );

            Route::post(
                '/products/{product}/images',
                [ProductController::class, 'uploadImage']
            );
            // -------------------------
            // درخواست‌های موجود شدن
            // -------------------------

            Route::get(
                '/stock-requests',
                [AdminStockRequestController::class, 'index']
            );

            Route::get(
                '/stock-requests/product/{productId}',
                [AdminStockRequestController::class, 'productRequests']
            );

            Route::post(
                '/stock-requests/product/{productId}/notify',
                [AdminStockRequestController::class, 'notify']
            );

            Route::patch(
                '/stock-requests/{id}/cancel',
                [AdminStockRequestController::class, 'cancel']
            );


            // -------------------------
            // Orders
            // -------------------------

            Route::get(
                '/orders',
                [AdminController::class, 'orders']
            );

            Route::patch(
                '/orders/{order}',
                [AdminController::class, 'updateOrder']
            );


            // -------------------------
            // Payments
            // -------------------------

            Route::get(
                '/payments/pending',
                [AdminController::class, 'pendingPayments']
            );

            Route::post(
                '/payments/{payment}/approve',
                [AdminController::class, 'approvePayment']
            );

            Route::post(
                '/payments/{payment}/reject',
                [AdminController::class, 'rejectPayment']
            );


            // -------------------------
            // Inventory
            // -------------------------

            Route::post(
                '/inventory/{product}',
                [AdminController::class, 'adjustInventory']
            );


            // -------------------------
            // Users
            // -------------------------

            Route::get(
                '/users',
                [AdminUserController::class, 'index']
            );

            Route::patch(
                '/users/{user}/role',
                [AdminUserController::class, 'updateRole']
            );

            Route::patch(
                '/users/{user}/status',
                [AdminUserController::class, 'updateStatus']
            );

            Route::delete(
                '/users/{user}',
                [AdminUserController::class, 'destroy']
            );
        });
});
