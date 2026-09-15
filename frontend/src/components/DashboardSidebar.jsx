import { NavLink } from 'react-router-dom';

export default function DashboardSidebar({ items }) {
  return (
    <aside className="dashboard-sidebar">

      <div className="sidebar-logo">
        VetShop
      </div>

      <nav>
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              isActive ? 'sidebar-link active' : 'sidebar-link'
            }
          >
            {item.icon && <span>{item.icon}</span>}
            {item.label}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}