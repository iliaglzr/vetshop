<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = ['name','slug','sku','category_id','brand_id','description','short_description','price','old_price','discount_percentage','stock','minimum_order_quantity','minimum_stock','expiration_date','weight','unit','main_image','status','is_featured','is_active'];
    protected $appends = ['final_price', 'allowed_roles'];

    protected $casts = ['price'=>'decimal:2','old_price'=>'decimal:2','discount_percentage'=>'decimal:2','expiration_date'=>'date','is_featured'=>'boolean','is_active'=>'boolean'];

    public function category(){ return $this->belongsTo(Category::class); }
    public function brand(){ return $this->belongsTo(Brand::class); }
    public function images(){ return $this->hasMany(ProductImage::class); }
    public function inventoryTransactions(){ return $this->hasMany(InventoryTransaction::class); }
    public function roles(){ return $this->hasMany(ProductRole::class); }

    public function getFinalPriceAttribute(){ return $this->discount_percentage > 0 ? round($this->price * (1 - $this->discount_percentage / 100), 2) : $this->price; }

    public function getAllowedRolesAttribute(): array
    {
        return $this->relationLoaded('roles')
            ? $this->roles->pluck('role')->values()->all()
            : $this->roles()->pluck('role')->values()->all();
    }

    public function getMainImageAttribute($value): ?string
    {
        if (!$value) return null;
        if (Str::startsWith($value, ['http://', 'https://'])) return $value;
        return url(Storage::disk('public')->url($value));
    }

    public function isAllowedFor(?User $user): bool
    {
        if (!$user) return false;
        if ($user->isAdmin()) return true;
        if ($this->roles()->count() === 0) return true;
        return $this->roles()->where('role', $user->role)->exists();
    }
}
