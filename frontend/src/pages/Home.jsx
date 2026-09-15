import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [p, setP] = useState([]);
  useEffect(() => { api.get('/products', { params: { on_sale: 1 } }).then(r => setP(r.data.data || [])); }, []);
  return <><section className="hero"><div><span className="eyebrow">شرکت توزیع و پخش طب گشتر کاوه</span><h1>همه‌چیز برای سلامت و نگهداری دام</h1><p>دارو، مکمل و تجهیزات با مدیریت هوشمند موجودی و سفارش.</p><Link className="btn" to="/products">مشاهده محصولات</Link></div></section><section className="wrap section"><div className="section-head"><div><span className="eyebrow">پیشنهادات ویژه</span><h2>تخفیف‌های امروز</h2></div><Link to="/products">مشاهده همه</Link></div><div className="grid">{p.slice(0,4).map(x => <ProductCard key={x.id} p={x} />)}</div></section></>;
}
