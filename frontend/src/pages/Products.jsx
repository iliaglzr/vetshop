import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [ps, setPs] = useState([]), [q, setQ] = useState('');
  const [params] = useSearchParams();
  async function load() {
    const r = await api.get('/products', { params: { search: q, in_stock: 1, category_id: params.get('category') || undefined } });
    setPs(r.data.data || []);
  }
  useEffect(() => { load(); }, [params.toString()]);
  return <section className="wrap section"><div className="section-head"><div><span className="eyebrow">کاتالوگ</span><h2>محصولات</h2></div></div><div className="filters"><div className="search"><Search /><input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="جستجوی نام، SKU یا توضیحات..." /><button onClick={load}>جستجو</button></div></div><div className="grid">{ps.map(p => <ProductCard key={p.id} p={p} />)}</div></section>;
}
