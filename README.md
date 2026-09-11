# VetShop — Laravel + React

فروشگاه دو پنله برای دارو، مکمل و تجهیزات دامپزشکی. این نسخه شامل اسکلت اجرایی Backend/Frontend، احراز هویت Sanctum، کاتالوگ، جستجو/فیلتر، سبد خرید، سفارش، پرداخت فیش/چک، تأیید اپراتور، کاهش تراکنشی موجودی، داشبورد کاربر و ادمین است.

## Backend
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
# در MySQL دیتابیس vetshop را بساز
php artisan migrate --seed
php artisan storage:link
php artisan serve
```
Admin: `admin@vetshop.test` / `Admin@12345`
User: `user@vetshop.test` / `User@12345`

## Frontend
```bash
cd frontend
npm install
npm run dev
```
در صورت نیاز `.env` بساز:
`VITE_API_URL=http://localhost:8000/api`

## پرداخت آنلاین
کلاس Gateway در این نسخه به شکل Service-ready طراحی شده اما برای اتصال واقعی به شاپرک باید مشخصات پذیرنده و مستندات درگاه انتخابی وارد شود؛ از قرار دادن Secret در Frontend خودداری شود.

## تصاویر فیش/چک
آپلودها روی disk `public` قرار می‌گیرند. برای محیط Production بهتر است disk خصوصی + endpoint احراز هویت‌شده برای مشاهده مدارک استفاده شود.
