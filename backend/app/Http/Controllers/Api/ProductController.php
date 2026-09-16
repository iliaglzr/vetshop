<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\{Product, Category, ProductImage};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    private function visibleQuery(Request $r)
    {
        $q = Product::with(['category', 'brand', 'images', 'roles'])
            ->where('is_active', 1);

        // Product catalog is private. Routes also require auth:sanctum; this guard
        // keeps the controller safe if the method is ever called elsewhere.
        abort_unless($r->user(), 401, 'برای مشاهده محصولات ابتدا وارد حساب شوید.');

        if ($r->user() && !$r->user()->isAdmin()) {
            $q->where(function ($x) use ($r) {
                $x->whereDoesntHave('roles')
                    ->orWhereHas('roles', fn ($y) => $y->where('role', $r->user()->role));
            });
        }

        if ($r->filled('search')) {
            $s = str_replace(['ي', 'ى', 'ك'], ['ی', 'ی', 'ک'], $r->search);
            $q->where(function ($x) use ($s) {
                $x->whereRaw("REPLACE(REPLACE(REPLACE(name, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?", ["%{$s}%"])
                    ->orWhereRaw("REPLACE(REPLACE(REPLACE(sku, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?", ["%{$s}%"])
                    ->orWhereRaw("REPLACE(REPLACE(REPLACE(description, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?", ["%{$s}%"]);
            });
        }

        if ($r->filled('category_id')) $q->where('category_id', $r->category_id);
        if ($r->boolean('on_sale')) $q->where('discount_percentage', '>', 0);
        if ($r->boolean('in_stock')) $q->where('stock', '>', 0);
        if ($r->filled('min_price')) $q->where('price', '>=', $r->min_price);
        if ($r->filled('max_price')) $q->where('price', '<=', $r->max_price);

        return $q;
    }

    public function index(Request $r)
    {
        $q = $this->visibleQuery($r);
        $sort = $r->get('sort', 'newest');
        $q = $sort === 'price_asc'
            ? $q->orderBy('price')
            : ($sort === 'price_desc'
                ? $q->orderByDesc('price')
                : ($sort === 'discount'
                    ? $q->orderByDesc('discount_percentage')
                    : $q->latest()));

        return $q->paginate((int) $r->get('per_page', 12));
    }

    public function show(Request $r, Product $product)
    {
        abort_unless(
            $product->is_active &&
            ($r->user()->isAdmin() || $product->roles()->count() === 0 || $product->roles()->where('role', $r->user()->role)->exists()),
            403,
            'دسترسی به این محصول برای شما مجاز نیست.'
        );

        return $product->load(['category', 'brand', 'images', 'roles']);
    }

    public function categories()
    {
        return Category::where('is_active', 1)->with('children')->get();
    }

    public function store(Request $r)
    {
        $d = $r->validate([
            'name' => 'required',
            'sku' => 'required|unique:products,sku',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
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
            'allowed_roles' => 'nullable|array',
            'allowed_roles.*' => 'in:user,pet_shop,pharmacy,vaccination',
        ]);

        return DB::transaction(function () use ($d) {
            $roles = $d['allowed_roles'] ?? [];
            unset($d['allowed_roles']);
            $d['slug'] = Str::slug($d['name']) . '-' . Str::random(5);
            $p = Product::create($d);
            foreach ($roles as $role) $p->roles()->create(['role' => $role]);
            return $p->load('roles', 'images');
        });
    }

    public function update(Request $r, Product $product)
    {
        $d = $r->validate([
            'name' => 'sometimes|required',
            'sku' => 'sometimes|required|unique:products,sku,' . $product->id,
            'category_id' => 'sometimes|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
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
            'status' => 'nullable',
            'is_featured' => 'boolean',
            'is_active' => 'boolean',
            'allowed_roles' => 'nullable|array',
            'allowed_roles.*' => 'in:user,pet_shop,pharmacy,vaccination',
        ]);

        $roles = $d['allowed_roles'] ?? null;
        unset($d['allowed_roles']);
        $product->update($d);

        if ($roles !== null) {
            $product->roles()->delete();
            foreach ($roles as $role) $product->roles()->create(['role' => $role]);
        }

        return $product->fresh()->load(['category', 'brand', 'images', 'roles']);
    }

    public function uploadImage(Request $r, Product $product)
    {
        $d = $r->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        $path = $d['image']->store('products', 'public');
        $image = $product->images()->create([
            'path' => $path,
            'sort_order' => (int) $product->images()->max('sort_order') + 1,
        ]);

        if (!$product->getRawOriginal('main_image')) {
            $product->update(['main_image' => $path]);
        }

        return response()->json([
            'message' => 'تصویر محصول با موفقیت اضافه شد.',
            'image' => $image->fresh(),
            'product' => $product->fresh()->load(['images', 'roles']),
        ], 201);
    }

    public function destroy(Product $product)
    {
        foreach ($product->images as $image) {
            if ($image->path) Storage::disk('public')->delete($image->path);
        }
        $product->delete();
        return ['message' => 'حذف شد.'];
    }
}
