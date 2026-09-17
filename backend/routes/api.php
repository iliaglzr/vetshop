<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{AuthController, ProductController, CartController, OrderController, AdminController, AdminUserController};

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}', [ProductController::class, 'show']);
    Route::get('/categories', [ProductController::class, 'categories']);
    Route::delete('/products/{product}/images/{image}',[ProductController::class, 'deleteImage']);
});
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'add']);
    Route::patch('/cart/items/{item}', [CartController::class, 'update']);
    Route::delete('/cart/items/{item}', [CartController::class, 'remove']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/payment', [OrderController::class, 'uploadPayment']);

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::delete('/products/{product}/images/{image}', [ProductController::class, 'deleteImage']);
        Route::apiResource('/products', ProductController::class);
        Route::get('/products-list', [AdminController::class, 'products']);
        Route::post('/products/{product}/images', [ProductController::class, 'uploadImage']);
        Route::get('/orders', [AdminController::class, 'orders']);
        Route::patch('/orders/{order}', [AdminController::class, 'updateOrder']);
        Route::get('/payments/pending', [AdminController::class, 'pendingPayments']);
        Route::post('/payments/{payment}/approve', [AdminController::class, 'approvePayment']);
        Route::post('/payments/{payment}/reject', [AdminController::class, 'rejectPayment']);
        Route::post('/inventory/{product}', [AdminController::class, 'adjustInventory']);
        Route::get('/users', [AdminUserController::class, 'index']);

        Route::patch('/users/{user}/role', [AdminUserController::class, 'updateRole']);
        Route::patch('/users/{user}/status', [AdminUserController::class, 'updateStatus']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
    });
});
