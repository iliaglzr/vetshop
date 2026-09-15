import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [cartCount, setCartCount] = useState(0);
  const { user } = useAuth();
  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/cart').then(r => setCartCount(r.data.items?.reduce((s, i) => s + i.quantity, 0) || 0)).catch(() => {});
  }, [user]);
  return <><Header cartCount={cartCount} /><Outlet /><footer><div className="wrap"><b>VetShop</b><span>فروشگاه تخصصی دارو، مکمل و تجهیزات دامپزشکی</span></div></footer></>;
}
