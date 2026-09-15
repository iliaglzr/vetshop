# VetShop — Laravel + React

این نسخه ساختار Frontend را از `main.jsx` جدا کرده و پنل‌های Role محور دارد، بدون اینکه جریان اصلی فروشگاه (محصولات، سبد، سفارش، پرداخت و داشبورد) حذف شود.

## Frontend

- `src/main.jsx` فقط entry point است.
- `src/App.jsx` مسیرها را مدیریت می‌کند.
- `src/components/` کامپوننت‌های مشترک.
- `src/pages/` صفحات عمومی و خرید.
- `src/dashboards/` داشبوردهای کاربر، پت‌شاپ، داروخانه و واکسیناسیون.
- `src/admin/` صفحات مدیریت.
- `src/context/AuthContext.jsx` احراز هویت.
- `src/utils/roles.js` Roleها و مسیر داشبورد.

## Roleها

`user`, `pet_shop`, `pharmacy`, `vaccination`, `admin`

ثبت‌نام جدید همیشه `user` است و ادمین Role را تغییر می‌دهد.

## دسترسی محصول

هر محصول می‌تواند برای Roleهای مشخص مجاز شود. Laravel علاوه بر React این محدودیت را در API، سبد خرید و ثبت سفارش هم بررسی می‌کند.

## اجرا

Backend:

```powershell
cd backend
php artisan optimize:clear
php artisan migrate --seed
php artisan serve
```

Frontend:

```powershell
cd frontend
npm run dev
```

این بسته شامل `frontend/node_modules` و `backend/vendor` موجود در نسخه ارسالی است؛ روی همان سیستم لازم نیست برای شروع دوباره `npm install` انجام شود. اگر `node_modules` از یک سیستم‌عامل متفاوت منتقل شده باشد، ممکن است وابستگی‌های native همان سیستم نیاز به بازسازی داشته باشند.

## حساب‌های تست

- admin@vetshop.test / Admin@12345
- petshop@vetshop.test / PetShop@12345
- pharmacy@vetshop.test / Pharmacy@12345
- vaccination@vetshop.test / Vaccination@12345
- user@vetshop.test / User@12345
