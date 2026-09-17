import { Link } from 'react-router-dom';
import { ShoppingCart, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ cartCount }) {
  const { user, logout, dashboardPath } = useAuth();
  return <header><div className="wrap nav">
    <Link to="/" className="logo">Vet<span>Shop</span></Link>
    <nav>
      <Link to="/products">محصولات</Link>
      <Link to="/products?category=1">پت شاپ</Link>
      <Link to="/products?category=2">واکسن</Link>
      <Link to="/products?category=3">داروها</Link>
    </nav>
    <div className="nav-actions">
      <Link to="/cart" className="icon"><ShoppingCart /><b>{cartCount}</b></Link>
      {user ? <>
        <Link to={dashboardPath} title={user.role}><User /></Link>
        <button className="ghost" onClick={logout}><LogOut /></button>
      </> : <Link className="btn small" to="/login">ورود</Link>}
    </div>
  </div></header>;
}
