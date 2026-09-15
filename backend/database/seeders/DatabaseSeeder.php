<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\{User,Category,Brand,Product};
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $users=[
            ['name'=>'مدیر فروشگاه','email'=>'admin@vetshop.test','phone'=>'09120000000','password'=>'Admin@12345','role'=>'admin'],
            ['name'=>'کاربر نمونه','email'=>'user@vetshop.test','phone'=>'09121111111','password'=>'User@12345','role'=>'user'],
            ['name'=>'پت شاپ نمونه','email'=>'petshop@vetshop.test','phone'=>'09122222222','password'=>'PetShop@12345','role'=>'pet_shop'],
            ['name'=>'داروخانه نمونه','email'=>'pharmacy@vetshop.test','phone'=>'09123333333','password'=>'Pharmacy@12345','role'=>'pharmacy'],
            ['name'=>'مرکز واکسیناسیون نمونه','email'=>'vaccination@vetshop.test','phone'=>'09124444444','password'=>'Vaccination@12345','role'=>'vaccination'],
        ];
        foreach($users as $u){$password=$u['password'];unset($u['password']);User::updateOrCreate(['email'=>$u['email']],$u+['password'=>Hash::make($password),'is_active'=>true]);}

        $cats=[];
        foreach(['داروها','مکمل‌ها','تجهیزات','واکسن‌ها'] as $n){$cats[$n]=Category::updateOrCreate(['name'=>$n],['slug'=>Str::slug($n),'is_active'=>true]);}
        $brands=[];
        foreach(['VetLife','AnimalCare','FarmVet'] as $n){$brands[$n]=Brand::updateOrCreate(['name'=>$n],['slug'=>Str::slug($n),'is_active'=>true]);}

        $products=[
            ['name'=>'مکمل ویتامینی دام','slug'=>'vitamin-livestock','sku'=>'VS-1001','category_id'=>$cats['مکمل‌ها']->id,'brand_id'=>$brands['VetLife']->id,'description'=>'مکمل ویتامینی برای دام.','short_description'=>'محصول نمونه فروشگاه','price'=>1500000,'old_price'=>1700000,'discount_percentage'=>10,'stock'=>50,'minimum_order_quantity'=>1,'minimum_stock'=>10,'expiration_date'=>now()->addMonths(18),'unit'=>'بسته','is_featured'=>true,'roles'=>['pet_shop','pharmacy']],
            ['name'=>'تجهیزات معاینه دامپزشکی','slug'=>'vet-exam-kit','sku'=>'VS-1002','category_id'=>$cats['تجهیزات']->id,'brand_id'=>$brands['AnimalCare']->id,'description'=>'ست تجهیزات معاینه.','price'=>4200000,'stock'=>12,'minimum_order_quantity'=>1,'minimum_stock'=>3,'unit'=>'ست','roles'=>['pet_shop','pharmacy','vaccination']],
            ['name'=>'داروی دامپزشکی نمونه','slug'=>'vet-medicine','sku'=>'VS-1003','category_id'=>$cats['داروها']->id,'brand_id'=>$brands['FarmVet']->id,'description'=>'داروی دامپزشکی نمونه.','price'=>2200000,'stock'=>25,'minimum_order_quantity'=>1,'minimum_stock'=>5,'unit'=>'بسته','roles'=>['pharmacy']],
            ['name'=>'واکسن هاری دام و حیوانات','slug'=>'rabies-vaccine','sku'=>'VS-1004','category_id'=>$cats['واکسن‌ها']->id,'brand_id'=>$brands['VetLife']->id,'description'=>'واکسن نمونه برای مراکز مجاز.','price'=>3100000,'stock'=>30,'minimum_order_quantity'=>1,'minimum_stock'=>5,'unit'=>'دوز','roles'=>['vaccination']],
        ];
        foreach($products as $data){$roles=$data['roles'];unset($data['roles']);$p=Product::updateOrCreate(['sku'=>$data['sku']],$data);$p->roles()->delete();foreach($roles as $role)$p->roles()->create(['role'=>$role]);}
    }
}
