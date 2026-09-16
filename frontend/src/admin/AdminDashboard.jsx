import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { api } from '../api';

const money = (n) =>
  new Intl.NumberFormat('fa-IR').format(Math.round(n || 0)) + ' تومان';

function getPayment(order) {
  if (!order?.payments?.length) return null;
  return order.payments[order.payments.length - 1];
}

function getReceiptUrl(payment) {
  if (!payment?.receipt_path) return null;
  if (/^https?:\/\//i.test(payment.receipt_path)) return payment.receipt_path;
  return `http://localhost:8000/storage/${payment.receipt_path}`;
}

function translateStatus(status) {
  const statuses = {
    pending: 'در انتظار',
    waiting_for_verification: 'در انتظار تأیید پرداخت',
    waiting_for_check_verification: 'در انتظار تأیید چک',
    confirmed: 'تأیید شده',
    processing: 'در حال پردازش',
    preparing: 'در حال آماده‌سازی',
    shipped: 'ارسال شده',
    delivered: 'تحویل داده شده',
    cancelled: 'لغو شده',
    rejected: 'رد شده',
  };
  return statuses[status] || status || '-';
}

function translatePaymentMethod(method) {
  const methods = { online: 'پرداخت آنلاین', bank_transfer: 'واریز بانکی', check: 'چک' };
  return methods[method] || method || '-';
}

function formatDate(date) {
  if (!date) return '-';
  try { return new Date(date).toLocaleDateString('fa-IR'); }
  catch { return date; }
}

function getProductImage(product) {
  if (product?.main_image) return product.main_image;
  const image = product?.images?.[0];
  return image?.url || image?.image || image?.path || null;
}

export default function AdminDashboard() {
  const [d, setD] = useState(null);

  // =========================
  // Payments
  // =========================
  const [payments, setPayments] = useState([]);
  const [paymentsMeta, setPaymentsMeta] = useState(null);
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // =========================
  // Users
  // =========================
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersMeta, setUsersMeta] = useState(null);

  // =========================
  // Orders
  // =========================
  const [orders, setOrders] = useState([]);
  const [showOrders, setShowOrders] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersMeta, setOrdersMeta] = useState(null);
  const [ordersPendingOnly, setOrdersPendingOnly] = useState(false);

  // =========================
  // Products
  // =========================
  const [products, setProducts] = useState([]);
  const [showProducts, setShowProducts] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsMeta, setProductsMeta] = useState(null);

  const [productsSearch, setProductsSearch] = useState("");
  const [productsFilter, setProductsFilter] = useState("");

  // =========================
  // Load dashboard
  // =========================
  async function load() {
    try {
      const dashboardRes = await api.get("/admin/dashboard");

      setD(dashboardRes.data);

      await loadPayments(1);
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در دریافت اطلاعات پنل مدیریت");
    }
  }
  async function loadPayments(page = 1) {
    setPaymentsLoading(true);

    try {
      const r = await api.get("/admin/payments/pending", {
        params: {
          page,
        },
      });

      setPayments(r.data.data || []);
      setPaymentsMeta(r.data);
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در دریافت پرداخت‌ها");
    } finally {
      setPaymentsLoading(false);
    }
  }

  // =========================
  // Load users
  // =========================
  async function loadUsers(page = 1) {
    setUsersLoading(true);

    try {
      const r = await api.get("/admin/users", {
        params: {
          page,
        },
      });

      setUsers(r.data.data || []);
      setUsersMeta(r.data);
      setShowUsers(true);
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در دریافت کاربران");
    } finally {
      setUsersLoading(false);
    }
  }

  // =========================
  // Load orders
  // =========================
  async function loadOrders(page = 1, pendingOnly = false) {
    setOrdersLoading(true);

    try {
      const r = await api.get("/admin/orders", {
        params: {
          page,
          ...(pendingOnly ? { pending_only: 1 } : {}),
        },
      });

      setOrders(r.data.data || []);
      setOrdersMeta(r.data);
      setOrdersPendingOnly(pendingOnly);
      setShowOrders(true);
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در دریافت سفارش‌ها");
    } finally {
      setOrdersLoading(false);
    }
  }

  // =========================
  // Load products
  // =========================
  async function loadProducts(page = 1, filter = "", search = "") {
    setProductsLoading(true);

    try {
      const r = await api.get("/admin/products-list", {
        params: {
          page,
          ...(filter ? { filter } : {}),
          ...(search ? { search } : {}),
        },
      });

      setProducts(r.data.data || []);
      setProductsMeta(r.data);
      setProductsFilter(filter);
      setProductsSearch(search);
      setShowProducts(true);
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در دریافت محصولات");
    } finally {
      setProductsLoading(false);
    }
  }

  // =========================
  // Initial load
  // =========================
  useEffect(() => {
    load();
  }, []);

  // =========================
  // Approve payment
  // =========================
  async function approve(payment) {
    try {
      await api.post(`/admin/payments/${payment.id}/approve`);

      alert("پرداخت با موفقیت تأیید شد.");

      // حفظ صفحه فعلی پرداخت‌ها
      await loadPayments(paymentsMeta?.current_page || 1);

      // به‌روزرسانی آمار داشبورد
      const dashboardRes = await api.get("/admin/dashboard");

      setD(dashboardRes.data);

      // اگر سفارش‌ها باز هستند،
      // همان صفحه قبلی دوباره دریافت شود
      if (showOrders) {
        await loadOrders(ordersMeta?.current_page || 1, ordersPendingOnly);
      }
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در تأیید پرداخت");
    }
  }

  // =========================
  // User management
  // =========================
  async function changeUserRole(user, role) {
    try {
      await api.patch(`/admin/users/${user.id}/role`, { role });
      await loadUsers(usersMeta?.current_page || 1);
    } catch (e) {
      alert(e.response?.data?.message || "تغییر نقش کاربر انجام نشد.");
    }
  }

  async function changeUserStatus(user, is_active) {
    try {
      await api.patch(`/admin/users/${user.id}/status`, { is_active });
      await loadUsers(usersMeta?.current_page || 1);
    } catch (e) {
      alert(e.response?.data?.message || "تغییر وضعیت کاربر انجام نشد.");
    }
  }

  // =========================
  // Get latest payment
  // =========================
  function getPayment(order) {
    if (!order?.payments || !order.payments.length) {
      return null;
    }

    return order.payments[order.payments.length - 1];
  }

  // =========================
  // Receipt URL
  // =========================
  function getReceiptUrl(payment) {
    if (!payment?.receipt_path) {
      return null;
    }

    return `http://127.0.0.1:8000/storage/${payment.receipt_path}`;
  }

  // =========================
  // Translate order status
  // =========================
  function translateStatus(status) {
    const statuses = {
      pending: "در انتظار",
      waiting_for_verification: "در انتظار تأیید پرداخت",
      waiting_for_check_verification: "در انتظار تأیید چک",
      confirmed: "تأیید شده",
      processing: "در حال پردازش",
      preparing: "در حال آماده‌سازی",
      shipped: "ارسال شده",
      delivered: "تحویل داده شده",
      cancelled: "لغو شده",
      rejected: "رد شده",
    };

    return statuses[status] || status || "-";
  }

  // =========================
  // Translate payment method
  // =========================
  function translatePaymentMethod(method) {
    const methods = {
      online: "پرداخت آنلاین",
      bank_transfer: "واریز بانکی",
      check: "چک",
    };

    return methods[method] || method || "-";
  }

  // =========================
  // Format date
  // =========================
  function formatDate(date) {
    if (!date) {
      return "-";
    }

    try {
      return new Date(date).toLocaleDateString("fa-IR");
    } catch {
      return date;
    }
  }

  // =========================
  // Product image
  // =========================
  function getProductImage(product) {
    if (product?.main_image) {
      return product.main_image;
    }

    if (product?.images && product.images.length > 0) {
      return (
        product.images[0].url ||
        product.images[0].image ||
        product.images[0].path ||
        null
      );
    }

    return null;
  }

  // =========================
  // Dashboard stats
  // =========================
  const stats = [
    {
      key: "users",
      label: "کاربران",
      value: d?.users ?? 0,
      clickable: true,
    },
    {
      key: "products",
      label: "محصولات",
      value: d?.products ?? 0,
      clickable: true,
    },
    {
      key: "orders",
      label: "سفارش‌ها",
      value: d?.orders ?? 0,
      clickable: true,
    },
    {
      key: "pending_orders",
      label: "در انتظار بررسی",
      value: d?.pending_orders ?? 0,
    },
    {
      key: "low_stock",
      label: "موجودی کم",
      value: d?.low_stock ?? 0,
    },
    {
      key: "near_expiry",
      label: "نزدیک انقضا",
      value: d?.near_expiry ?? 0,
    },
    {
      key: "expired",
      label: "منقضی شده",
      value: d?.expired ?? 0,
      clickable: true,
    },
  ];

  return (
    <section className="wrap section">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="section-head">
        <div>
          <span className="eyebrow">مدیریت فروشگاه</span>

          <h2>پنل مدیریت</h2>
        </div>
      </div>

      {/* ==================================================
          DASHBOARD STATS
      ================================================== */}

      <div className="admin-grid">
        {stats.map((x) => (
          <div
            key={x.key}
            className={`card admin-stat-card ${x.clickable ? "is-clickable" : ""}`}
            onClick={() => {
              if (x.key === "users") {
                loadUsers(1);
              }

              if (x.key === "orders") {
                loadOrders(1, false);
              }

              if (x.key === "products") {
                loadProducts(1, "", productsSearch);
              }

              if (x.key === "near_expiry") {
                loadProducts(1, "near_expiry", "");
              }

              if (x.key === "expired") {
                loadProducts(1, "expired", "");
              }
            }}
          >
            <div className="card-body">
              <h3>{x.label}</h3>

              <div className="admin-stat-value">{x.value}</div>

              {/* Users */}

              {x.key === "users" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadUsers(1);
                  }}
                >
                  مشاهده کاربران
                </button>
              )}

              {/* Products */}

              {x.key === "products" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadProducts(1, "", "");
                  }}
                >
                  مشاهده محصولات
                </button>
              )}

              {/* All Orders */}

              {x.key === "orders" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadOrders(1, false);
                  }}
                >
                  مشاهده سفارش‌ها
                </button>
              )}

              {/* Pending Orders */}

              {x.key === "pending_orders" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadOrders(1, true);
                  }}
                >
                  مشاهده سفارش‌های در انتظار
                </button>
              )}

              {/* Low Stock */}

              {x.key === "low_stock" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();

                    loadProducts(1, "low_stock", "");
                  }}
                >
                  مشاهده کالاهای موجودی کم
                </button>
              )}

              {/* Near Expiry */}

              {x.key === "near_expiry" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();

                    loadProducts(1, "near_expiry", "");
                  }}
                >
                  مشاهده کالاهای نزدیک انقضا
                </button>
              )}

              {x.key === "expired" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadProducts(1, "expired", "");
                  }}
                >
                  مشاهده کالاهای منقضی‌شده
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================
          USERS
      ================================================== */}

      {showUsers && (
        <div className="card admin-section-card">
          <div className="card-body">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">👥 کاربران</h2>

                <p>کاربران ثبت‌نام‌شده</p>
              </div>

              <button className="btn" onClick={() => setShowUsers(false)}>
                بستن
              </button>
            </div>

            {usersLoading ? (
              <p className="admin-status-message">در حال دریافت کاربران...</p>
            ) : users.length === 0 ? (
              <p className="admin-status-message">کاربری پیدا نشد.</p>
            ) : (
              <>
                <div className="table admin-table-scroll">
                  <div className="tr admin-table-header admin-table-min-900">
                    <span>نام کاربری</span>

                    <span>نام</span>

                    <span>ایمیل</span>

                    <span>موبایل</span>

                    <span>نقش</span>

                    <span>سفارش‌ها</span>

                    <span>تاریخ ثبت‌نام</span>
                    <span>وضعیت</span>
                  </div>

                  {users.map((u) => (
                    <div key={u.id} className="tr admin-table-min-900">
                      <span>{u.username || "-"}</span>

                      <span>{u.name || "-"}</span>

                      <span>{u.email || "-"}</span>

                      <span>{u.phone || "-"}</span>

                      <span>
                        <select
                          value={u.role || "user"}
                          onChange={(e) => changeUserRole(u, e.target.value)}
                        >
                          <option value="user">کاربر عادی</option>
                          <option value="pet_shop">پت‌شاپ</option>
                          <option value="pharmacy">داروخانه</option>
                          <option value="vaccination">مرکز واکسیناسیون</option>
                          <option value="admin">مدیر سیستم</option>
                        </select>
                      </span>

                      <span>{u.orders_count ?? 0}</span>

                      <span>{formatDate(u.created_at)}</span>

                      <span>
                        <button
                          className="btn small"
                          onClick={() => changeUserStatus(u, !u.is_active)}
                        >
                          {u.is_active ? "فعال" : "غیرفعال"}
                        </button>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Users Pagination */}

                {usersMeta && usersMeta.last_page > 1 && (
                  <div className="pagination admin-pagination">
                    <button
                      className="btn"
                      disabled={!usersMeta.prev_page_url || usersLoading}
                      onClick={() => loadUsers(usersMeta.current_page - 1)}
                    >
                      قبلی
                    </button>

                    <span>
                      صفحه {usersMeta.current_page} از {usersMeta.last_page}
                    </span>

                    <button
                      className="btn"
                      disabled={!usersMeta.next_page_url || usersLoading}
                      onClick={() => loadUsers(usersMeta.current_page + 1)}
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          ORDERS
      ================================================== */}

      {showOrders && (
        <div className="card admin-section-card">
          <div className="card-body">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  {ordersPendingOnly
                    ? "⏳ سفارش‌های در انتظار تأیید"
                    : "📦 همه سفارش‌ها"}
                </h2>

                <p>
                  {ordersPendingOnly
                    ? "سفارش‌هایی که نیاز به بررسی و تأیید دارند"
                    : "سفارش‌های ثبت‌شده کاربران"}
                </p>
              </div>

              <button className="btn" onClick={() => setShowOrders(false)}>
                بستن
              </button>
            </div>

            {ordersLoading ? (
              <p className="admin-status-message">در حال دریافت سفارش‌ها...</p>
            ) : orders.length === 0 ? (
              <p className="admin-status-message">سفارشی وجود ندارد.</p>
            ) : (
              <>
                {orders.map((order) => {
                  const payment = getPayment(order);

                  const receiptUrl = getReceiptUrl(payment);

                  return (
                    <div key={order.id} className="admin-order-card">
                      <h3>سفارش {order.order_number || `#${order.id}`}</h3>

                      <div className="admin-order-info">
                        <div>
                          <b>مشتری:</b>{" "}
                          {order.user?.name || order.user?.username || "-"}
                        </div>

                        <div>
                          <b>مبلغ:</b> {money(order.total)}
                        </div>

                        <div>
                          <b>روش پرداخت:</b>{" "}
                          {translatePaymentMethod(
                            payment?.method || order.payment_method,
                          )}
                        </div>

                        <div>
                          <b>وضعیت:</b> {translateStatus(order.status)}
                        </div>

                        <div>
                          <b>تاریخ:</b> {formatDate(order.created_at)}
                        </div>
                      </div>

                      {/* Order Products */}

                      <div className="admin-subsection">
                        <h4>محصولات سفارش:</h4>

                        {order.items && order.items.length > 0 ? (
                          <div className="admin-order-items">
                            {order.items.map((item) => (
                              <div key={item.id} className="admin-order-item">
                                <b>{item.product?.name || "محصول حذف شده"}</b>

                                <span> × {item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p>محصولی برای این سفارش ثبت نشده است.</p>
                        )}
                      </div>

                      {/* Payment */}

                      {payment && (
                        <div className="admin-subsection">
                          <h4>اطلاعات پرداخت:</h4>

                          <p>وضعیت پرداخت: {translateStatus(payment.status)}</p>

                          {receiptUrl && (
                            <div className="admin-receipt">
                              <p>رسید / تصویر پرداخت:</p>

                              <a
                                href={receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={receiptUrl}
                                  alt="رسید پرداخت"
                                  className="admin-receipt-image"
                                />
                              </a>
                            </div>
                          )}

                          {/* Payments Pagination */}

                          {paymentsMeta && paymentsMeta.last_page > 1 && (
                            <div className="pagination admin-pagination">
                              <button
                                className="btn"
                                disabled={
                                  !paymentsMeta.prev_page_url || paymentsLoading
                                }
                                onClick={() =>
                                  loadPayments(paymentsMeta.current_page - 1)
                                }
                              >
                                قبلی
                              </button>

                              <span>
                                صفحه {paymentsMeta.current_page} از{" "}
                                {paymentsMeta.last_page}
                              </span>

                              <button
                                className="btn"
                                disabled={
                                  !paymentsMeta.next_page_url || paymentsLoading
                                }
                                onClick={() =>
                                  loadPayments(paymentsMeta.current_page + 1)
                                }
                              >
                                بعدی
                              </button>
                            </div>
                          )}
                          {payment.rejection_reason && (
                            <p>
                              <b>دلیل رد:</b> {payment.rejection_reason}
                            </p>
                          )}

                          {payment.status === "waiting_verification" && (
                            <button
                              className="btn admin-approve-button"
                              onClick={() => approve(payment)}
                            >
                              تأیید پرداخت
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Orders Pagination */}

                {ordersMeta && ordersMeta.last_page > 1 && (
                  <div className="pagination admin-pagination">
                    <button
                      className="btn"
                      disabled={!ordersMeta.prev_page_url || ordersLoading}
                      onClick={() =>
                        loadOrders(
                          ordersMeta.current_page - 1,
                          ordersPendingOnly,
                        )
                      }
                    >
                      قبلی
                    </button>

                    <span>
                      صفحه {ordersMeta.current_page} از {ordersMeta.last_page}
                    </span>

                    <button
                      className="btn"
                      disabled={!ordersMeta.next_page_url || ordersLoading}
                      onClick={() =>
                        loadOrders(
                          ordersMeta.current_page + 1,
                          ordersPendingOnly,
                        )
                      }
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================================================
          PRODUCTS
      ================================================== */}

      {showProducts && (
        <div className="card admin-section-card">
          <div className="card-body">
            {/* Products Header */}

            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">🛍️ مدیریت محصولات</h2>

                <p>
                  {productsFilter === "low_stock"
                    ? "محصولات با موجودی کم"
                    : productsFilter === "near_expiry"
                      ? "محصولات نزدیک انقضا"
                      : productsFilter === "expired"
                        ? "محصولات منقضی‌شده"
                        : "همه محصولات فروشگاه"}
                </p>
              </div>

              <div className="admin-header-actions">
                <Link to="/admin/products/new" className="btn">
                  + افزودن محصول
                </Link>

                <button className="btn" onClick={() => setShowProducts(false)}>
                  بستن
                </button>
              </div>
            </div>

            {/* ==================================================
                PRODUCTS SEARCH
            ================================================== */}

            <div className="admin-product-search">
              <input
                type="text"
                value={productsSearch}
                onChange={(e) => setProductsSearch(e.target.value)}
                placeholder="جستجو در نام محصول یا SKU..."
                className="admin-product-search-input"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    loadProducts(1, productsFilter, productsSearch);
                  }
                }}
              />

              <button
                className="btn"
                onClick={() => loadProducts(1, productsFilter, productsSearch)}
              >
                جستجو
              </button>

              {productsSearch && (
                <button
                  className="ghost"
                  onClick={() => {
                    setProductsSearch("");

                    loadProducts(1, productsFilter, "");
                  }}
                >
                  پاک کردن
                </button>
              )}
            </div>

            {productsLoading ? (
              <p className="admin-status-message">در حال دریافت محصولات...</p>
            ) : products.length === 0 ? (
              <p className="admin-status-message">محصولی پیدا نشد.</p>
            ) : (
              <>
                <div className="table admin-table-scroll">
                  {/* Header */}

                  <div className="tr admin-table-header admin-table-min-1050">
                    <span>تصویر</span>

                    <span>نام محصول</span>

                    <span>SKU</span>

                    <span>قیمت</span>

                    <span>تخفیف</span>

                    <span>موجودی</span>

                    <span>وضعیت</span>

                    <span>عملیات</span>
                  </div>

                  {products.map((product) => {
                    const image = getProductImage(product);

                    return (
                      <div key={product.id} className="tr admin-table-min-1050">
                        {/* Image */}

                        <span>
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="admin-product-image"
                            />
                          ) : (
                            <Package size={40} />
                          )}
                        </span>

                        {/* Name */}

                        <span>
                          <b>{product.name}</b>
                        </span>

                        {/* SKU */}

                        <span>{product.sku || "-"}</span>

                        {/* Price */}

                        <span>
                          {money(product.final_price ?? product.price)}
                        </span>

                        {/* Discount */}

                        <span>
                          {product.discount_percentage > 0
                            ? `${product.discount_percentage}%`
                            : "-"}
                        </span>

                        {/* Stock */}

                        <span>{product.stock ?? 0}</span>

                        {/* Status */}

                        <span>{product.is_active ? "فعال" : "غیرفعال"}</span>

                        {/* Actions */}

                        <span className="admin-product-actions">
                          <Link
                            className="btn"
                            to={`/admin/products/${product.id}`}
                          >
                            ویرایش
                          </Link>
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Products Pagination */}

                {productsMeta && productsMeta.last_page > 1 && (
                  <div className="pagination admin-pagination">
                    <button
                      className="btn"
                      disabled={!productsMeta.prev_page_url || productsLoading}
                      onClick={() =>
                        loadProducts(
                          productsMeta.current_page - 1,
                          productsFilter,
                          productsSearch,
                        )
                      }
                    >
                      قبلی
                    </button>

                    <span>
                      صفحه {productsMeta.current_page} از{" "}
                      {productsMeta.last_page}
                    </span>

                    <button
                      className="btn"
                      disabled={!productsMeta.next_page_url || productsLoading}
                      onClick={() =>
                        loadProducts(
                          productsMeta.current_page + 1,
                          productsFilter,
                          productsSearch,
                        )
                      }
                    >
                      بعدی
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

