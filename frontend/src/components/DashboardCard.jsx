import { Link } from 'react-router-dom';

export default function DashboardCard({
  title,
  value,
  link,
}) {
  return (
    <div className="dashboard-card">

      <h3>{title}</h3>

      <p>{value}</p>

      {link && (
        <Link
          to={link}
          className="btn"
        >
          ورود
        </Link>
      )}

    </div>
  );
}