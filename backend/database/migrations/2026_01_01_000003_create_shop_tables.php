<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        // جدول سبد خرید
        Schema::create('carts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $t->timestamps();
        });

        // جدول آیتم‌های سبد خرید
        Schema::create('cart_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->cascadeOnDelete();
            $t->unsignedInteger('quantity');
            $t->decimal('unit_price', 14, 2);
            $t->timestamps();
            $t->unique(['cart_id', 'product_id']);
        });

        // جدول آدرس‌ها
        Schema::create('addresses', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('title')->nullable();
            $t->string('province');
            $t->string('city');
            $t->text('address');
            $t->string('postal_code')->nullable();
            $t->string('phone');
            $t->timestamps();
        });

        // جدول سفارش‌ها
        Schema::create('orders', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->restrictOnDelete();
            $t->string('order_number')->unique();
            $t->string('status')->default('pending');
            $t->string('payment_method');
            $t->decimal('subtotal', 14, 2);
            $t->decimal('discount', 14, 2)->default(0);
            $t->decimal('total', 14, 2);
            $t->json('shipping_address');
            $t->text('rejection_reason')->nullable();
            $t->string('tracking_code')->nullable();
            $t->string('carrier')->nullable();
            $t->timestamp('shipped_at')->nullable();
            $t->timestamp('delivered_at')->nullable();
            $t->timestamps();
        });

        // جدول آیتم‌های سفارش
        Schema::create('order_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('order_id')->constrained()->cascadeOnDelete();
            $t->foreignId('product_id')->constrained()->restrictOnDelete();
            $t->string('product_name');
            $t->string('sku')->nullable();
            $t->unsignedInteger('quantity');
            $t->decimal('unit_price', 14, 2);
            $t->decimal('discount', 14, 2)->default(0);
            $t->decimal('total', 14, 2);
            $t->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        foreach (['order_items', 'orders', 'addresses', 'cart_items', 'carts'] as $x) {
            Schema::dropIfExists($x);
        }
    }
};
