<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Remove brand_id from products
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });

        // Remove brand_id from discounts
        Schema::table('discounts', function (Blueprint $table) {
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });

        // Remove brands table
        Schema::dropIfExists('brands');
    }

    public function down(): void
    {
        // Recreate brands table
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('logo')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Restore brand_id on products
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('brand_id')
                ->nullable()
                ->constrained('brands')
                ->nullOnDelete();
        });

        // Restore brand_id on discounts
        Schema::table('discounts', function (Blueprint $table) {
            $table->foreignId('brand_id')
                ->nullable()
                ->constrained('brands')
                ->cascadeOnDelete();
        });
    }
};