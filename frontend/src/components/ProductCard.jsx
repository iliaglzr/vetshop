import { useState } from 'react';
import { Package } from 'lucide-react';
import { api } from '../api';

const money = n => new Intl.NumberFormat('fa-IR').format(Math.round(n || 0)) + ' تومان';

export default function ProductCard({ p }) {
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    try {
      await api.post('/cart/items', { product_id: p.id, quantity: p.minimum_order_quantity || 1 });
      alert('به سبد خرید اضافه شد');
    } catch (e) {
      alert(e.response?.data?.message || 'خطا');
    } finally { setBusy(false); }
  }
  return <article className="card">
    <div className="pic">
      {p.main_image ? <img src={p.main_image} alt={p.name} /> : <Package size={48} />}
      {p.discount_percentage > 0 && <span className="badge">{p.discount_percentage}% تخفیف</span>}
    </div>
    <div className="card-body">
      <h3>{p.name}</h3>
      <p>{p.short_description || 'محصول باکیفیت دامپزشکی'}</p>
      <div className="price">{money(p.final_price ?? p.price * (1 - (p.discount_percentage || 0) / 100))} {p.old_price && <del>{money(p.old_price)}</del>}</div>
      <div className="stock">موجودی: {p.stock} | حداقل: {p.minimum_order_quantity}</div>
      <button className="btn full" disabled={busy || !p.stock} onClick={add}>{busy ? '...' : !p.stock ? 'ناموجود' : 'افزودن به سبد'}</button>
    </div>
  </article>;
}
