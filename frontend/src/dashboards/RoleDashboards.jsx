import { Link } from 'react-router-dom';
import { Dog, Pill, Syringe, ShoppingCart, Package, ClipboardList, Search, User, Warehouse, CreditCard } from 'lucide-react';

const cards = {
  pet_shop: { title: 'پنل پت‌شاپ ', label: 'پت‌شاپ', icon: Dog, desc: 'محصولات مجاز پت‌شاپ را مشاهده و خرید کنید.' },
  pharmacy: { title: 'پنل داروخانه ', label: 'داروخانه', icon: Pill, desc: 'داروها، مکمل‌ها و تجهیزات مجاز داروخانه.' },
  vaccination: { title: 'پنل مرکز واکسیناسیون ', label: 'مرکز واکسیناسیون', icon: Syringe, desc: 'واکسن‌ها و تجهیزات مجاز مرکز واکسیناسیون.' },
};

export function RoleDashboard({ type }) {
  const C = cards[type];
  const Icon = C.icon;
  const category = type === 'vaccination' ? '4' : '';

  return (
    <section className="wrap section">
      <div className="dashboard-head">
        <div><span className="eyebrow">VetShop</span><h2>{C.title}</h2><p>{C.desc}</p></div>
        <span className="role-badge">{C.label}</span>
      </div>

      <div className="dashboard-grid">
        <Link to={`/products${category ? `?category=${category}` : ''}`} className="dashboard-card"><Search size={32}/><h3>محصولات مجاز</h3><p>مشاهده و جستجوی محصولات قابل خرید</p></Link>
        <Link to="/cart" className="dashboard-card"><ShoppingCart size={32}/><h3>سبد خرید</h3><p>افزایش، کاهش یا حذف اقلام</p></Link>
        <Link to="/orders" className="dashboard-card"><ClipboardList size={32}/><h3>سفارش‌های من</h3><p>مشاهده و پیگیری سفارش‌ها</p></Link>
        <Link to="/products" className="dashboard-card"><Package size={32}/><h3>کاتالوگ محصولات</h3><p>جستجو در تمام محصولاتی که Role شما اجازه دیدن آن‌ها را دارد</p></Link>
        <Link to="/dashboard" className="dashboard-card"><User size={32}/><h3>حساب کاربری</h3><p>بازگشت به داشبورد اصلی حساب</p></Link>
        <Link to="/products?in_stock=1" className="dashboard-card"><Warehouse size={32}/><h3>محصولات موجود</h3><p>نمایش محصولات دارای موجودی</p></Link>
      </div>
    </section>
  );
}

export function AdminDashboard(){
  return <section className="wrap section"><div className="dashboard-head"><div><span className="eyebrow">VetShop Admin</span><h2>پنل مدیریت </h2><p>مدیریت کامل کاربران، محصولات، انبار، سفارش‌ها و پرداخت‌ها</p></div><span className="role-badge admin">مدیر سیستم</span></div><div className="dashboard-grid"><Link to="/admin/users" className="dashboard-card"><User size={32}/><h3>مدیریت کاربران</h3><p>تغییر Role و وضعیت کاربران</p></Link><Link to="/admin/products" className="dashboard-card"><Package size={32}/><h3>مدیریت محصولات</h3><p>تصویر، قیمت، موجودی، انقضا و Roleهای مجاز</p></Link><Link to="/admin/inventory" className="dashboard-card"><Warehouse size={32}/><h3>مدیریت انبار</h3><p>افزایش و کاهش موجودی و ثبت دلیل</p></Link><Link to="/admin/orders" className="dashboard-card"><ShoppingCart size={32}/><h3>سفارشات</h3><p>بررسی و تغییر وضعیت سفارش‌ها</p></Link><Link to="/admin/payments" className="dashboard-card"><CreditCard size={32}/><h3>پرداخت‌ها</h3><p>مشاهده رسید و تأیید یا رد پرداخت</p></Link></div></section>
}
