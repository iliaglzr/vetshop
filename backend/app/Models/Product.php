<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'sku',
        'category_id',
        'brand_id',
        'description',
        'short_description',
        'price',
        'old_price',
        'discount_percentage',
        'stock',
        'minimum_order_quantity',
        'minimum_stock',
        'expiration_date',
        'weight',
        'unit',
        'main_image',
        'status',
        'is_featured',
        'is_active',
        'discount_type'
    ];

    protected $appends = [
        'final_price',
        'allowed_roles',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'old_price' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'expiration_date' => 'date',
        'is_featured' => 'boolean',
        'is_active' => 'boolean',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    public function roles()
    {
        return $this->hasMany(ProductRole::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Final price
    |--------------------------------------------------------------------------
    */

    public function getFinalPriceAttribute()
    {
        // تخفیف جنسی روی قیمت واحد تأثیری ندارد
        if ($this->discount_type === 'gift') {
            return $this->price;
        }

        // تخفیف درصدی
        if (
            $this->discount_type === 'percentage' &&
            $this->discount_percentage > 0
        ) {
            return round(
                $this->price * (
                    1 - $this->discount_percentage / 100
                ),
                2
            );
        }

        return $this->price;
    }

    /*
    |--------------------------------------------------------------------------
    | Allowed roles
    |--------------------------------------------------------------------------
    */

    public function getAllowedRolesAttribute(): array
    {
        return $this->relationLoaded('roles')
            ? $this->roles->pluck('role')->values()->all()
            : $this->roles()->pluck('role')->values()->all();
    }

    /*
    |--------------------------------------------------------------------------
    | Main image URL
    |--------------------------------------------------------------------------
    */

    public function getMainImageAttribute($value): ?string
    {
        if (empty($value)) {
            return null;
        }

        // اگر قبلاً URL کامل ذخیره شده باشد
        if (
            str_starts_with($value, 'http://') ||
            str_starts_with($value, 'https://')
        ) {
            return $value;
        }

        // ساخت URL از storage/public
        return asset('storage/' . ltrim($value, '/'));
    }

    /*
    |--------------------------------------------------------------------------
    | Permission
    |--------------------------------------------------------------------------
    */

    public function isAllowedFor(?User $user): bool
    {
        if (!$user) {
            return false;
        }

        if ($user->isAdmin()) {
            return true;
        }

        if ($this->roles()->count() === 0) {
            return true;
        }

        return $this->roles()
            ->where('role', $user->role)
            ->exists();
    }
    public function stockRequests()
    {
        return $this->hasMany(StockRequest::class);
    }
}
