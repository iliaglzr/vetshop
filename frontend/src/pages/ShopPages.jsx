import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Clock,
  Package,
  Plus,
  Minus,
  Truck,
} from 'lucide-react';

import { api } from '../api';


// =====================================================
// HELPERS
// =====================================================

const money = (n) =>
  new Intl.NumberFormat('fa-IR').format(
    Math.round(n || 0)
  ) + ' تومان';


// =====================================================
// CART
// =====================================================

export function Cart() {
  const [cart, setCart] = useState(null);
  const navigate = useNavigate();

  const loadCart = async () => {
    try {
      const response = await api.get('/cart');
      setCart(response.data);
    } catch (error) {
      console.error('Cart error:', error);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  if (!localStorage.getItem('token')) {
    return null;
  }

  const increaseQuantity = async (item) => {
    try {
      await api.patch(
        `/cart/items/${item.id}`,
        {
          quantity: item.quantity + 1,
        }
      );

      await loadCart();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'افزایش تعداد محصول انجام نشد.'
      );
    }
  };

  const decreaseQuantity = async (item) => {
    try {
      if (
        item.quantity >
        item.product.minimum_order_quantity
      ) {
        await api.patch(
          `/cart/items/${item.id}`,
          {
            quantity: item.quantity - 1,
          }
        );
      } else {
        await api.delete(
          `/cart/items/${item.id}`
        );
      }

      await loadCart();
    } catch (error) {
      alert(
        error.response?.data?.message ||
        'تغییر تعداد محصول انجام نشد.'
      );
    }
  };

  const total = cart?.items?.reduce(
    (sum, item) =>
      sum +
      item.unit_price * item.quantity,
    0
  ) || 0;

  return (
    <section className="wrap section">

      <h2>سبد خرید</h2>

      {!cart?.items?.length ? (

        <div className="empty">
          سبد خرید شما خالی است.
        </div>

      ) : (

        <div className="cart-layout">

          <div>

            {cart.items.map((item) => (

              <div
                className="cart-item"
                key={item.id}
              >

                <div>
                  <b>
                    {item.product.name}
                  </b>

                  <small>
                    {money(item.unit_price)}
                  </small>
                </div>

                <div className="qty">

                  <button
                    type="button"
                    onClick={() =>
                      increaseQuantity(item)
                    }
                  >
                    <Plus size={18} />
                  </button>

                  <b>
                    {item.quantity}
                  </b>

                  <button
                    type="button"
                    onClick={() =>
                      decreaseQuantity(item)
                    }
                  >
                    <Minus size={18} />
                  </button>

                </div>

              </div>

            ))}

          </div>

          <aside className="summary">

            <h3>
              خلاصه سفارش
            </h3>

            <p>
              تعداد اقلام: {cart.items.length}
            </p>

            <strong>
              {money(total)}
            </strong>

            <button
              className="btn full"
              type="button"
              onClick={() =>
                navigate('/checkout')
              }
            >
              ثبت سفارش
            </button>

          </aside>

        </div>

      )}

    </section>
  );
}


// =====================================================
// CHECKOUT
// =====================================================

export function Checkout() {

  const navigate = useNavigate();

  const [method, setMethod] =
    useState('bank_transfer');

  const [form, setForm] = useState({
    province: '',
    city: '',
    address: '',
    postal_code: '',
    phone: '',
  });

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const handleChange = (e) => {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  };

  async function submit(e) {

    e.preventDefault();

    setLoading(true);

    try {

      const response = await api.post(
        '/orders',
        {
          payment_method: method,
          shipping_address: form,
        }
      );

      setOrder(response.data);

    } catch (error) {

      const errors =
        error.response?.data?.errors;

      if (errors) {

        alert(
          Object.values(errors)
            .flat()
            .join('\n')
        );

      } else {

        alert(
          error.response?.data?.message ||
          'ثبت سفارش انجام نشد.'
        );

      }

    } finally {

      setLoading(false);

    }
  }

  if (order) {
    return (
      <PaymentUpload
        order={order}
      />
    );
  }

  return (
    <section className="wrap section">

      <h2>
        ثبت سفارش
      </h2>

      <form
        className="checkout"
        onSubmit={submit}
      >

        {/* =========================
            ADDRESS
        ========================= */}

        <div className="panel">

          <h3>
            آدرس ارسال
          </h3>

          {Object.keys(form).map(
            (key) => {

              const placeholders = {
                province: 'استان',
                city: 'شهر',
                address: 'آدرس کامل',
                postal_code: 'کد پستی',
                phone: 'شماره تماس',
              };

              return (
                <input
                  key={key}
                  type="text"
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  placeholder={
                    placeholders[key]
                  }
                  required={
                    key !== 'postal_code'
                  }
                />
              );

            }
          )}

        </div>


        {/* =========================
            PAYMENT
        ========================= */}

        <div className="panel">

          <h3>
            روش پرداخت
          </h3>

          {[
            [
              'bank_transfer',
              'شبا و ارسال فیش',
            ],
            [
              'check',
              'چک و ارسال تصویر',
            ],
            [
              'online',
              'پرداخت آنلاین',
            ],
          ].map(
            ([value, title]) => (

              <label
                className="radio"
                key={value}
              >

                <input
                  type="radio"
                  name="payment_method"
                  value={value}
                  checked={
                    method === value
                  }
                  onChange={() =>
                    setMethod(value)
                  }
                />

                {title}

              </label>

            )
          )}

          {method !== 'online' && (

            <p className="hint">
              پس از ثبت سفارش، تصویر
              فیش یا چک را ارسال کنید.
            </p>

          )}

          <button
            className="btn full"
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'در حال ثبت سفارش...'
              : 'ثبت سفارش'}
          </button>

        </div>

      </form>

    </section>
  );
}


// =====================================================
// PAYMENT UPLOAD
// =====================================================

function PaymentUpload({ order }) {

  const [file, setFile] =
    useState(null);

  const [done, setDone] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  async function send(e) {

    e.preventDefault();

    if (!file) {
      alert(
        'لطفاً فایل پرداخت را انتخاب کنید.'
      );

      return;
    }

    setLoading(true);

    const formData =
      new FormData();

    formData.append(
      'receipt',
      file
    );

    formData.append(
      'method',
      order.payment_method
    );

    try {

      await api.post(
        `/orders/${order.id}/payment`,
        formData
      );

      setDone(true);

    } catch (error) {

      alert(
        error.response?.data?.message ||
        'آپلود ناموفق بود.'
      );

    } finally {

      setLoading(false);

    }
  }

  if (done) {

    return (
      <section className="auth">

        <div className="panel center">

          <CheckCircle size={52} />

          <h2>
            در انتظار تأیید
          </h2>

          <p>
            مدرک پرداخت برای اپراتور
            ارسال شد.
          </p>

          <Link
            className="btn"
            to="/orders"
          >
            پیگیری سفارش
          </Link>

        </div>

      </section>
    );
  }

  return (
    <section className="auth">

      <form
        className="panel"
        onSubmit={send}
      >

        <h2>
          {order.payment_method === 'check'
            ? 'ارسال تصویر چک'
            : 'ارسال فیش واریزی'}
        </h2>

        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) =>
            setFile(
              e.target.files?.[0] || null
            )
          }
          required
        />

        <button
          className="btn full"
          type="submit"
          disabled={loading}
        >
          {loading
            ? 'در حال ارسال...'
            : 'ارسال برای تأیید'}
        </button>

      </form>

    </section>
  );
}


// =====================================================
// ORDERS
// =====================================================

export function Orders() {

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    api
      .get('/orders')
      .then((response) => {

        setOrders(
          response.data.data || []
        );

      })
      .catch((error) => {

        console.error(
          'Orders error:',
          error
        );

      })
      .finally(() => {

        setLoading(false);

      });

  }, []);

  return (
    <section className="wrap section">

      <h2>
        سفارش‌های من
      </h2>

      {loading ? (

        <div className="empty">
          در حال دریافت سفارش‌ها...
        </div>

      ) : orders.length === 0 ? (

        <div className="empty">
          هنوز سفارشی ثبت نکرده‌اید.
        </div>

      ) : (

        <div className="table">

          {orders.map((order) => (

            <div
              className="tr"
              key={order.id}
            >

              <b>
                {order.order_number}
              </b>

              <span>
                {money(order.total)}
              </span>

              <span>
                {order.status}
              </span>

              <Link
                to={`/orders/${order.id}`}
              >
                جزئیات
              </Link>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}


// =====================================================
// ORDER DETAIL
// =====================================================

export function OrderDetail({ id }) {

  const [order, setOrder] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {

    api
      .get(`/orders/${id}`)
      .then((response) => {

        setOrder(response.data);

      })
      .catch((error) => {

        console.error(
          'Order detail error:',
          error
        );

      })
      .finally(() => {

        setLoading(false);

      });

  }, [id]);

  if (loading) {

    return (
      <section className="wrap section">

        <div className="empty">
          در حال دریافت اطلاعات سفارش...
        </div>

      </section>
    );
  }

  if (!order) {

    return (
      <section className="wrap section">

        <div className="empty">
          سفارش پیدا نشد.
        </div>

      </section>
    );
  }

  return (
    <section className="wrap section">

      <h2>
        سفارش {order.order_number}
      </h2>

      <div className="timeline">

        <span>
          ثبت سفارش
        </span>

        <span>
          تأیید پرداخت
        </span>

        <span>
          آماده‌سازی
        </span>

        <span>
          ارسال
        </span>

        <span>
          تحویل
        </span>

      </div>

      <div className="panel">

        {order.items?.map(
          (item) => (

            <div
              className="tr"
              key={item.id}
            >

              <span>
                {item.product_name}
              </span>

              <span>
                {item.quantity} عدد
              </span>

              <b>
                {money(item.total)}
              </b>

            </div>

          )
        )}

        <hr />

        <h3>
          {money(order.total)}
        </h3>

        {order.rejection_reason && (

          <p className="error">

            دلیل رد:
            {' '}
            {order.rejection_reason}

          </p>

        )}

      </div>

    </section>
  );
}


// =====================================================
// OLD DASHBOARD
// =====================================================
//
// این کامپوننت را فعلاً نگه می‌داریم تا اگر جای دیگری
// از پروژه از آن استفاده شده بود، خطا ندهد.
//
// داشبورد اصلی جدید از UserDashboard.jsx استفاده می‌کند.
// =====================================================

export function Dashboard() {

  const [user, setUser] =
    useState(null);

  const [orders, setOrders] =
    useState([]);

  useEffect(() => {

    api
      .get('/me')
      .then((response) => {
        setUser(response.data);
      })
      .catch((error) => {
        console.error(error);
      });

    api
      .get('/orders')
      .then((response) => {

        setOrders(
          response.data.data || []
        );

      })
      .catch((error) => {
        console.error(error);
      });

  }, []);

  return (
    <section className="wrap section">

      <div className="dashboard-head">

        <div>

          <span className="eyebrow">
            حساب کاربری
          </span>

          <h2>
            سلام {user?.name || 'کاربر'} 👋
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

          <b>
            {orders.length}
          </b>

          <span>
            سفارش
          </span>
        </div>

        <div>
          <Clock />

          <b>
            {
              orders.filter(
                (order) =>
                  order.status?.includes(
                    'waiting'
                  )
              ).length
            }
          </b>

          <span>
            در انتظار
          </span>
        </div>

        <div>
          <Truck />

          <b>
            {
              orders.filter(
                (order) =>
                  [
                    'shipped',
                    'delivered',
                  ].includes(
                    order.status
                  )
              ).length
            }
          </b>

          <span>
            ارسال شده
          </span>
        </div>

      </div>

      <h3>
        آخرین سفارش‌ها
      </h3>

      <div className="table">

        {orders.map((order) => (

          <div
            className="tr"
            key={order.id}
          >

            <b>
              {order.order_number}
            </b>

            <span>
              {money(order.total)}
            </span>

            <span>
              {order.status}
            </span>

            <Link
              to={`/orders/${order.id}`}
            >
              جزئیات
            </Link>

          </div>

        ))}

      </div>

    </section>
  );
}