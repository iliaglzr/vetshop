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
    /**
     * محصولات قابل مشاهده برای کاربر فعلی
     *
     * vaccination -> vaccine + petshop
     * pharmacy    -> medicine + petshop
     * pet_shop    -> petshop
     * admin       -> همه
     */
    private function visibleQuery(Request $r)
    {
        // حتماً باید کاربر لاگین کرده باشد
        abort_unless(
            $r->user(),
            401,
            'برای مشاهده محصولات ابتدا وارد حساب شوید.'
        );

        $user = $r->user();

        $q = Product::with([
            'category',
            'brand',
            'images',
            'roles'
        ])->where('is_active', 1);

        /*
        |--------------------------------------------------------------------------
        | محدودیت دسته محصولات بر اساس نقش کاربر
        |--------------------------------------------------------------------------
        */

        if (!$user->isAdmin()) {

            switch ($user->role) {

                // مرکز واکسیناسیون:
                // واکسن + پت شاپ
                case 'vaccination':

                    $q->whereHas('category', function ($category) {
                        $category->whereIn('slug', [
                            'vaccine',
                            'petshop',
                        ]);
                    });

                    break;


                // داروخانه:
                // دارو + پت شاپ
                case 'pharmacy':

                    $q->whereHas('category', function ($category) {
                        $category->whereIn('slug', [
                            'medicine',
                            'petshop',
                        ]);
                    });

                    break;


                // پت شاپ:
                // فقط محصولات پت شاپ
                case 'pet_shop':

                    $q->whereHas('category', function ($category) {
                        $category->where('slug', 'petshop');
                    });

                    break;


                // کاربر عادی
                // فعلاً همان سیستم Role محصول را رعایت می‌کند
                case 'user':
                default:

                    // کاربر عادی به هیچ محصولی دسترسی ندارد
                    $q->whereRaw('1 = 0');

                    break;
            }


            /*
            |--------------------------------------------------------------------------
            | محدودیت Role خود محصول
            |--------------------------------------------------------------------------
            |
            | اگر محصول Role مشخص داشته باشد، فقط برای همان Roleها نمایش داده
            | می‌شود.
            |
            | اگر محصول هیچ Roleای نداشته باشد، برای Roleهای مجاز بالا قابل
            | مشاهده است.
            |
            */

            $q->where(function ($x) use ($user) {

                $x->whereDoesntHave('roles')

                    ->orWhereHas('roles', function ($y) use ($user) {
                        $y->where('role', $user->role);
                    });
            });
        }


        /*
        |--------------------------------------------------------------------------
        | جستجو
        |--------------------------------------------------------------------------
        */

        if ($r->filled('search')) {

            $s = str_replace(
                ['ي', 'ى', 'ك'],
                ['ی', 'ی', 'ک'],
                $r->search
            );

            $q->where(function ($x) use ($s) {

                $x->whereRaw(
                    "REPLACE(REPLACE(REPLACE(name, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?",
                    ["%{$s}%"]
                )

                    ->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(sku, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?",
                        ["%{$s}%"]
                    )

                    ->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(description, 'ي', 'ی'), 'ى', 'ی'), 'ك', 'ک') LIKE ?",
                        ["%{$s}%"]
                    );
            });
        }


        /*
        |--------------------------------------------------------------------------
        | فیلتر دسته‌بندی
        |--------------------------------------------------------------------------
        */

        if ($r->filled('category_id')) {

            $q->where('category_id', $r->category_id);
        }


        /*
        |--------------------------------------------------------------------------
        | سایر فیلترها
        |--------------------------------------------------------------------------
        */

        if ($r->boolean('on_sale')) {

            $q->where('discount_percentage', '>', 0);
        }

        /*
         * توجه:
         * این شرط عمداً حفظ شده است.
         *
         * stock > -1 یعنی محصولات با موجودی صفر هم نمایش داده می‌شوند.
         */
        if ($r->boolean('in_stock')) {

            $q->where('stock', '>', -1);
        }

        if ($r->filled('min_price')) {

            $q->where('price', '>=', $r->min_price);
        }

        if ($r->filled('max_price')) {

            $q->where('price', '<=', $r->max_price);
        }


        return $q;
    }


    /**
     * لیست محصولات
     */
    public function index(Request $r)
{
    $q = $this->visibleQuery($r);

    $sort = $r->get('sort', 'newest');

    $q = match ($sort) {

        // قیمت: کم به زیاد
        'price_asc' =>
            $q->orderBy('price', 'asc'),

        // قیمت: زیاد به کم
        'price_desc' =>
            $q->orderBy('price', 'desc'),

        // بیشترین تخفیف
        'discount' =>
            $q->orderByDesc('discount_percentage'),

        // تاریخ انقضا: نزدیک‌ترین
        'expiry_asc' =>
            $q->whereNotNull('expiration_date')
              ->orderBy('expiration_date', 'asc'),

        // تاریخ انقضا: دورترین
        'expiry_desc' =>
            $q->whereNotNull('expiration_date')
              ->orderBy('expiration_date', 'desc'),

        // قدیمی‌ترین محصولات
        'oldest' =>
            $q->orderBy('created_at', 'asc'),

        // جدیدترین محصولات
        'newest' =>
            $q->orderBy('created_at', 'desc'),

        // اگر مقدار اشتباه بود
        default =>
            $q->orderBy('created_at', 'desc'),
    };

    return $q->paginate(
        (int) $r->get('per_page', 15)
    );
}


    /**
     * نمایش یک محصول
     */
    public function show(Request $r, Product $product)
    {
        $user = $r->user();

        abort_unless(
            $user,
            401,
            'برای مشاهده محصولات ابتدا وارد حساب شوید.'
        );


        /*
        |--------------------------------------------------------------------------
        | ادمین همه محصولات را می‌بیند
        |--------------------------------------------------------------------------
        */

        if ($user->isAdmin()) {

            abort_unless(
                $product->is_active,
                403,
                'این محصول فعال نیست.'
            );

            return $product->load([
                'category',
                'brand',
                'images',
                'roles'
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | بررسی دسته محصول
        |--------------------------------------------------------------------------
        */

        $categorySlug = optional($product->category)->slug;

        $allowedCategories = match ($user->role) {

            'vaccination' => [
                'vaccine',
                'petshop',
            ],

            'pharmacy' => [
                'medicine',
                'petshop',
            ],

            'pet_shop' => [
                'petshop',
            ],

            default => [],
        };


        abort_unless(
            $product->is_active &&
                in_array($categorySlug, $allowedCategories, true),
            403,
            'دسترسی به این محصول برای شما مجاز نیست.'
        );


        /*
        |--------------------------------------------------------------------------
        | بررسی Role خود محصول
        |--------------------------------------------------------------------------
        */

        $hasRoles = $product->roles()->exists();

        if ($hasRoles) {

            abort_unless(
                $product->roles()
                    ->where('role', $user->role)
                    ->exists(),
                403,
                'دسترسی به این محصول برای شما مجاز نیست.'
            );
        }


        return $product->load([
            'category',
            'brand',
            'images',
            'roles'
        ]);
    }


    /**
     * دسته‌بندی‌ها
     */
    public function categories()
    {
        return Category::where('is_active', 1)
            ->with('children')
            ->get();
    }


    /**
     * ایجاد محصول
     */
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

            'allowed_roles.*' =>
            'in:user,pet_shop,pharmacy,vaccination',

        ]);


        return DB::transaction(function () use ($d) {

            $roles = $d['allowed_roles'] ?? [];

            unset($d['allowed_roles']);

            $d['slug'] =
                Str::slug($d['name']) .
                '-' .
                Str::random(5);

            $p = Product::create($d);


            foreach ($roles as $role) {

                $p->roles()->create([
                    'role' => $role
                ]);
            }


            return $p->load(
                'roles',
                'images'
            );
        });
    }


    /**
     * ویرایش محصول
     */
    public function update(Request $r, Product $product)
    {
        $d = $r->validate([

            'name' => 'sometimes|required',

            'sku' =>
            'sometimes|required|unique:products,sku,' .
                $product->id,

            'category_id' =>
            'sometimes|exists:categories,id',

            'brand_id' =>
            'nullable|exists:brands,id',

            'description' => 'nullable',

            'short_description' => 'nullable',

            'price' =>
            'sometimes|numeric|min:0',

            'old_price' =>
            'nullable|numeric',

            'discount_percentage' =>
            'nullable|numeric|min:0|max:100',

            'stock' =>
            'sometimes|integer|min:0',

            'minimum_order_quantity' =>
            'sometimes|integer|min:1',

            'minimum_stock' =>
            'nullable|integer|min:0',

            'expiration_date' =>
            'nullable|date',

            'weight' =>
            'nullable|numeric',

            'unit' =>
            'nullable',

            'status' =>
            'nullable',

            'is_featured' =>
            'boolean',

            'is_active' =>
            'boolean',

            'allowed_roles' =>
            'nullable|array',

            'allowed_roles.*' =>
            'in:user,pet_shop,pharmacy,vaccination',

        ]);


        $roles = $d['allowed_roles'] ?? null;

        unset($d['allowed_roles']);


        $product->update($d);


        if ($roles !== null) {

            $product->roles()->delete();

            foreach ($roles as $role) {

                $product->roles()->create([
                    'role' => $role
                ]);
            }
        }


        return $product
            ->fresh()
            ->load([
                'category',
                'brand',
                'images',
                'roles'
            ]);
    }


    /**
     * آپلود تصویر محصول
     */
    public function uploadImage(
        Request $r,
        Product $product
    ) {

        $d = $r->validate([

            'image' =>
            'required|image|mimes:jpg,jpeg,png,webp|max:5120',

        ]);


        $path =
            $d['image']->store(
                'products',
                'public'
            );


        $image = $product
            ->images()
            ->create([

                'path' => $path,

                'sort_order' =>
                (int) $product
                    ->images()
                    ->max('sort_order') + 1,

            ]);


        if (!$product->getRawOriginal('main_image')) {

            $product->update([
                'main_image' => $path
            ]);
        }


        return response()->json([

            'message' =>
            'تصویر محصول با موفقیت اضافه شد.',

            'image' =>
            $image->fresh(),

            'product' =>
            $product
                ->fresh()
                ->load([
                    'images',
                    'roles'
                ]),

        ], 201);
    }



    /**
     * حذف محصول
     */
    public function destroy(Product $product)
    {
        foreach ($product->images as $image) {

            if ($image->path) {

                Storage::disk('public')
                    ->delete($image->path);
            }
        }


        $product->delete();


        return [
            'message' => 'حذف شد.'
        ];
    }
    /**
     * حذف تصویر محصول
     */
    public function deleteImage(
        Product $product,
        ProductImage $image
    ) {
        // بررسی اینکه تصویر متعلق به همین محصول باشد
        abort_unless(
            $image->product_id === $product->id,
            404,
            'تصویر متعلق به این محصول نیست.'
        );

        // بررسی اینکه آیا تصویر اصلی است
        $wasMainImage =
            $product->getRawOriginal('main_image') === $image->path;

        // حذف فایل فیزیکی از storage
        if ($image->path) {
            Storage::disk('public')->delete($image->path);
        }

        // حذف رکورد تصویر از دیتابیس
        $image->delete();

        // اگر تصویر اصلی حذف شده، یک تصویر دیگر را اصلی کن
        if ($wasMainImage) {

            $newMainImage = $product
                ->images()
                ->orderBy('sort_order')
                ->first();

            $product->update([
                'main_image' => $newMainImage?->path
            ]);
        }

        return response()->json([
            'message' => 'تصویر محصول با موفقیت حذف شد.',

            'product' => $product
                ->fresh()
                ->load([
                    'images',
                    'roles'
                ]),
        ]);
    }
}
