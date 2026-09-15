import DashboardLayout from '../components/DashboardLayout';
import DashboardCard from '../components/DashboardCard';

export default function PetShopDashboard() {
  const items = [
    {
      label: 'داشبورد پت‌شاپ',
      path: '/dashboard/pet-shop',
    },
    {
      label: 'محصولات مجاز',
      path: '/dashboard/pet-shop/products',
    },
    {
      label: 'سفارش‌های پت‌شاپ',
      path: '/dashboard/pet-shop/orders',
    },
    {
      label: 'سبد خرید',
      path: '/cart',
    },
  ];

  return (
    <DashboardLayout
      title="پنل اختصاصی پت‌شاپ"
      sidebarItems={items}
    >

      <div className="dashboard-grid">

        <DashboardCard
          title="محصولات مجاز"
          value="مشاهده محصولات"
          link="/dashboard/pet-shop/products"
        />

        <DashboardCard
          title="سفارش‌ها"
          value="مشاهده سفارش‌ها"
          link="/dashboard/pet-shop/orders"
        />

        <DashboardCard
          title="خرید"
          value="رفتن به سبد خرید"
          link="/cart"
        />

      </div>

      <div className="role-notice">
        پت‌شاپ فقط محصولاتی را مشاهده می‌کند که
        برای پت‌شاپ مجاز شده‌اند.
      </div>

    </DashboardLayout>
  );
}