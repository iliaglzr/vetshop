import { useEffect, useState } from 'react';
import { api } from '../api';
import { ROLE_LABELS } from '../utils/roles';


// =====================================================
// ADMIN USERS
// =====================================================

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    try {
      const response = await api.get('/admin/users');

      setUsers(
        response.data.data || response.data || []
      );
    } catch (error) {
      console.error('Admin users error:', error);

      alert(
        error.response?.data?.message ||
        'دریافت کاربران ناموفق بود.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const changeRole = async (id, role) => {
    try {
      await api.patch(
        `/admin/users/${id}/role`,
        { role }
      );

      await loadUsers();

    } catch (error) {
      alert(
        error.response?.data?.message ||
        'تغییر نقش کاربر انجام نشد.'
      );
    }
  };

  return (
    <section className="wrap section">

      <h2>
        مدیریت کاربران
      </h2>

      {loading ? (

        <div className="empty">
          در حال دریافت کاربران...
        </div>

      ) : users.length === 0 ? (

        <div className="empty">
          کاربری پیدا نشد.
        </div>

      ) : (

        <div className="table">

          {users.map((user) => (

            <div
              className="tr"
              key={user.id}
            >

              <b>
                {user.name}
              </b>

              <span>
                {user.email}
              </span>

              <select
                value={user.role}
                onChange={(e) =>
                  changeRole(
                    user.id,
                    e.target.value
                  )
                }
              >

                {Object.entries(
                  ROLE_LABELS
                ).map(
                  ([value, label]) => (

                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>

                  )
                )}

              </select>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}


// =====================================================
// ADMIN PRODUCTS
// =====================================================

export function AdminProducts() {
  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadProducts = async () => {
    try {

      const response = await api.get(
        '/products',
        {
          params: {
            per_page: 100,
          },
        }
      );

      setProducts(
        response.data.data || []
      );

    } catch (error) {

      console.error(
        'Admin products error:',
        error
      );

      alert(
        error.response?.data?.message ||
        'دریافت محصولات ناموفق بود.'
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <section className="wrap section">

      <div className="dashboard-head">

        <h2>
          مدیریت محصولات
        </h2>

      </div>

      {loading ? (

        <div className="empty">
          در حال دریافت محصولات...
        </div>

      ) : products.length === 0 ? (

        <div className="empty">
          محصولی پیدا نشد.
        </div>

      ) : (

        <div className="table">

          {products.map((product) => {

            const roles =
              product.allowed_roles ||
              product.roles?.map(
                (role) => role.role
              ) ||
              [];

            return (

              <div
                className="tr"
                key={product.id}
              >

                <b>
                  {product.name}
                </b>

                <span>
                  موجودی:
                  {' '}
                  {product.stock}
                </span>

                <span>
                  {roles.length
                    ? roles
                        .map(
                          (role) =>
                            ROLE_LABELS[role] ||
                            role
                        )
                        .join('، ')
                    : 'بدون دسترسی'}
                </span>

                <a
                  href={
                    `/admin/products/${product.id}`
                  }
                >
                  ویرایش
                </a>

              </div>

            );

          })}

        </div>

      )}

    </section>
  );
}


// =====================================================
// ADMIN INVENTORY
// =====================================================

export function AdminInventory() {

  const [products, setProducts] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadProducts = async () => {

    try {

      const response = await api.get(
        '/products',
        {
          params: {
            per_page: 100,
          },
        }
      );

      setProducts(
        response.data.data || []
      );

    } catch (error) {

      console.error(
        'Inventory error:',
        error
      );

      alert(
        error.response?.data?.message ||
        'دریافت موجودی ناموفق بود.'
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const adjustInventory = async (
    product
  ) => {

    const quantity = prompt(
      `تغییر موجودی ${product.name}\nمثلاً 10 یا -5`
    );

    if (quantity === null) {
      return;
    }

    const number =
      Number(quantity);

    if (
      Number.isNaN(number) ||
      number === 0
    ) {

      alert(
        'مقدار وارد شده معتبر نیست.'
      );

      return;
    }

    const reason = prompt(
      'دلیل تغییر موجودی:'
    );

    if (!reason) {
      return;
    }

    try {

      await api.post(
        `/admin/inventory/${product.id}`,
        {
          quantity: number,
          reason,
        }
      );

      await loadProducts();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        'تغییر موجودی انجام نشد.'
      );

    }
  };

  return (
    <section className="wrap section">

      <h2>
        مدیریت انبار
      </h2>

      {loading ? (

        <div className="empty">
          در حال دریافت موجودی...
        </div>

      ) : products.length === 0 ? (

        <div className="empty">
          محصولی پیدا نشد.
        </div>

      ) : (

        <div className="table">

          {products.map((product) => (

            <div
              className="tr"
              key={product.id}
            >

              <b>
                {product.name}
              </b>

              <span>
                موجودی:
                {' '}
                {product.stock}
              </span>

              <button
                type="button"
                className="btn small"
                onClick={() =>
                  adjustInventory(product)
                }
              >
                تغییر موجودی
              </button>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}


// =====================================================
// ADMIN ORDERS
// =====================================================

export function AdminOrders() {

  const [orders, setOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const statuses = [
    'pending',
    'waiting_for_verification',
    'waiting_for_check_verification',
    'confirmed',
    'processing',
    'preparing',
    'shipped',
    'delivered',
    'cancelled',
    'rejected',
  ];

  const loadOrders = async () => {

    try {

      const response =
        await api.get(
          '/admin/orders'
        );

      setOrders(
        response.data.data || []
      );

    } catch (error) {

      console.error(
        'Admin orders error:',
        error
      );

      alert(
        error.response?.data?.message ||
        'دریافت سفارش‌ها ناموفق بود.'
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const changeStatus = async (
    id,
    status
  ) => {

    try {

      await api.patch(
        `/admin/orders/${id}`,
        { status }
      );

      await loadOrders();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        'تغییر وضعیت سفارش انجام نشد.'
      );

    }
  };

  return (
    <section className="wrap section">

      <h2>
        مدیریت سفارشات
      </h2>

      {loading ? (

        <div className="empty">
          در حال دریافت سفارش‌ها...
        </div>

      ) : orders.length === 0 ? (

        <div className="empty">
          سفارشی وجود ندارد.
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
                {order.user?.name ||
                  '---'}
              </span>

              <span>
                {order.total}
              </span>

              <select
                value={order.status}
                onChange={(e) =>
                  changeStatus(
                    order.id,
                    e.target.value
                  )
                }
              >

                {statuses.map(
                  (status) => (

                    <option
                      key={status}
                      value={status}
                    >
                      {status}
                    </option>

                  )
                )}

              </select>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}


// =====================================================
// ADMIN PAYMENTS
// =====================================================

export function AdminPayments() {

  const [payments, setPayments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const loadPayments = async () => {

    try {

      const response =
        await api.get(
          '/admin/payments/pending'
        );

      setPayments(
        response.data.data || []
      );

    } catch (error) {

      console.error(
        'Admin payments error:',
        error
      );

      alert(
        error.response?.data?.message ||
        'دریافت پرداخت‌ها ناموفق بود.'
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const approvePayment = async (
    id
  ) => {

    try {

      await api.post(
        `/admin/payments/${id}/approve`
      );

      await loadPayments();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        'تأیید پرداخت انجام نشد.'
      );

    }
  };

  const rejectPayment = async (
    id
  ) => {

    const reason = prompt(
      'دلیل رد پرداخت:'
    );

    if (!reason) {
      return;
    }

    try {

      await api.post(
        `/admin/payments/${id}/reject`,
        {
          reason,
        }
      );

      await loadPayments();

    } catch (error) {

      alert(
        error.response?.data?.message ||
        'رد پرداخت انجام نشد.'
      );

    }
  };

  return (
    <section className="wrap section">

      <h2>
        پرداخت‌های در انتظار
      </h2>

      {loading ? (

        <div className="empty">
          در حال دریافت پرداخت‌ها...
        </div>

      ) : payments.length === 0 ? (

        <div className="empty">
          پرداختی در انتظار بررسی نیست.
        </div>

      ) : (

        <div className="table">

          {payments.map((payment) => (

            <div
              className="tr"
              key={payment.id}
            >

              <b>
                {
                  payment.order
                    ?.order_number ||
                  '---'
                }
              </b>

              <span>
                {
                  payment.order
                    ?.user?.name ||
                  '---'
                }
              </span>

              <span>
                {payment.amount}
              </span>

              <button
                type="button"
                className="btn small"
                onClick={() =>
                  approvePayment(
                    payment.id
                  )
                }
              >
                تأیید
              </button>

              <button
                type="button"
                className="ghost"
                onClick={() =>
                  rejectPayment(
                    payment.id
                  )
                }
              >
                رد
              </button>

            </div>

          ))}

        </div>

      )}

    </section>
  );
}