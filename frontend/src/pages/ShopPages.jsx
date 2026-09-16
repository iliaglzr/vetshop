import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Package,
  Plus,
  Minus,
  Truck,
  CreditCard,
  Building2,
  FileCheck2,
  Upload,
  ArrowRight,
  ShieldCheck,
  CircleDollarSign,
} from 'lucide-react';
import { api } from '../api';

const money = (n) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(n || 0)) + ' تومان';

const paymentMethods = [
  {
    value: 'bank_transfer',
    title: 'واریز بانکی',
    description: 'واریز مبلغ به حساب فروشگاه و ارسال تصویر فیش',
    icon: Building2,
    badge: 'فیش واریزی',
  },
  {
    value: 'check',
    title: 'پرداخت با چک',
    description: 'ارسال تصویر چک برای بررسی و تأیید مدیریت',
    icon: FileCheck2,
    badge: 'تصویر چک',
  },
  {
    value: 'online',
    title: 'پرداخت آنلاین',
    description: 'پرداخت مستقیم از طریق درگاه اینترنتی',
    icon: CreditCard,
    badge: 'درگاه آنلاین',
  },
];

export function Cart() {
  const [c, setC] = useState(null);
  const nav = useNavigate();

  const load = () =>
    api.get('/cart').then((r) => setC(r.data));

  useEffect(() => {
    load();
  }, []);

  if (!localStorage.getItem('token')) return <></>;

  const total =
    c?.items?.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    ) || 0;

  return (
    <section className="wrap section">
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">خرید</span>
          <h2>سبد خرید</h2>
        </div>
      </div>

      {!c?.items?.length ? (
        <div className="empty">
          سبد خرید شما خالی است.
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {c.items.map((i) => (
              <div className="cart-item" key={i.id}>
                <div>
                  <b>{i.product.name}</b>
                  <small>{money(i.unit_price)}</small>
                </div>

                <div className="qty">
                  <button
                    type="button"
                    onClick={async () => {
                      await api.patch('/cart/items/' + i.id, {
                        quantity: i.quantity + 1,
                      });
                      load();
                    }}
                  >
                    <Plus size={17} />
                  </button>

                  <b>{i.quantity}</b>

                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        i.quantity >
                        i.product.minimum_order_quantity
                      ) {
                        await api.patch('/cart/items/' + i.id, {
                          quantity: i.quantity - 1,
                        });
                      } else {
                        await api.delete('/cart/items/' + i.id);
                      }

                      load();
                    }}
                  >
                    <Minus size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <aside className="summary">
            <h3>خلاصه سفارش</h3>

            <p>
              تعداد اقلام:{' '}
              <strong>{c.items.length}</strong>
            </p>

            <div className="checkout-total">
              <span>مبلغ قابل پرداخت</span>
              <strong>{money(total)}</strong>
            </div>

            <button
              className="btn full"
              onClick={() => nav('/checkout')}
            >
              ادامه و ثبت سفارش
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}


/* =========================================================
   CHECKOUT
========================================================= */

export function Checkout() {
  const nav = useNavigate();

  const [method, setMethod] = useState('bank_transfer');

  const [form, setForm] = useState({
    province: '',
    city: '',
    address: '',
    postal_code: '',
    phone: '',
  });

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      const r = await api.post('/orders', {
        payment_method: method,
        shipping_address: form,
      });

      setOrder(r.data);
    } catch (e) {
      const errors = e.response?.data?.errors;

      const message = errors
        ? Object.values(errors).flat().join('\n')
        : e.response?.data?.message || 'ثبت سفارش ناموفق بود.';

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  /*
   * خیلی مهم:
   *
   * online:
   *      صفحه آپلود فیش باز نمی‌شود.
   *
   * bank_transfer:
   *      صفحه ارسال فیش باز می‌شود.
   *
   * check:
   *      صفحه ارسال تصویر چک باز می‌شود.
   */

  if (order) {
    if (order.payment_method === 'online') {
      return <OnlinePayment order={order} />;
    }

    return <PaymentUpload order={order} />;
  }

  return (
    <section className="wrap section">
      <div className="checkout-title">
        <span className="eyebrow">مرحله نهایی خرید</span>
        <h2>ثبت سفارش</h2>
        <p>
          اطلاعات ارسال و روش پرداخت خود را انتخاب کنید.
        </p>
      </div>

      <form className="checkout" onSubmit={submit}>

        {/* ================= ADDRESS ================= */}

        <div className="panel checkout-panel">
          <div className="payment-section-title">
            <div className="payment-section-icon">
              <Truck size={22} />
            </div>

            <div>
              <h3>آدرس ارسال</h3>
              <p>
                اطلاعات محل دریافت سفارش را وارد کنید.
              </p>
            </div>
          </div>

          <div className="checkout-fields">
            {Object.keys(form).map((key) => {
              const placeholders = {
                province: 'استان',
                city: 'شهر',
                address: 'آدرس کامل',
                postal_code: 'کد پستی',
                phone: 'شماره تماس',
              };

              return (
                <div
                  className={
                    key === 'address'
                      ? 'checkout-field checkout-field-full'
                      : 'checkout-field'
                  }
                  key={key}
                >
                  <label>{placeholders[key]}</label>

                  <input
                    value={form[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [key]: e.target.value,
                      })
                    }
                    placeholder={placeholders[key]}
                    required={key !== 'postal_code'}
                  />
                </div>
              );
            })}
          </div>
        </div>


        {/* ================= PAYMENT ================= */}

        <div className="panel checkout-panel">
          <div className="payment-section-title">
            <div className="payment-section-icon">
              <CircleDollarSign size={22} />
            </div>

            <div>
              <h3>روش پرداخت</h3>
              <p>
                یکی از روش‌های پرداخت را انتخاب کنید.
              </p>
            </div>
          </div>

          <div className="payment-methods">
            {paymentMethods.map((item) => {
              const Icon = item.icon;
              const active = method === item.value;

              return (
                <label
                  key={item.value}
                  className={`payment-method ${
                    active ? 'active' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={item.value}
                    checked={active}
                    onChange={() =>
                      setMethod(item.value)
                    }
                  />

                  <div className="payment-method-icon">
                    <Icon size={27} />
                  </div>

                  <div className="payment-method-content">
                    <div className="payment-method-top">
                      <strong>{item.title}</strong>
                      <span>{item.badge}</span>
                    </div>

                    <p>{item.description}</p>
                  </div>

                  <div className="payment-radio">
                    <span></span>
                  </div>
                </label>
              );
            })}
          </div>

          {method === 'bank_transfer' && (
            <div className="payment-info bank">
              <Building2 size={20} />

              <div>
                <strong>پرداخت از طریق واریز بانکی</strong>

                <p>
                  پس از ثبت سفارش، اطلاعات حساب نمایش داده
                  می‌شود و می‌توانید تصویر فیش واریزی را
                  ارسال کنید.
                </p>
              </div>
            </div>
          )}

          {method === 'check' && (
            <div className="payment-info check">
              <FileCheck2 size={20} />

              <div>
                <strong>پرداخت با چک</strong>

                <p>
                  پس از ثبت سفارش، تصویر چک را ارسال کنید
                  تا توسط مدیریت بررسی و تأیید شود.
                </p>
              </div>
            </div>
          )}

          {method === 'online' && (
            <div className="payment-info online">
              <ShieldCheck size={20} />

              <div>
                <strong>پرداخت امن آنلاین</strong>

                <p>
                  بعد از ثبت سفارش به مرحله پرداخت آنلاین
                  منتقل می‌شوید. در این روش نیازی به
                  ارسال فیش نیست.
                </p>
              </div>
            </div>
          )}

          <button
            className="btn full checkout-submit"
            disabled={loading}
          >
            {loading
              ? 'در حال ثبت سفارش...'
              : method === 'online'
              ? 'ادامه و پرداخت آنلاین'
              : 'ثبت سفارش و ادامه'}
          </button>
        </div>
      </form>
    </section>
  );
}


/* =========================================================
   PAYMENT UPLOAD
========================================================= */

function PaymentUpload({ order }) {
  const [file, setFile] = useState(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const isCheck = order.payment_method === 'check';

  async function send(e) {
    e.preventDefault();

    if (!file) {
      alert(
        isCheck
          ? 'لطفاً تصویر چک را انتخاب کنید.'
          : 'لطفاً تصویر فیش واریزی را انتخاب کنید.'
      );

      return;
    }

    if (loading) return;

    setLoading(true);

    const fd = new FormData();

    fd.append('receipt', file);

    /*
     * Backend فقط این دو مقدار را قبول می‌کند:
     *
     * bank_transfer
     * check
     */
    fd.append(
      'method',
      isCheck ? 'check' : 'bank_transfer'
    );

    try {
      await api.post(
        `/orders/${order.id}/payment`,
        fd,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setDone(true);
    } catch (e) {
      console.error(
        'PAYMENT UPLOAD ERROR:',
        e.response?.data
      );

      const errors = e.response?.data?.errors;

      const message = errors
        ? Object.values(errors).flat().join('\n')
        : e.response?.data?.message ||
          'ارسال مدرک پرداخت ناموفق بود.';

      alert(message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="payment-result-page">
        <div className="payment-success-card">

          <div className="payment-success-icon">
            <CheckCircle size={54} />
          </div>

          <span className="eyebrow">
            ارسال موفق
          </span>

          <h2>
            {isCheck
              ? 'تصویر چک ارسال شد'
              : 'فیش واریزی ارسال شد'}
          </h2>

          <p>
            مدرک پرداخت شما با موفقیت ثبت شد و در انتظار
            بررسی مدیریت است.
          </p>

          <div className="payment-order-box">
            <span>شماره سفارش</span>
            <strong>{order.order_number}</strong>
          </div>

          <div className="payment-result-actions">
            <Link className="btn" to="/orders">
              پیگیری سفارش
            </Link>

            <Link className="btn secondary-btn" to="/">
              بازگشت به فروشگاه
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="payment-page">
      <div className="payment-upload-card">

        <div className="payment-upload-header">

          <div className="payment-big-icon">
            {isCheck ? (
              <FileCheck2 size={34} />
            ) : (
              <Upload size={34} />
            )}
          </div>

          <div>
            <span className="eyebrow">
              مرحله پرداخت
            </span>

            <h2>
              {isCheck
                ? 'ارسال تصویر چک'
                : 'ارسال فیش واریزی'}
            </h2>

            <p>
              شماره سفارش:
              <strong> {order.order_number}</strong>
            </p>
          </div>
        </div>

        <div className="payment-upload-info">

          <div className="upload-info-item">
            <CheckCircle size={19} />
            <span>
              تصویر واضح و خوانا انتخاب کنید.
            </span>
          </div>

          <div className="upload-info-item">
            <CheckCircle size={19} />
            <span>
              حداکثر حجم فایل ۵ مگابایت است.
            </span>
          </div>

          <div className="upload-info-item">
            <CheckCircle size={19} />
            <span>
              فرمت‌های تصویری مانند JPG و PNG قابل قبول هستند.
            </span>
          </div>

        </div>

        <form onSubmit={send}>

          <label
            className={`upload-dropzone ${
              file ? 'has-file' : ''
            }`}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={(e) =>
                setFile(e.target.files?.[0] || null)
              }
              required
            />

            <Upload size={38} />

            {file ? (
              <>
                <strong>{file.name}</strong>

                <span>
                  فایل انتخاب شد. برای تغییر، کلیک کنید.
                </span>
              </>
            ) : (
              <>
                <strong>
                  انتخاب تصویر
                </strong>

                <span>
                  تصویر را انتخاب کنید یا با دوربین عکس بگیرید.
                </span>
              </>
            )}
          </label>

          {file && (
            <div className="selected-file">
              <span>{file.name}</span>

              <small>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </small>
            </div>
          )}

          <button
            className="btn full payment-upload-btn"
            disabled={loading}
          >
            {loading
              ? 'در حال ارسال...'
              : isCheck
              ? 'ارسال تصویر چک'
              : 'ارسال فیش برای تأیید'}
          </button>
        </form>

        <Link
          className="payment-back-link"
          to="/orders"
        >
          <ArrowRight size={17} />
          بازگشت به سفارش‌ها
        </Link>
      </div>
    </section>
  );
}


/* =========================================================
   ONLINE PAYMENT
========================================================= */

function OnlinePayment({ order }) {
  const [loading, setLoading] = useState(false);

  async function startPayment() {
    /*
     * درگاه واقعی در Backend باید اینجا اضافه شود.
     *
     * فعلاً سفارش ساخته شده و پرداخت آن pending است.
     */

    setLoading(true);

    try {
      /*
       * اگر بعداً API درگاه ساختی:
       *
       * const r = await api.post(
       *   `/orders/${order.id}/online-payment`
       * );
       *
       * window.location.href = r.data.payment_url;
       */

      alert(
        'درگاه پرداخت آنلاین هنوز به سرویس واقعی متصل نشده است.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="payment-page">
      <div className="online-payment-card">

        <div className="online-payment-icon">
          <CreditCard size={42} />
        </div>

        <span className="eyebrow">
          پرداخت آنلاین
        </span>

        <h2>
          آماده ورود به درگاه پرداخت
        </h2>

        <p>
          سفارش شما با موفقیت ایجاد شده است.
          برای پرداخت، وارد درگاه امن شوید.
        </p>

        <div className="online-order-info">
          <div>
            <span>شماره سفارش</span>
            <strong>{order.order_number}</strong>
          </div>

          <div>
            <span>مبلغ</span>
            <strong>{money(order.total)}</strong>
          </div>
        </div>

        <button
          className="btn full"
          onClick={startPayment}
          disabled={loading}
        >
          {loading
            ? 'در حال اتصال...'
            : 'ورود به درگاه پرداخت'}
        </button>

        <Link
          className="payment-back-link"
          to="/orders"
        >
          <ArrowRight size={17} />
          مشاهده سفارش
        </Link>
      </div>
    </section>
  );
}


/* =========================================================
   ORDERS
========================================================= */

export function Orders() {
  const [o, setO] = useState([]);

  useEffect(() => {
    api
      .get('/orders')
      .then((r) => setO(r.data.data || []));
  }, []);

  return (
    <section className="wrap section">
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">
            حساب کاربری
          </span>

          <h2>سفارش‌های من</h2>
        </div>
      </div>

      <div className="table">
        {o.map((x) => (
          <div className="tr" key={x.id}>
            <b>{x.order_number}</b>

            <span>{money(x.total)}</span>

            <span>{x.status}</span>

            <Link to={'/orders/' + x.id}>
              جزئیات
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}


/* =========================================================
   ORDER DETAIL
========================================================= */

export function OrderDetail({ id }) {
  const [o, setO] = useState(null);

  useEffect(() => {
    api
      .get('/orders/' + id)
      .then((r) => setO(r.data));
  }, [id]);

  return (
    <section className="wrap section">
      <h2>
        سفارش {o?.order_number}
      </h2>

      <div className="timeline">
        <span>ثبت سفارش</span>
        <span>تأیید پرداخت</span>
        <span>آماده‌سازی</span>
        <span>ارسال</span>
        <span>تحویل</span>
      </div>

      <div className="panel">
        {o?.items?.map((i) => (
          <div className="tr" key={i.id}>
            <span>{i.product_name}</span>

            <span>
              {i.quantity} عدد
            </span>

            <b>
              {money(i.total)}
            </b>
          </div>
        ))}

        <hr />

        <h3>
          {money(o?.total)}
        </h3>

        {o?.rejection_reason && (
          <p className="error">
            دلیل رد: {o.rejection_reason}
          </p>
        )}
      </div>
    </section>
  );
}


/* =========================================================
   DASHBOARD
========================================================= */

export function Dashboard() {
  const [u, setU] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/me').then((r) => setU(r.data));

    api
      .get('/orders')
      .then((r) =>
        setOrders(r.data.data || [])
      );
  }, []);

  return (
    <section className="wrap section">

      <div className="dashboard-head">
        <div>
          <span className="eyebrow">
            حساب کاربری
          </span>

          <h2>
            سلام {u?.name || 'کاربر'} 👋
          </h2>
        </div>

        <Link
          className="btn"
          to="/products"
        >
          خرید جدید
        </Link>
      </div>

      <div className="stats">

        <div>
          <Package />

          <b>{orders.length}</b>

          <span>سفارش</span>
        </div>

        <div>
          <Clock />

          <b>
            {
              orders.filter((x) =>
                x.status.includes('waiting')
              ).length
            }
          </b>

          <span>در انتظار</span>
        </div>

        <div>
          <Truck />

          <b>
            {
              orders.filter((x) =>
                ['shipped', 'delivered'].includes(
                  x.status
                )
              ).length
            }
          </b>

          <span>ارسال شده</span>
        </div>

      </div>

      <h3>آخرین سفارش‌ها</h3>

      <div className="table">
        {orders.map((o) => (
          <div
            className="tr"
            key={o.id}
          >
            <b>{o.order_number}</b>

            <span>
              {money(o.total)}
            </span>

            <span>
              {o.status}
            </span>

            <Link
              to={'/orders/' + o.id}
            >
              جزئیات
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}