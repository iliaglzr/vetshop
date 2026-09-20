<?php

namespace App\Imports;

use App\Models\Product;
use App\Models\Brand;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class ProductsImport implements ToCollection, WithHeadingRow
{
    private int $totalRows = 0;
    private int $newProducts = 0;
    private int $updatedProducts = 0;
    private int $skippedRows = 0;
    private int $uploadedImages = 0;
    private int $missingImages = 0;

    private array $brandCache = [];
    private array $categoryCache = [];

    public function __construct()
    {
        /*
        |--------------------------------------------------------------------------
        | Category cache
        |--------------------------------------------------------------------------
        */

        $this->categoryCache = [
            ''          => 3,
            'medicine'  => 3,
            'vaccine'   => 2,
            'pet shop'  => 1,
            'petshop'   => 1,
        ];

        /*
        |--------------------------------------------------------------------------
        | Brand cache
        |--------------------------------------------------------------------------
        */

        Brand::query()
            ->get(['id', 'name', 'slug'])
            ->each(function ($brand) {
                $key = $this->normalizeText($brand->name);

                if ($key !== '') {
                    $this->brandCache[$key] = $brand;
                }
            });
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            $this->totalRows++;

            try {
                $this->importRow($row);
            } catch (\Throwable $e) {
                $this->skippedRows++;

                logger()->error('Product import error', [
                    'row'   => $this->totalRows,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        logger()->info('Products import finished', [
            'total_rows'       => $this->totalRows,
            'new_products'     => $this->newProducts,
            'updated_products' => $this->updatedProducts,
            'skipped_rows'     => $this->skippedRows,
            'uploaded_images'  => $this->uploadedImages,
            'missing_images'   => $this->missingImages,
        ]);
    }

    private function importRow($row): void
    {
        /*
        |--------------------------------------------------------------------------
        | Product name
        |--------------------------------------------------------------------------
        */

        $name = $this->getColumn($row, [
            'نام کالا',
            'نام كالا',
            'nam_kala',
            'name',
        ]);

        $name = trim((string) $name);

        if ($name === '') {
            $this->skippedRows++;
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Brand
        |--------------------------------------------------------------------------
        |
        | Excel فعلی بعد از WithHeadingRow ستون برند را به brnd
        | تبدیل می‌کند. بنابراین brnd بسیار مهم است.
        |
        */

        $brandName = trim((string) $this->getColumn($row, [
            'برند',
            'brand',
            'brnd',
            'brand_name',
        ]));

        $brand = null;

        if ($brandName !== '') {
            $brand = $this->findOrCreateBrand($brandName);
        }

        /*
        |--------------------------------------------------------------------------
        | Category
        |--------------------------------------------------------------------------
        */

        $categoryValue = $this->getColumn($row, [
            'دسته بندی',
            'دسته‌بندی',
            'دسته بندي',
            'دسته‌بندي',
            'category',
            'category_name',
            'dsth_bndy',
        ]);

        $categoryId = $this->normalizeCategory($categoryValue);

        /*
        |--------------------------------------------------------------------------
        | Stock
        |--------------------------------------------------------------------------
        */

        $stockValue = $this->getColumn($row, [
            'موجودی',
            'موجودی کالا',
            'mogody',
            'stock',
            'quantity',
        ]);

        $stock = $this->toInt($stockValue);

        /*
        |--------------------------------------------------------------------------
        | Unit
        |--------------------------------------------------------------------------
        */

        $unit = trim((string) $this->getColumn($row, [
            'واحد کالا',
            'واحد كالا',
            'oahd_kala',
            'unit',
        ]));

        /*
        |--------------------------------------------------------------------------
        | Description
        |--------------------------------------------------------------------------
        */

        $description = trim((string) $this->getColumn($row, [
            'توضیحات',
            'todyhat',
            'description',
        ]));

        /*
        |--------------------------------------------------------------------------
        | Technical specifications
        |--------------------------------------------------------------------------
        */

        $technical1 = trim((string) $this->getColumn($row, [
            'مشخصات فنی 1',
            'مشخصات فنی ۱',
            'mshkhsat_fny_1',
        ]));

        $technical2 = trim((string) $this->getColumn($row, [
            'مشخصات فنی 2',
            'مشخصات فنی ۲',
            'mshkhsat_fny_2',
        ]));

        $technicalParts = [];

        if ($technical1 !== '') {
            $technicalParts[] = 'مشخصات فنی 1: ' . $technical1;
        }

        if ($technical2 !== '') {
            $technicalParts[] = 'مشخصات فنی 2: ' . $technical2;
        }

        if (!empty($technicalParts)) {
            $description = trim(
                $description .
                ($description !== '' ? "\n\n" : '') .
                implode("\n", $technicalParts)
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Price
        |--------------------------------------------------------------------------
        */

        $priceValue = $this->getColumn($row, [
            'فی فروش',
            'fy frosh',
            'fy_frosh',
            'قیمت فروش',
            'price',
        ]);

        $price = $this->toDecimal($priceValue);

        /*
        |--------------------------------------------------------------------------
        | Discount
        |--------------------------------------------------------------------------
        */

        $discountValue = $this->getColumn($row, [
            'درصد تخفیف',
            'discount percentage',
            'discount_percentage',
        ]);

        $discount = $this->toDecimal($discountValue);

        /*
        |--------------------------------------------------------------------------
        | Minimum order
        |--------------------------------------------------------------------------
        */

        $minimumOrderValue = $this->getColumn($row, [
            'حداقل',
            'حداقل سفارش',
            'minimum_order_quantity',
        ]);

        $minimumOrder = $this->toInt($minimumOrderValue);

        if ($minimumOrder <= 0) {
            $minimumOrder = 1;
        }

        /*
        |--------------------------------------------------------------------------
        | Image path
        |--------------------------------------------------------------------------
        */

        $imagePath = trim((string) $this->getColumn($row, [
            'مسیر عکس',
            'مسیر تصویر',
            'مسیر عکس محصول',
            'عکس',
            'تصویر',
            'msyr_aaks',
            'image',
            'image_path',
            'main_image',
        ]));

        /*
        |--------------------------------------------------------------------------
        | Find existing product
        |--------------------------------------------------------------------------
        */

        $sku = $this->generateSku($name);

        $product = Product::withTrashed()
            ->where('sku', $sku)
            ->first();

        /*
        |--------------------------------------------------------------------------
        | If SKU wasn't found, try product name
        |--------------------------------------------------------------------------
        */

        if (!$product) {
            $product = Product::withTrashed()
                ->where('name', $name)
                ->first();
        }

        /*
        |--------------------------------------------------------------------------
        | Upload image
        |--------------------------------------------------------------------------
        */

        $uploadedImagePath = null;

        if ($imagePath !== '') {
            $uploadedImagePath = $this->uploadProductImage(
                $imagePath,
                $sku
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Create product
        |--------------------------------------------------------------------------
        */

        if (!$product) {
            $product = Product::create([
                'name'                   => $name,
                'slug'                   => $this->uniqueSlug($name),
                'sku'                    => $sku,
                'category_id'            => $categoryId,
                'brand_id'               => $brand?->id,
                'description'            => $description !== '' ? $description : null,
                'short_description'      => null,
                'price'                  => max(0, $price),
                'old_price'              => null,
                'discount_percentage'    => max(0, $discount),
                'stock'                  => max(0, $stock),
                'minimum_order_quantity' => $minimumOrder,
                'minimum_stock'          => 5,
                'expiration_date'        => null,
                'weight'                 => null,
                'unit'                   => $unit !== '' ? $unit : null,
                'main_image'             => $uploadedImagePath,
                'status'                 => 'active',
                'is_featured'            => false,
                'is_active'              => true,
            ]);

            $this->newProducts++;

            /*
            |--------------------------------------------------------------------------
            | Inventory transaction
            |--------------------------------------------------------------------------
            */

            if ($stock > 0) {
                DB::table('inventory_transactions')->insert([
                    'product_id' => $product->id,
                    'type'       => 'in',
                    'quantity'   => $stock,
                    'reference'  => 'Excel Import',
                    'notes'      => 'Initial stock from Excel import',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            logger()->info('Product imported', [
                'name'       => $name,
                'brand'      => $brandName,
                'brand_id'   => $brand?->id,
                'stock'      => $stock,
                'image'      => $uploadedImagePath,
            ]);

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Restore soft deleted product
        |--------------------------------------------------------------------------
        */

        if ($product->trashed()) {
            $product->restore();
        }

        /*
        |--------------------------------------------------------------------------
        | Existing stock
        |--------------------------------------------------------------------------
        */

        $oldStock = (int) $product->stock;
        $newStock = max(0, $stock);

        /*
        |--------------------------------------------------------------------------
        | Update existing product
        |--------------------------------------------------------------------------
        */

        $updateData = [
            'category_id'            => $categoryId,
            'description'            => $description !== ''
                ? $description
                : $product->description,
            'stock'                  => $newStock,
            'minimum_order_quantity' => $minimumOrder,
            'unit'                   => $unit !== ''
                ? $unit
                : $product->unit,
            'is_active'              => true,
        ];

        /*
        |--------------------------------------------------------------------------
        | Update price only when Excel has a valid price
        |--------------------------------------------------------------------------
        */

        if ($price > 0) {
            $updateData['price'] = $price;
        }

        /*
        |--------------------------------------------------------------------------
        | Update discount
        |--------------------------------------------------------------------------
        */

        if ($discount >= 0) {
            $updateData['discount_percentage'] = $discount;
        }

        /*
        |--------------------------------------------------------------------------
        | Update brand
        |--------------------------------------------------------------------------
        */

        if ($brand) {
            $updateData['brand_id'] = $brand->id;
        }

        /*
        |--------------------------------------------------------------------------
        | Update image
        |--------------------------------------------------------------------------
        */

        if ($uploadedImagePath) {
            $updateData['main_image'] = $uploadedImagePath;
        }

        $product->update($updateData);

        $this->updatedProducts++;

        /*
        |--------------------------------------------------------------------------
        | Inventory transaction when stock changes
        |--------------------------------------------------------------------------
        */

        if ($oldStock !== $newStock) {
            $difference = $newStock - $oldStock;

            DB::table('inventory_transactions')->insert([
                'product_id' => $product->id,
                'type'       => $difference > 0 ? 'in' : 'out',
                'quantity'   => abs($difference),
                'reference'  => 'Excel Import',
                'notes'      => "Stock changed from {$oldStock} to {$newStock}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        logger()->info('Product updated', [
            'name'       => $name,
            'brand'      => $brandName,
            'brand_id'   => $brand?->id,
            'stock'      => $newStock,
            'image'      => $uploadedImagePath,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Find or create brand
    |--------------------------------------------------------------------------
    */

    private function findOrCreateBrand(string $brandName): Brand
    {
        $brandName = trim($brandName);

        $normalized = $this->normalizeText($brandName);

        if ($normalized === '') {
            throw new \RuntimeException('Brand name is empty.');
        }

        /*
        |--------------------------------------------------------------------------
        | Check cache
        |--------------------------------------------------------------------------
        */

        if (isset($this->brandCache[$normalized])) {
            return $this->brandCache[$normalized];
        }

        /*
        |--------------------------------------------------------------------------
        | Check database
        |--------------------------------------------------------------------------
        */

        $brand = Brand::query()
            ->whereRaw(
                'LOWER(name) = ?',
                [mb_strtolower($brandName, 'UTF-8')]
            )
            ->first();

        /*
        |--------------------------------------------------------------------------
        | Create new brand
        |--------------------------------------------------------------------------
        */

        if (!$brand) {
            $slug = $this->uniqueBrandSlug($brandName);

            $brand = Brand::create([
                'name'      => $brandName,
                'slug'      => $slug,
                'logo'      => null,
                'is_active' => true,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Save in cache
        |--------------------------------------------------------------------------
        */

        $this->brandCache[$normalized] = $brand;

        return $brand;
    }

    /*
    |--------------------------------------------------------------------------
    | Upload product image
    |--------------------------------------------------------------------------
    */

    private function uploadProductImage(
        string $sourcePath,
        string $sku
    ): ?string {
        /*
        |--------------------------------------------------------------------------
        | Clean Excel path
        |--------------------------------------------------------------------------
        */

        $sourcePath = trim($sourcePath);

        // Remove quotes if Excel value contains them
        $sourcePath = trim($sourcePath, "\"'");

        /*
        |--------------------------------------------------------------------------
        | Convert Windows slashes
        |--------------------------------------------------------------------------
        */

        $sourcePath = str_replace(
            ['/', '\\'],
            DIRECTORY_SEPARATOR,
            $sourcePath
        );

        /*
        |--------------------------------------------------------------------------
        | Check absolute path
        |--------------------------------------------------------------------------
        */

        $possiblePaths = [
            $sourcePath,
        ];

        /*
        |--------------------------------------------------------------------------
        | If relative path, try project root
        |--------------------------------------------------------------------------
        */

        if (!$this->isAbsolutePath($sourcePath)) {
            $possiblePaths[] = base_path($sourcePath);
        }

        /*
        |--------------------------------------------------------------------------
        | Find actual file
        |--------------------------------------------------------------------------
        */

        $actualPath = null;

        foreach ($possiblePaths as $path) {
            if (is_file($path)) {
                $actualPath = $path;
                break;
            }
        }

        if (!$actualPath) {
            $this->missingImages++;

            logger()->warning('Product image not found', [
                'sku'  => $sku,
                'path' => $sourcePath,
            ]);

            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Detect extension
        |--------------------------------------------------------------------------
        */

        $extension = strtolower(
            pathinfo($actualPath, PATHINFO_EXTENSION)
        );

        $allowedExtensions = [
            'jpg',
            'jpeg',
            'png',
            'webp',
            'gif',
        ];

        if (!in_array($extension, $allowedExtensions, true)) {
            $this->missingImages++;

            logger()->warning('Unsupported product image format', [
                'sku'       => $sku,
                'path'      => $actualPath,
                'extension' => $extension,
            ]);

            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | Create unique filename
        |--------------------------------------------------------------------------
        */

        $filename = $sku . '.' . $extension;

        /*
        |--------------------------------------------------------------------------
        | Store in:
        | storage/app/public/products
        |--------------------------------------------------------------------------
        */

        $destination = 'products/' . $filename;

        try {
            $contents = file_get_contents($actualPath);

            if ($contents === false) {
                $this->missingImages++;

                logger()->warning('Could not read product image', [
                    'path' => $actualPath,
                ]);

                return null;
            }

            Storage::disk('public')->put(
                $destination,
                $contents
            );

            $this->uploadedImages++;

            logger()->info('Product image uploaded', [
                'source'      => $actualPath,
                'destination' => $destination,
                'sku'         => $sku,
            ]);

            return $destination;

        } catch (\Throwable $e) {
            $this->missingImages++;

            logger()->error('Product image upload failed', [
                'path'  => $actualPath,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Check Windows / Linux absolute path
    |--------------------------------------------------------------------------
    */

    private function isAbsolutePath(string $path): bool
    {
        return
            str_starts_with($path, DIRECTORY_SEPARATOR) ||
            preg_match('/^[A-Za-z]:[\/\\\\]/', $path) === 1;
    }

    /*
    |--------------------------------------------------------------------------
    | Generate SKU
    |--------------------------------------------------------------------------
    */

    private function generateSku(string $name): string
    {
        return 'VS-' . strtoupper(
            substr(
                md5($this->normalizeText($name)),
                0,
                10
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Unique product slug
    |--------------------------------------------------------------------------
    */

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'product-' . Str::random(8);
        }

        $slug = $base;
        $counter = 1;

        while (
            Product::withTrashed()
                ->where('slug', $slug)
                ->exists()
        ) {
            $slug = $base . '-' . $counter++;
        }

        return $slug;
    }

    /*
    |--------------------------------------------------------------------------
    | Unique brand slug
    |--------------------------------------------------------------------------
    */

    private function uniqueBrandSlug(string $name): string
    {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'brand-' . Str::random(8);
        }

        $slug = $base;
        $counter = 1;

        while (
            Brand::where('slug', $slug)->exists()
        ) {
            $slug = $base . '-' . $counter++;
        }

        return $slug;
    }

    /*
    |--------------------------------------------------------------------------
    | Get column with aliases
    |--------------------------------------------------------------------------
    */

    private function getColumn($row, array $keys): mixed
    {
        /*
        |--------------------------------------------------------------------------
        | First: direct column name
        |--------------------------------------------------------------------------
        */

        foreach ($keys as $key) {
            if (isset($row[$key])) {
                return $row[$key];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Second: normalized column name
        |--------------------------------------------------------------------------
        */

        $normalizedKeys = [];

        foreach ($keys as $key) {
            $normalizedKeys[] = $this->normalizeHeader((string) $key);
        }

        foreach ($row as $rowKey => $value) {
            $normalizedRowKey = $this->normalizeHeader(
                (string) $rowKey
            );

            if (in_array(
                $normalizedRowKey,
                $normalizedKeys,
                true
            )) {
                return $value;
            }
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Excel header
    |--------------------------------------------------------------------------
    */

    private function normalizeHeader(string $value): string
    {
        $value = trim($value);

        $value = str_replace(
            [
                'ي',
                'ى',
                'ك',
                'ۀ',
                'ة',
                'ؤ',
                'إ',
                'أ',
            ],
            [
                'ی',
                'ی',
                'ک',
                'ه',
                'ه',
                'و',
                'ا',
                'ا',
            ],
            $value
        );

        $value = str_replace(
            [
                "\u{200C}",
                "\u{200D}",
                '_',
                '-',
            ],
            ' ',
            $value
        );

        $value = preg_replace(
            '/\s+/u',
            ' ',
            $value
        );

        return mb_strtolower(
            trim($value),
            'UTF-8'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize text
    |--------------------------------------------------------------------------
    */

    private function normalizeText(string $value): string
    {
        $value = $this->normalizeHeader($value);

        return preg_replace(
            '/\s+/u',
            ' ',
            trim($value)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize category
    |--------------------------------------------------------------------------
    */

    private function normalizeCategory($value): int
    {
        $value = $this->normalizeText(
            (string) $value
        );

        return $this->categoryCache[$value] ?? 3;
    }

    /*
    |--------------------------------------------------------------------------
    | Convert Persian / Arabic digits to integer
    |--------------------------------------------------------------------------
    */

    private function toInt($value): int
    {
        if ($value === null || $value === '') {
            return 0;
        }

        $value = (string) $value;

        $value = strtr($value, [
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

            '٠' => '0',
            '١' => '1',
            '٢' => '2',
            '٣' => '3',
            '٤' => '4',
            '٥' => '5',
            '٦' => '6',
            '٧' => '7',
            '٨' => '8',
            '٩' => '9',
        ]);

        $value = str_replace(
            [
                ',',
                '٬',
                ' ',
            ],
            '',
            $value
        );

        return (int) preg_replace(
            '/[^0-9\-]/',
            '',
            $value
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Convert Persian / Arabic digits to decimal
    |--------------------------------------------------------------------------
    */

    private function toDecimal($value): float
    {
        if ($value === null || $value === '') {
            return 0;
        }

        $value = (string) $value;

        $value = strtr($value, [
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

            '٠' => '0',
            '١' => '1',
            '٢' => '2',
            '٣' => '3',
            '٤' => '4',
            '٥' => '5',
            '٦' => '6',
            '٧' => '7',
            '٨' => '8',
            '٩' => '9',

            '٫' => '.',
        ]);

        $value = str_replace(
            [
                ',',
                '٬',
                ' ',
            ],
            '',
            $value
        );

        $value = preg_replace(
            '/[^0-9.\-]/',
            '',
            $value
        );

        return (float) $value;
    }
}