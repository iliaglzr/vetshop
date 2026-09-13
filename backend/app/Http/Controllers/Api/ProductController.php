<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{
    Product,
    Category,
    ProductImage,
    InventoryTransaction
};
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $r)
    {
        $q = Product::with(['category', 'images'])
            ->where('is_active', 1);

        if ($r->filled('search')) {
            $search = str_replace(
                ['ي', 'ى', 'ك'],
                ['ی', 'ی', 'ک'],
                $r->search
            );

            $q->where(function ($x) use ($search) {
                $x->whereRaw(
                    "REPLACE(REPLACE(REPLACE(name, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?",
                    ["%{$search}%"]
                )
                ->orWhereRaw(
                    "REPLACE(REPLACE(REPLACE(sku, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?",
                    ["%{$search}%"]
                )
                ->orWhereRaw(
                    "REPLACE(REPLACE(REPLACE(description, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?",
                    ["%{$search}%"]
                );
            });
        }

        if ($r->filled('category_id')) {
            $q->where('category_id', $r->category_id);
        }

        if ($r->boolean('on_sale')) {
            $q->where('discount_percentage', '>', 0);
        }

        if ($r->boolean('in_stock')) {
            $q->where('stock', '>', 0);
        }

        if ($r->filled('min_price')) {
            $q->where('price', '>=', $r->min_price);
        }

        if ($r->filled('max_price')) {
            $q->where('price', '<=', $r->max_price);
        }

        $sort = $r->get('sort', 'newest');

        $q = $sort === 'price_asc'
            ? $q->orderBy('price')
            : ($sort === 'price_desc'
                ? $q->orderByDesc('price')
                : ($sort === 'discount'
                    ? $q->orderByDesc('discount_percentage')
                    : $q->latest()));

        return $q->paginate(15);
    }

    public function show(Product $product)
    {
        return $product->load([
            'category',
            'images'
        ]);
    }

    public function categories()
    {
        return Category::where('is_active', 1)
            ->with('children')
            ->get();
    }

    public function store(Request $r)
    {
        $d = $r->validate([
            'name' => 'required',
            'sku' => 'required|unique:products',
            'category_id' => 'required|exists:categories,id',
            'description' => 'nullable',
            'short_description' => 'nullable',
            'price' => 'required|numeric|min:0',
            'old_price' => 'nullable|numeric',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'stock' => 'required|integer|min:0',
            'minimum_order_quantity' => 'required|integer|min:1',
            'minimum_stock' => 'nullable|integer|min:0',
            'expiration_date' => 'nullable|date',
            'weight' => 'nullable|numeric',
            'unit' => 'nullable',
            'status' => 'nullable',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $d['slug'] = Str::slug($d['name']) . '-' . Str::random(5);

        $p = Product::create($d);

        return response()->json($p, 201);
    }

    public function update(Request $r, Product $product)
    {
        $d = $r->validate([
            'name' => 'sometimes|required',
            'sku' => 'sometimes|required|unique:products,sku,' . $product->id,
            'category_id' => 'sometimes|exists:categories,id',
            'description' => 'nullable',
            'short_description' => 'nullable',
            'price' => 'sometimes|numeric|min:0',
            'old_price' => 'nullable|numeric',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'stock' => 'sometimes|integer|min:0',
            'minimum_order_quantity' => 'sometimes|integer|min:1',
            'minimum_stock' => 'nullable|integer|min:0',
            'expiration_date' => 'nullable|date',
            'weight' => 'nullable|numeric',
            'unit' => 'nullable',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $product->update($d);

        return $product->fresh();
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return [
            'message' => 'حذف شد.'
        ];
    }
}