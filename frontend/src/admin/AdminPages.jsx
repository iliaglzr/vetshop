import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ROLE_LABELS } from '../utils/roles';

const STATUSES = [
  'pending', 'waiting_for_verification', 'waiting_for_check_verification',
  'confirmed', 'processing', 'preparing', 'shipped', 'delivered', 'cancelled', 'rejected',
];

const receiptUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `http://localhost:8000/storage/${path}`;
};

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const r = await api.get('/admin/users');
      setUsers(r.data.data || r.data || []);
    } catch (e) {
      alert(e.response?.data?.message || 'خطا در دریافت کاربران');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  async function changeRole(id, role) {
    try {
      setSaving(id);
      await api.patch(`/admin/users/${id}/role`, { role });
      await loadUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'تغییر Role انجام نشد');
    } finally {
      setSaving(null);
    }
  }

  async function changeStatus(user) {
    try {
      setSaving(user.id);
      await api.patch(`/admin/users/${user.id}/status`, { is_active: !user.is_active });
      await loadUsers();
    } catch (e) {
      alert(e.response?.data?.message || 'تغییر وضعیت انجام نشد');
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="wrap section">
      <div className="card">
        <div className="card-body">
          <div className="admin-section-header">
            <div>
              <h2 className="admin-section-title">مدیریت کاربران</h2>
              <p>Role و وضعیت هر کاربر را مستقیماً از همین بخش تغییر بده.</p>
            </div>
          </div>

          {loading ? <p>در حال دریافت...</p> : users.length === 0 ? <p>کاربری پیدا نشد.</p> : (
            <div className="table admin-table-scroll">
              <div className="tr admin-table-header admin-table-min-1050">
                <span>نام</span><span>ایمیل</span><span>موبایل</span><span>Role</span><span>سفارش‌ها</span><span>وضعیت</span><span>عملیات</span>
              </div>
              {users.map(u => (
                <div className="tr admin-table-min-1050" key={u.id}>
                  <span>{u.name}</span>
                  <span>{u.email}</span>
                  <span>{u.phone || '-'}</span>
                  <span>
                    <select value={u.role || 'user'} disabled={saving === u.id} onChange={e => changeRole(u.id, e.target.value)}>
                      {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </span>
                  <span>{u.orders_count ?? 0}</span>
                  <span>{u.is_active ? 'فعال' : 'غیرفعال'}</span>
                  <span>
                    <button className="btn small" disabled={saving === u.id} onClick={() => changeStatus(u)}>
                      {u.is_active ? 'غیرفعال کردن' : 'فعال کردن'}
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const loadProducts = async () => {
    try { setLoading(true); const r = await api.get('/admin/products-list', { params: { per_page: 100, ...(search ? { search } : {}) } }); setProducts(r.data.data || []); }
    catch (e) { alert(e.response?.data?.message || 'خطا در دریافت محصولات'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadProducts(); }, []);
  return <section className="wrap section"><div className="card"><div className="card-body"><div className="admin-section-header"><h2 className="admin-section-title">مدیریت محصولات</h2><Link className="btn" to="/admin/products/new">+ افزودن محصول</Link></div><div className="admin-product-search"><input className="admin-product-search-input" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') loadProducts(); }} placeholder="جستجوی نام یا SKU..."/><button className="btn" onClick={loadProducts}>جستجو</button></div>{loading ? <p>در حال دریافت...</p> : products.length === 0 ? <p>محصولی پیدا نشد.</p> : <div className="table admin-table-scroll"><div className="tr admin-table-header admin-table-min-1050"><span>تصویر</span><span>نام</span><span>SKU</span><span>موجودی</span><span>Roleهای مجاز</span><span>تاریخ انقضا</span><span>عملیات</span></div>{products.map(p => <div className="tr admin-table-min-1050" key={p.id}><span>{p.main_image ? <img className="admin-product-image" src={p.main_image} alt={p.name} /> : '-'}</span><span>{p.name}</span><span>{p.sku}</span><span>{p.stock}</span><span>{p.allowed_roles?.length ? p.allowed_roles.map(r => ROLE_LABELS[r] || r).join('، ') : 'همه کاربران'}</span><span>{p.expiration_date || '-'}</span><span><Link className="btn" to={`/admin/products/${p.id}`}>ویرایش</Link></span></div>)}</div>}</div></div></section>;
}

export function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadProducts = async () => {
    try { setLoading(true); const r = await api.get('/admin/products-list', { params: { per_page: 100 } }); setProducts(r.data.data || []); }
    catch (e) { alert(e.response?.data?.message || 'خطا در دریافت موجودی'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadProducts(); }, []);
  async function adjust(product) {
    const raw = window.prompt(`تغییر موجودی ${product.name} (مثلاً 10 یا -5)`);
    if (raw === null) return;
    const quantity = Number(raw);
    if (!Number.isInteger(quantity)) return alert('مقدار باید عدد صحیح باشد.');
    const reason = window.prompt('دلیل تغییر موجودی:');
    if (!reason) return;
    try { await api.post(`/admin/inventory/${product.id}`, { quantity, reason }); await loadProducts(); }
    catch (e) { alert(e.response?.data?.message || 'خطا در تغییر موجودی'); }
  }
  return <section className="wrap section"><div className="card"><div className="card-body"><h2>مدیریت انبار</h2>{loading ? <p>در حال دریافت...</p> : <div className="table admin-table-scroll"><div className="tr admin-table-header"><span>تصویر</span><span>محصول</span><span>موجودی</span><span>حداقل</span><span>تاریخ انقضا</span><span>عملیات</span></div>{products.map(p => <div className="tr" key={p.id}><span>{p.main_image ? <img className="admin-product-image" src={p.main_image} alt={p.name} /> : '-'}</span><span>{p.name}</span><span>{p.stock}</span><span>{p.minimum_stock}</span><span>{p.expiration_date || '-'}</span><span><button className="btn small" onClick={() => adjust(p)}>تغییر موجودی</button></span></div>)}</div>}</div></div></section>;
}

export function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadOrders = async () => {
    try { setLoading(true); const r = await api.get('/admin/orders'); setOrders(r.data.data || []); }
    catch (e) { alert(e.response?.data?.message || 'خطا در دریافت سفارش‌ها'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadOrders(); }, []);
  async function changeStatus(id, status) {
    try { await api.patch(`/admin/orders/${id}`, { status }); await loadOrders(); }
    catch (e) { alert(e.response?.data?.message || 'تغییر وضعیت انجام نشد'); }
  }
  return <section className="wrap section"><div className="card"><div className="card-body"><h2>مدیریت سفارش‌ها</h2>{loading ? <p>در حال دریافت...</p> : orders.length === 0 ? <p>سفارشی وجود ندارد.</p> : <div className="table admin-table-scroll"><div className="tr admin-table-header admin-table-min-900"><span>شماره</span><span>مشتری</span><span>مبلغ</span><span>پرداخت</span><span>وضعیت</span><span>عملیات</span></div>{orders.map(o => <div className="tr admin-table-min-900" key={o.id}><span>{o.order_number}</span><span>{o.user?.name || '-'}</span><span>{o.total}</span><span>{o.payments?.at(-1)?.status || '-'}</span><span><select value={o.status} onChange={e => changeStatus(o.id, e.target.value)}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></span><span>-</span></div>)}</div>}</div></div></section>;
}

export function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadPayments = async () => {
    try { setLoading(true); const r = await api.get('/admin/payments/pending'); setPayments(r.data.data || []); }
    catch (e) { alert(e.response?.data?.message || 'خطا در دریافت پرداخت‌ها'); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadPayments(); }, []);
  async function approve(id) {
    try { await api.post(`/admin/payments/${id}/approve`); await loadPayments(); }
    catch (e) { alert(e.response?.data?.message || 'تأیید پرداخت انجام نشد'); }
  }
  async function reject(id) {
    const reason = window.prompt('دلیل رد پرداخت:');
    if (!reason) return;
    try { await api.post(`/admin/payments/${id}/reject`, { reason }); await loadPayments(); }
    catch (e) { alert(e.response?.data?.message || 'رد پرداخت انجام نشد'); }
  }
  return <section className="wrap section"><div className="card"><div className="card-body"><h2>پرداخت‌های در انتظار</h2>{loading ? <p>در حال دریافت...</p> : payments.length === 0 ? <p>پرداختی برای بررسی وجود ندارد.</p> : <div className="admin-grid">{payments.map(p => { const image = receiptUrl(p.receipt_path); return <article className="card admin-order-card" key={p.id}><div className="card-body"><h3>سفارش {p.order?.order_number || `#${p.order_id}`}</h3><p>مشتری: {p.order?.user?.name || '-'}</p><p>مبلغ: {p.amount}</p><p>روش: {p.method || '-'}</p>{image && <div className="admin-receipt"><p>رسید / تصویر چک:</p><a href={image} target="_blank" rel="noreferrer"><img src={image} alt="رسید پرداخت" className="admin-receipt-image" /></a></div>}<div className="admin-product-actions"><button className="btn" onClick={() => approve(p.id)}>تأیید پرداخت</button><button className="btn btn-danger" onClick={() => reject(p.id)}>رد</button></div></div></article>; })}</div>}</div></div></section>;
}
