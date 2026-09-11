<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        /*
        |--------------------------------------------------------------------------
        | Payments
        |--------------------------------------------------------------------------
        */

        Schema::create('payments', function (Blueprint $t) {
            $t->id();

            $t->foreignId('order_id')
                ->constrained()
                ->cascadeOnDelete();

            $t->string('method');

            $t->decimal('amount', 14, 2);

            $t->string('status')
                ->default('pending');

            $t->string('receipt_path')
                ->nullable();

            $t->string('transaction_id')
                ->nullable();

            $t->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $t->timestamp('verified_at')
                ->nullable();

            $t->text('rejection_reason')
                ->nullable();

            $t->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Check Payments
        |--------------------------------------------------------------------------
        */

        Schema::create('check_payments', function (Blueprint $t) {
            $t->id();

            $t->foreignId('payment_id')
                ->constrained('payments')
                ->cascadeOnDelete();

            $t->string('check_number')
                ->nullable();

            $t->decimal('amount', 14, 2);

            $t->date('due_date')
                ->nullable();

            $t->string('image_path')
                ->nullable();

            $t->text('notes')
                ->nullable();

            $t->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Inventory Transactions
        |--------------------------------------------------------------------------
        */

        Schema::create('inventory_transactions', function (Blueprint $t) {
            $t->id();

            $t->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $t->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $t->string('type');

            $t->integer('quantity');

            $t->unsignedInteger('before_stock');

            $t->unsignedInteger('after_stock');

            $t->text('reason')
                ->nullable();

            $t->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Discounts
        |--------------------------------------------------------------------------
        */

        Schema::create('discounts', function (Blueprint $t) {
            $t->id();

            $t->string('name');

            $t->string('type');

            $t->decimal('value', 10, 2);

            $t->timestamp('starts_at');

            // Fixed: nullable to avoid MySQL invalid default-value issues
            $t->timestamp('ends_at')
                ->nullable();

            $t->foreignId('product_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $t->foreignId('category_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $t->foreignId('brand_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $t->boolean('is_active')
                ->default(true);

            $t->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Pre Invoices
        |--------------------------------------------------------------------------
        */

        Schema::create('pre_invoices', function (Blueprint $t) {
            $t->id();

            $t->foreignId('order_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $t->string('invoice_number')
                ->unique();

            $t->timestamp('issued_at');

            $t->string('pdf_path')
                ->nullable();

            $t->timestamps();
        });

        /*
        |--------------------------------------------------------------------------
        | Notifications
        |--------------------------------------------------------------------------
        */

        Schema::create('notifications', function (Blueprint $t) {
            $t->id();

            $t->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $t->string('title');

            $t->text('message');

            $t->string('type')
                ->nullable();

            $t->json('data')
                ->nullable();

            $t->timestamp('read_at')
                ->nullable();

            $t->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('pre_invoices');
        Schema::dropIfExists('discounts');
        Schema::dropIfExists('inventory_transactions');
        Schema::dropIfExists('check_payments');
        Schema::dropIfExists('payments');
    }
};