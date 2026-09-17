<?php

namespace App\Filters;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class ProductFilter
{
    public function __construct(
        private Request $request
    ) {
    }

    public function apply(Builder $query): Builder
    {
        $this->search($query);
        $this->category($query);
        $this->brand($query);
        $this->price($query);
        $this->stock($query);
        $this->sort($query);

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    private function search(Builder $query): void
    {
        $search = trim((string) $this->request->input('search'));

        if ($search === '') {
            return;
        }

        $query->where(function (Builder $q) use ($search) {

            $q->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")
                ->orWhere('short_description', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhereHas('brand', function (Builder $brand) use ($search) {
                    $brand->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('category', function (Builder $category) use ($search) {
                    $category->where('name', 'like', "%{$search}%");
                });

        });
    }

    /*
    |--------------------------------------------------------------------------
    | Category
    |--------------------------------------------------------------------------
    */

    private function category(Builder $query): void
    {
        $category = $this->request->input('category');

        if (!$category) {
            return;
        }

        $query->where('category_id', $category);
    }

    /*
    |--------------------------------------------------------------------------
    | Brand
    |--------------------------------------------------------------------------
    */

    private function brand(Builder $query): void
    {
        $brand = $this->request->input('brand');

        if (!$brand) {
            return;
        }

        $query->where('brand_id', $brand);
    }

    /*
    |--------------------------------------------------------------------------
    | Price
    |--------------------------------------------------------------------------
    */

    private function price(Builder $query): void
    {
        $minPrice = $this->request->input('min_price');
        $maxPrice = $this->request->input('max_price');

        if ($minPrice !== null && $minPrice !== '') {
            $query->where('price', '>=', $minPrice);
        }

        if ($maxPrice !== null && $maxPrice !== '') {
            $query->where('price', '<=', $maxPrice);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Stock
    |--------------------------------------------------------------------------
    */

    private function stock(Builder $query): void
    {
        $inStock = $this->request->input('in_stock');

        if ($inStock === '1') {
            $query->where('stock', '>', 0);
        }

        if ($inStock === '0') {
            $query->where('stock', '<=', 0);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

    private function sort(Builder $query): void
    {
        $sort = $this->request->input('sort', 'newest');

        switch ($sort) {

            case 'price_asc':
                $query->orderBy('price', 'asc');
                break;

            case 'price_desc':
                $query->orderBy('price', 'desc');
                break;

            case 'expiry_asc':
                $query->whereNotNull('expiration_date')
                    ->orderBy('expiration_date', 'asc');
                break;

            case 'expiry_desc':
                $query->whereNotNull('expiration_date')
                    ->orderBy('expiration_date', 'desc');
                break;

            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;

            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }
    }
}