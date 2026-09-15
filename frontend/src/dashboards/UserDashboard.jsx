import DashboardLayout from '../components/DashboardLayout';
import DashboardCard from '../components/DashboardCard';

export default function UserDashboard() {
  const items = [
    {
      label: 'داشبورد',
      path: '/dashboard',
    },
    {
      label: 'فروشگاه',
      path: '/products',
    },
    {
      label: 'سبد خرید',
      path: '/cart',
    },
    {
      label: 'سفارش‌های من',
      path: '/orders',
    },
  ];

  return (
    <DashboardLayout
      title="پنل کاربر"
      sidebarItems={items}
    >

      <div className="dashboard-grid">

        <DashboardCard
          title="محصولات"
          value="مشاهده محصولات"
          link="/products"
        />

        <DashboardCard
          title="سبد خرید"
          value="مشاهده سبد خرید"
          link="/cart"
        />

        <DashboardCard
          title="سفارش‌ها"
          value="سفارش‌های من"
          link="/orders"
        />

      </div>

    </DashboardLayout>
  );
}