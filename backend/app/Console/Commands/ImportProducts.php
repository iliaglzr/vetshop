<?php

namespace App\Console\Commands;

use App\Imports\ProductsImport;
use Illuminate\Console\Command;
use Maatwebsite\Excel\Facades\Excel;

class ImportProducts extends Command
{
    /**
     * نام دستور
     */
    protected $signature = 'products:import
                            {file : مسیر فایل Excel}';

    /**
     * توضیحات دستور
     */
    protected $description = 'Import products and inventory from Excel';

    /**
     * اجرای Command
     */
    public function handle()
    {
        $file = $this->argument('file');

        if (!file_exists($file)) {

            $this->error("فایل پیدا نشد:");

            $this->error($file);

            return self::FAILURE;
        }

        $this->info('شروع Import...');
        $this->newLine();

        try {

            Excel::import(
                new ProductsImport(),
                $file
            );

            $this->newLine();

            $this->info(
                'Import با موفقیت انجام شد.'
            );

            return self::SUCCESS;

        } catch (\Throwable $e) {

            $this->newLine();

            $this->error(
                'خطا در Import:'
            );

            $this->error(
                $e->getMessage()
            );

            return self::FAILURE;
        }
    }
}