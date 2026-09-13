<?php

namespace App\Imports;
use App\Models\Product;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductsImport implements ToCollection, WithHeadingRow
{
    private int $totalRows = 0;
    private int $newProducts = 0;
    private int $updatedProducts = 0;
    private int $skippedRows = 0;
    private int $failedRows = 0;

    public function collection(Collection $rows): void
    {
        $this->totalRows = $rows->count();

        foreach ($rows as $index => $row) {

            try {

                $data = $row->toArray();

                /*
                |--------------------------------------------------------------------------
                | Excel Headers
                |--------------------------------------------------------------------------
                |
                | WithHeadingRow نام ستون‌های فارسی را به این شکل تبدیل کرده:
                |
                | نام کالا          => nam_kala
                | موجودی            => mogody
                | واحد کالا         => oahd_kala
                | توضیحات           => todyhat
                | فی فروش           => fy_frosh
                | مشخصات فنی 1      => mshkhsat_fny_1
                | مشخصات فنی 2      => mshkhsat_fny_2
                | دسته بندی         => dsth_bndy
                |
                */

                // ---------------------------------------------------------
                // نام کالا
                // ---------------------------------------------------------

                $name = trim(
                    (string) (
                        $data['nam_kala']
                        ?? $data['name']
                        ?? ''
                    )
                );

                if ($name === '') {
                    $this->skippedRows++;

                    echo "ردیف " . ($index + 2) . " رد شد: نام کالا خالی است.\n";

                    continue;
                }

                $normalizedName = $this->normalizeText($name);

                // حذف ردیف‌های Total / جمع
                if (
                    str_contains($normalizedName, 'جمع') ||
                    str_contains($normalizedName, 'total')
                ) {
                    $this->skippedRows++;

                    echo "ردیف " . ($index + 2) . " رد شد: ردیف جمع.\n";

                    continue;
                }

                // ---------------------------------------------------------
                // موجودی
                // ---------------------------------------------------------

                $stock = $this->toInt(
                    $data['mogody']
                    ?? $data['stock']
                    ?? 0
                );

                // ---------------------------------------------------------
                // واحد کالا
                // ---------------------------------------------------------

                $unit = trim(
                    (string) (
                        $data['oahd_kala']
                        ?? $data['unit']
                        ?? ''
                    )
                );

                // ---------------------------------------------------------
                // توضیحات / تاریخ انقضا
                // ---------------------------------------------------------

                $description = trim(
                    (string) (
                        $data['todyhat']
                        ?? $data['description']
                        ?? ''
                    )
                );

                // در فایل فعلی مقدار این ستون مثل 2028/06 است
                $expirationDate = $this->parseExpirationDate($description);

                // ---------------------------------------------------------
                // قیمت فروش
                // ---------------------------------------------------------

                $price = $this->toDecimal(
                    $data['fy_frosh']
                    ?? $data['قیمت فروش']
                    ?? $data['price']
                    ?? 0
                );

                $price = $price ?? 0;

                // ---------------------------------------------------------
                // قیمت مصرف کننده
                // ---------------------------------------------------------

                $consumerPrice = $this->toDecimal(
                    $data['gymt_msrf_knndh']
                    ?? $data['consumer_price']
                    ?? $data['old_price']
                    ?? null
                );

                // ---------------------------------------------------------
                // دسته بندی
                // ---------------------------------------------------------

                $categoryName = trim(
                    (string) (
                        $data['dsth_bndy']
                        ?? $data['category']
                        ?? ''
                    )
                );

                $categoryId = $this->getCategoryId($categoryName);

                if (!$categoryId) {

                    $this->skippedRows++;

                    echo "ردیف " . ($index + 2)
                        . " رد شد: دسته‌بندی پیدا نشد."
                        . " [{$categoryName}]"
                        . " - محصول: {$name}\n";

                    continue;
                }

                // ---------------------------------------------------------
                // مشخصات فنی 1
                // ---------------------------------------------------------

                $technical1 = trim(
                    (string) (
                        $data['mshkhsat_fny_1']
                        ?? ''
                    )
                );

                // ---------------------------------------------------------
                // مشخصات فنی 2
                // ---------------------------------------------------------

                $technical2 = trim(
                    (string) (
                        $data['mshkhsat_fny_2']
                        ?? ''
                    )
                );

                // ---------------------------------------------------------
                // ساخت توضیحات کامل
                // ---------------------------------------------------------

                $fullDescription = $description;

                if ($technical1 !== '') {
                    $fullDescription .=
                        ($fullDescription !== '' ? "\n" : '')
                        . "مشخصات فنی 1: "
                        . $technical1;
                }

                if ($technical2 !== '') {
                    $fullDescription .=
                        ($fullDescription !== '' ? "\n" : '')
                        . "مشخصات فنی 2: "
                        . $technical2;
                }

                $fullDescription = trim($fullDescription);

                // ---------------------------------------------------------
                // بررسی و ذخیره محصول
                // ---------------------------------------------------------

                DB::transaction(function () use (
                    $name,
                    $stock,
                    $unit,
                    $price,
                    $consumerPrice,
                    $categoryId,
                    $fullDescription,
                    $expirationDate
                ) {

                    // جستجوی محصول بر اساس نام
                    $product = Product::where('name', $name)->first();

                    // =====================================================
                    // محصول جدید
                    // =====================================================

                    if (!$product) {

                        $product = new Product();

                        $product->name = $name;

                        $product->slug =
                            $this->generateUniqueSlug($name);

                        $product->sku =
                            $this->generateSku($name);

                        $product->category_id = $categoryId;


                        $product->description =
                            $fullDescription !== ''
                                ? $fullDescription
                                : null;

                        $product->short_description = null;

                        $product->price = $price;

                        $product->old_price = $consumerPrice;

                        $product->discount_percentage = 0;

                        $product->stock = max(0, $stock);

                        $product->minimum_order_quantity = 1;

                        $product->minimum_stock = 5;

                        $product->expiration_date =
                            $expirationDate;

                        $product->weight = null;

                        $product->unit =
                            $unit !== ''
                                ? $unit
                                : null;

                        $product->main_image = null;

                        $product->status = 'active';

                        $product->is_featured = 0;

                        $product->is_active = 1;

                        $product->save();

                        // -------------------------------------------------
                        // ثبت موجودی اولیه
                        // -------------------------------------------------

                        if ($stock > 0) {

                            DB::table('inventory_transactions')->insert([
                                'product_id' => $product->id,
                                'user_id' => null,
                                'type' => 'import',
                                'quantity' => $stock,
                                'before_stock' => 0,
                                'after_stock' => $stock,
                                'reason' => 'ورود موجودی اولیه از فایل Excel',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }

                        $this->newProducts++;

                        echo "✓ محصول جدید اضافه شد: {$name}\n";

                    }

                    // =====================================================
                    // محصول موجود
                    // =====================================================

                    else {

                        $oldStock = (int) $product->stock;

                        $newStock = max(0, $stock);

                        // دسته‌بندی
                        $product->category_id = $categoryId;

                        // قیمت فروش
                        if ($price > 0) {
                            $product->price = $price;
                        }

                        // قیمت مصرف کننده
                        if ($consumerPrice !== null) {
                            $product->old_price =
                                $consumerPrice;
                        }

                        // واحد
                        if ($unit !== '') {
                            $product->unit = $unit;
                        }

                        // توضیحات
                        if ($fullDescription !== '') {
                            $product->description =
                                $fullDescription;
                        }

                        // تاریخ انقضا
                        if ($expirationDate !== null) {
                            $product->expiration_date =
                                $expirationDate;
                        }

                        // موجودی
                        $product->stock = $newStock;

                        $product->save();

                        // -------------------------------------------------
                        // ثبت تغییر موجودی
                        // -------------------------------------------------

                        if ($oldStock != $newStock) {

                            DB::table('inventory_transactions')->insert([
                                'product_id' => $product->id,
                                'user_id' => null,
                                'type' => 'import',
                                'quantity' => $newStock - $oldStock,
                                'before_stock' => $oldStock,
                                'after_stock' => $newStock,
                                'reason' => 'به‌روزرسانی موجودی از فایل Excel',
                                'created_at' => now(),
                                'updated_at' => now(),
                            ]);
                        }

                        $this->updatedProducts++;

                        echo "↻ محصول به‌روزرسانی شد: {$name}\n";
                    }
                });

            } catch (\Throwable $e) {

                $this->failedRows++;

                echo "✗ خطا در ردیف "
                    . ($index + 2)
                    . ":\n";

                echo $e->getMessage() . "\n";

                echo "----------------------------------------\n";
            }
        }

        // -------------------------------------------------------------
        // گزارش نهایی
        // -------------------------------------------------------------

        echo "\n";
        echo "========================================\n";
        echo "           گزارش نهایی Import\n";
        echo "========================================\n";

        echo "تعداد کل ردیف‌ها: "
            . $this->totalRows
            . "\n";

        echo "محصولات جدید: "
            . $this->newProducts
            . "\n";

        echo "محصولات به‌روزرسانی‌شده: "
            . $this->updatedProducts
            . "\n";

        echo "ردیف‌های رد شده: "
            . $this->skippedRows
            . "\n";

        echo "ردیف‌های دارای خطا: "
            . $this->failedRows
            . "\n";

        echo "========================================\n";
    }

    // =================================================================
    // Category
    // =================================================================

    private function getCategoryId(?string $categoryName): ?int
    {
        $categoryName =
            $this->normalizeText($categoryName);

        $categories = [

            // دارو
            'دارو' => 3,
            'medicine' => 3,

            // واکسن
            'واکسن' => 2,
            'vaccine' => 2,

            // پت شاپ
            'پت شاپ' => 1,
            'pet shop' => 1,
            'petshop' => 1,
        ];

        foreach ($categories as $name => $id) {

            if (
                $categoryName ===
                $this->normalizeText($name)
            ) {

                // اطمینان از وجود Category
                $exists = DB::table('categories')
                    ->where('id', $id)
                    ->exists();

                if (!$exists) {
                    return null;
                }

                return $id;
            }
        }

        return null;
    }

    // =================================================================
    // Generate SKU
    // =================================================================

    private function generateSku(string $name): string
    {
        $hash = strtoupper(
            substr(
                hash(
                    'sha256',
                    $this->normalizeText($name)
                ),
                0,
                10
            )
        );

        $sku = 'VET-' . $hash;

        $counter = 1;

        $originalSku = $sku;

        while (
            DB::table('products')
                ->where('sku', $sku)
                ->exists()
        ) {

            $sku =
                $originalSku
                . '-'
                . $counter;

            $counter++;
        }

        return $sku;
    }

    // =================================================================
    // Generate Unique Slug
    // =================================================================

    private function generateUniqueSlug(string $name): string
    {
        $base = Str::slug($name);

        // اگر Str::slug برای فارسی مقدار خالی برگرداند
        if ($base === '') {

            $base =
                'product-'
                . substr(
                    hash(
                        'sha256',
                        $this->normalizeText($name)
                    ),
                    0,
                    12
                );
        }

        $slug = $base;

        $counter = 1;

        while (
            DB::table('products')
                ->where('slug', $slug)
                ->exists()
        ) {

            $slug =
                $base
                . '-'
                . $counter;

            $counter++;
        }

        return $slug;
    }

    // =================================================================
    // Convert To Integer
    // =================================================================

    private function toInt($value): int
    {
        if (
            $value === null ||
            $value === ''
        ) {
            return 0;
        }

        if (is_numeric($value)) {
            return (int) $value;
        }

        $value = str_replace(
            [
                ',',
                '٬',
                ' ',
                '‌',
            ],
            '',
            (string) $value
        );

        // تبدیل اعداد فارسی به انگلیسی
        $value = strtr(
            $value,
            [
                '۰' => '0',
                '۱' => '1',
                '۲' => '2',
                '۳' => '3',
                '۴' => '4',
                '۵' => '5',
                '۶' => '6',
                '۷' => '7',
                '۸' => '8',
                '۹' => '9',
            ]
        );

        return (int) $value;
    }

    // =================================================================
    // Convert To Decimal
    // =================================================================

    private function toDecimal($value): ?float
    {
        if (
            $value === null ||
            $value === ''
        ) {
            return null;
        }

        // تبدیل اعداد فارسی
        $value = strtr(
            (string) $value,
            [
                '۰' => '0',
                '۱' => '1',
                '۲' => '2',
                '۳' => '3',
                '۴' => '4',
                '۵' => '5',
                '۶' => '6',
                '۷' => '7',
                '۸' => '8',
                '۹' => '9',
            ]
        );

        $value = str_replace(
            [
                ',',
                '٬',
                ' ',
                '‌',
            ],
            '',
            $value
        );

        if (!is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    // =================================================================
    // Parse Expiration Date
    // =================================================================

    private function parseExpirationDate($value): ?string
    {
        if (
            $value === null ||
            $value === ''
        ) {
            return null;
        }

        $value = trim((string) $value);

        // تبدیل اعداد فارسی
        $value = strtr(
            $value,
            [
                '۰' => '0',
                '۱' => '1',
                '۲' => '2',
                '۳' => '3',
                '۴' => '4',
                '۵' => '5',
                '۶' => '6',
                '۷' => '7',
                '۸' => '8',
                '۹' => '9',
            ]
        );

        // فرمت:
        // 2028/06
        // 2028-06

        if (
            preg_match(
                '/^(\d{4})[\/\-](\d{1,2})$/',
                $value,
                $matches
            )
        ) {

            $year =
                (int) $matches[1];

            $month =
                (int) $matches[2];

            if (
                $month >= 1 &&
                $month <= 12
            ) {

                return sprintf(
                    '%04d-%02d-01',
                    $year,
                    $month
                );
            }
        }

        // فرمت:
        // 2028/06/15
        // 2028-06-15

        if (
            preg_match(
                '/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/',
                $value,
                $matches
            )
        ) {

            $year =
                (int) $matches[1];

            $month =
                (int) $matches[2];

            $day =
                (int) $matches[3];

            if (
                checkdate(
                    $month,
                    $day,
                    $year
                )
            ) {

                return sprintf(
                    '%04d-%02d-%02d',
                    $year,
                    $month,
                    $day
                );
            }
        }

        return null;
    }

    // =================================================================
    // Normalize Persian Text
    // =================================================================

    private function normalizeText($text): string
    {
        $text = trim((string) $text);

        // تبدیل حروف عربی به فارسی
        $text = str_replace(
            [
                'ي',
                'ى',
                'ك',
            ],
            [
                'ی',
                'ی',
                'ک',
            ],
            $text
        );

        // حذف فاصله‌های اضافی
        $text = preg_replace(
            '/\s+/u',
            ' ',
            $text
        );

        return mb_strtolower($text);
    }
}