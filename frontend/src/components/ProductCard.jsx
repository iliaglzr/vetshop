import { useEffect, useState } from 'react';
import { Package, Bell } from 'lucide-react';
import { api } from '../api';


const money = n =>
  new Intl.NumberFormat('fa-IR').format(Math.round(n || 0)) + ' تومان';


function getCategoryLabel(product) {
  const slug = product?.category?.slug;

  const categories = {
    medicine: 'دارو',
    vaccine: 'واکسن',
    petshop: 'پت شاپ',
  };

  return categories[slug] || product?.category?.name || 'دسته‌بندی نامشخص';
}


export default function ProductCard({ p }) {
  const [busy, setBusy] = useState(false);
  const [stockRequested, setStockRequested] = useState(false);
  const [stockRequestLoading, setStockRequestLoading] = useState(false);


  // بررسی اینکه کاربر قبلاً برای این محصول درخواست موجود شدن داده یا نه
  useEffect(() => {
    async function checkStockRequest() {
      if (!p?.id || Number(p?.stock) > 0) {
        setStockRequested(false);
        return;
      }

      try {
        const res = await api.get(
          `/products/${p.id}/stock-request`
        );

        setStockRequested(!!res.data?.requested);
      } catch (e) {
        setStockRequested(false);
      }
    }

    checkStockRequest();
  }, [p?.id, p?.stock]);


  // افزودن محصول به سبد خرید
  async function add() {
    setBusy(true);

    try {
      await api.post('/cart/items', {
        product_id: p.id,
        quantity: p.minimum_order_quantity || 1,
      });

      alert('به سبد خرید اضافه شد');
    } catch (e) {
      alert(e.response?.data?.message || 'خطا');
    } finally {
      setBusy(false);
    }
  }


  // درخواست موجود شدن محصول
  async function requestStock() {
    setStockRequestLoading(true);

    try {
      const res = await api.post(
        `/products/${p.id}/stock-request`
      );

      setStockRequested(true);

      alert(
        res.data?.message ||
        'درخواست موجود شدن محصول ثبت شد.'
      );
    } catch (e) {
      alert(
        e.response?.data?.message ||
        'ثبت درخواست انجام نشد.'
      );

      // اگر محصول در همین فاصله موجود شده باشد،
      // وضعیت درخواست را دوباره بررسی می‌کنیم.
      if (e.response?.status === 422) {
        try {
          const check = await api.get(
            `/products/${p.id}/stock-request`
          );

          setStockRequested(!!check.data?.requested);
        } catch {}
      }
    } finally {
      setStockRequestLoading(false);
    }
  }


  const isOutOfStock = Number(p?.stock || 0) <= 0;


  return (
    <article className="card">

      <div className="pic">
        {p.main_image ? (
          <img
            src={p.main_image}
            alt={p.name}
          />
        ) : (
          <Package size={48} />
        )}

        {p.discount_percentage > 0 && (
          <span className="badge">
            {p.discount_percentage}% تخفیف
          </span>
        )}
      </div>


      <div className="card-body">

        <h3>{p.name}</h3>

        <p>
          {getCategoryLabel(p)}
        </p>


        <div className="price">
          {money(
            p.final_price ??
              p.price *
                (1 - (p.discount_percentage || 0) / 100)
          )}

          {p.old_price && (
            <del>
              {money(p.old_price)}
            </del>
          )}
        </div>


        <div className="stock">
          موجودی: {p.stock} | حداقل: {p.minimum_order_quantity}
        </div>


        {isOutOfStock ? (
          <button
            type="button"
            className={
              stockRequested
                ? 'btn full stock-requested-btn'
                : 'btn full stock-request-btn'
            }
            disabled={
              stockRequested ||
              stockRequestLoading
            }
            onClick={requestStock}
          >
            {stockRequestLoading ? (
              'در حال ثبت...'
            ) : stockRequested ? (
              <>
                ✓ درخواست ثبت شده
              </>
            ) : (
              <>
                <Bell size={17} />
                موجود شود
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="btn full"
            disabled={busy}
            onClick={add}
          >
            {busy
              ? '...'
              : 'افزودن به سبد'}
          </button>
        )}

      </div>
    </article>
  );
}