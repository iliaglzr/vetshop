<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductRole extends Model
{
    protected $fillable = ['product_id', 'role'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
