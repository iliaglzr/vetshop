import DashboardLayout from '../components/DashboardLayout';
import DashboardCard from '../components/DashboardCard';

export default function VaccinationDashboard() {
  const items = [
    {
      label: 'داشبورد واکسیناسیون',
      path: '/dashboard/vaccination',
    },
    {
      label: 'واکسن‌ها',
      path: '/dashboard/vaccination/products',
    },
    {
      label: 'سفارش‌ها',
      path: '/dashboard/vaccination/orders',
    },
    {
      label: 'سبد خرید',
      path: '/cart',
    },
  ];

  return (
    <DashboardLayout
      title="پنل اختصاصی مرکز واکسیناسیون"
      sidebarItems={items}
    >

      <div className="dashboard-grid">

        <DashboardCard
          title="واکسن‌های مجاز"
          value="مشاهده واکسن‌ها"
          link="/dashboard/vaccination/products"
        />

        <DashboardCard
          title="تجهیزات مجاز"
          value="مشاهده تجهیزات"
          link="/products?category=equipment"
        />

        <DashboardCard
          title="سفارش‌ها"
          value="مشاهده سفارش‌ها"
          link="/dashboard/vaccination/orders"
        />

      </div>

      <div className="role-notice">
        این پنل مخصوص مراکز واکسیناسیون است و فقط
        محصولات مجاز این Role نمایش داده می‌شوند.
      </div>

    </DashboardLayout>
  );
}