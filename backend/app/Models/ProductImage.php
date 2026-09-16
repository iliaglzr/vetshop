<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImage extends Model {
    protected $fillable=['product_id','path','sort_order'];
    protected $appends=['url'];
    public function product(){return $this->belongsTo(Product::class);}
    public function getUrlAttribute(): ?string {
        if (!$this->path) return null;
        if (Str::startsWith($this->path, ['http://','https://'])) return $this->path;
        return url(Storage::disk('public')->url($this->path));
    }
}
