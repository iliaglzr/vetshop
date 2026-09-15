import DashboardSidebar from './DashboardSidebar';

export default function DashboardLayout({
  title,
  children,
  sidebarItems = [],
}) {
  return (
    <div className="dashboard-layout">

      <DashboardSidebar items={sidebarItems} />

      <main className="dashboard-content">

        <div className="dashboard-header">
          <h1>{title}</h1>
        </div>

        <div className="dashboard-body">
          {children}
        </div>

      </main>

    </div>
  );
}