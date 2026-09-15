import DashboardLayout from '../components/DashboardLayout';
import DashboardCard from '../components/DashboardCard';

export default function AdminDashboard() {
  const items = [
    {
      label: 'داشبورد',
      path: '/admin',
    },
    {
      label: 'مدیریت کاربران',
      path: '/admin/users',
    },
    {
      label: 'مدیریت محصولات',
      path: '/admin/products',
    },
    {
      label: 'موجودی انبار',
      path: '/admin/inventory',
    },
    {
      label: 'مدیریت سفارش‌ها',
      path: '/admin/orders',
    },
    {
      label: 'مدیریت پرداخت‌ها',
      path: '/admin/payments',
    },
  ];

  return (
    <DashboardLayout
      title="پنل مدیریت VetShop"
      sidebarItems={items}
    >

      <div className="dashboard-grid">

        <DashboardCard
          title="کاربران"
          value="مدیریت کاربران"
          link="/admin/users"
        />

        <DashboardCard
          title="محصولات"
          value="مدیریت محصولات"
          link="/admin/products"
        />

        <DashboardCard
          title="موجودی"
          value="مدیریت انبار"
          link="/admin/inventory"
        />

        <DashboardCard
          title="سفارش‌ها"
          value="مدیریت سفارش‌ها"
          link="/admin/orders"
        />

        <DashboardCard
          title="پرداخت‌ها"
          value="بررسی پرداخت‌ها"
          link="/admin/payments"
        />

      </div>

    </DashboardLayout>
  );
}