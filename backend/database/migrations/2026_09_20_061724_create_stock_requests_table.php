<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('status', [
                'pending',
                'notified',
                'cancelled',
            ])->default('pending');

            $table->timestamps();

            // هر کاربر برای هر محصول فقط یک درخواست فعال داشته باشد
            $table->unique([
                'user_id',
                'product_id',
                'status'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_requests');
    }
};