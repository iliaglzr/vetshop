    <?php

    namespace App\Models;

    use Illuminate\Database\Eloquent\Model;
    use Illuminate\Database\Eloquent\SoftDeletes;

    class Product extends Model
    {
        use SoftDeletes;

        protected $fillable = [
            'name',
            'slug',
            'sku',
            'category_id',
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
        ];

        protected $casts = [
            'price' => 'decimal:2',
            'old_price' => 'decimal:2',
            'discount_percentage' => 'decimal:2',
            'expiration_date' => 'date',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ];

        public function category()
        {
            return $this->belongsTo(Category::class);
        }

        public function images()
        {
            return $this->hasMany(ProductImage::class);
        }

        public function inventoryTransactions()
        {
            return $this->hasMany(InventoryTransaction::class);
        }

        public function getFinalPriceAttribute()
        {
            return $this->discount_percentage > 0
                ? round($this->price * (1 - $this->discount_percentage / 100), 2)
                : $this->price;
        }
    }