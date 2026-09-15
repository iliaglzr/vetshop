import DashboardLayout from '../components/DashboardLayout';
import DashboardCard from '../components/DashboardCard';

export default function PharmacyDashboard() {
  const items = [
    {
      label: 'داشبورد داروخانه',
      path: '/dashboard/pharmacy',
    },
    {
      label: 'داروها و محصولات مجاز',
      path: '/dashboard/pharmacy/products',
    },
    {
      label: 'سفارش‌های داروخانه',
      path: '/dashboard/pharmacy/orders',
    },
    {
      label: 'سبد خرید',
      path: '/cart',
    },
  ];

  return (
    <DashboardLayout
      title="پنل اختصاصی داروخانه"
      sidebarItems={items}
    >

      <div className="dashboard-grid">

        <DashboardCard
          title="محصولات مجاز داروخانه"
          value="مشاهده محصولات"
          link="/dashboard/pharmacy/products"
        />

        <DashboardCard
          title="سفارش‌ها"
          value="مشاهده سفارش‌ها"
          link="/dashboard/pharmacy/orders"
        />

        <DashboardCard
          title="سبد خرید"
          value="مشاهده سبد"
          link="/cart"
        />

      </div>

      <div className="role-notice">
        داروخانه به محصولات مخصوص مراکز
        واکسیناسیون دسترسی ندارد.
      </div>

    </DashboardLayout>
  );
}