import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Package } from "lucide-react";
import { api } from "../api";

const money = (n) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(n || 0)) + " تومان";

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

function translatePaymentMethod(method) {
  const methods = {
    online: "پرداخت آنلاین",
    bank_transfer: "واریز بانکی",
    check: "چک",
  };

  return methods[method] || method || "-";
}

function formatDate(date) {
  if (!date) return "-";

  try {
    return new Date(date).toLocaleDateString("fa-IR");
  } catch {
    return date;
  }
}

function getProductImage(product) {
  if (product?.main_image) return product.main_image;

  const image = product?.images?.[0];

  return image?.url || image?.image || image?.path || null;
}

/* =========================================================
   Pagination Component
========================================================= */

function AdminPagination({ meta, loading, onPageChange }) {
  if (!meta || meta.last_page <= 1) {
    return null;
  }

  const current = meta.current_page;
  const last = meta.last_page;

  function getPages() {
    const pages = [];

    if (last <= 3) {
      for (let i = 1; i <= last; i++) {
        pages.push(i);
      }

      return pages;
    }

    if (current <= 2) {
      pages.push(1);
      pages.push(2);
      pages.push(3);

      if (last > 4) {
        pages.push("...");
      }

      pages.push(last);

      return pages;
    }

    if (current >= last - 1) {
      pages.push(1);

      if (last > 4) {
        pages.push("...");
      }

      pages.push(last - 2);
      pages.push(last - 1);
      pages.push(last);

      return pages;
    }

    pages.push(1);
    pages.push("...");
    pages.push(current);
    pages.push("...");
    pages.push(last);

    return pages;
  }

  return (
    <div className="pagination admin-pagination">
      {/* Previous */}
      <button
        className="pagination-btn arrow"
        disabled={current <= 1 || loading}
        onClick={() => onPageChange(current - 1)}
        aria-label="صفحه قبل"
        title="صفحه قبل"
      >
        ‹
      </button>

      {/* Page numbers */}
      {getPages().map((item, index) => {
        if (item === "...") {
          return (
            <span key={`dots-${index}`} className="pagination-dots">
              …
            </span>
          );
        }

        return (
          <button
            key={item}
            className={`pagination-btn ${current === item ? "active" : ""}`}
            disabled={loading}
            onClick={() => onPageChange(item)}
          >
            {item}
          </button>
        );
      })}

      {/* Next */}
      <button
        className="pagination-btn arrow"
        disabled={current >= last || loading}
        onClick={() => onPageChange(current + 1)}
        aria-label="صفحه بعد"
        title="صفحه بعد"
      >
        ›
      </button>
    </div>
  );
}

export default function AdminDashboard() {
  const location = useLocation();

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
  // Stock Requests
  // =========================

  const [stockRequests, setStockRequests] = useState([]);
  const [stockRequestsLoading, setStockRequestsLoading] = useState(false);
  const [showStockRequests, setShowStockRequests] = useState(false);
  const [stockRequestsMeta, setStockRequestsMeta] = useState(null);

  // =========================================================
  // Load Dashboard
  // =========================================================

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

  // =========================================================
  // Payments
  // =========================================================

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

  // =========================================================
  // Users
  // =========================================================

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

  // =========================================================
  // Orders
  // =========================================================

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

  // =========================================================
  // Products
  // =========================================================

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
  // =========================================================
  // Stock Requests
  // =========================================================

  async function loadStockRequests(page = 1) {
    setStockRequestsLoading(true);

    try {
      const r = await api.get("/admin/stock-requests", {
        params: {
          page,
        },
      });

      setStockRequests(r.data.data || []);
      setStockRequestsMeta(r.data);
      setShowStockRequests(true);
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در دریافت درخواست‌های موجود شدن");
    } finally {
      setStockRequestsLoading(false);
    }
  }
  // =========================================================
  // Initial Load
  // =========================================================

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (location.state?.openProducts) {
      loadProducts(1, "", "");
    }
  }, []);

  // =========================================================
  // Approve Payment
  // =========================================================

  async function approve(payment) {
    try {
      await api.post(`/admin/payments/${payment.id}/approve`);

      alert("پرداخت با موفقیت تأیید شد.");

      await loadPayments(paymentsMeta?.current_page || 1);

      const dashboardRes = await api.get("/admin/dashboard");

      setD(dashboardRes.data);

      if (showOrders) {
        await loadOrders(ordersMeta?.current_page || 1, ordersPendingOnly);
      }
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "خطا در تأیید پرداخت");
    }
  }

  // =========================================================
  // User Management
  // =========================================================

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

  // =========================================================
  // Dashboard Stats
  // =========================================================

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
      key: "stock_requests",
      label: "درخواست موجود شدن",
      value: d?.stock_requests ?? 0,
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
            className={`card admin-stat-card ${
              x.clickable ? "is-clickable" : ""
            }`}
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

              
              if (x.key === "stock_requests") {
                loadStockRequests(1);
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
              {/* Stock Requests */}

              {x.key === "stock_requests" && (
                <button
                  className="btn full admin-card-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    loadStockRequests(1);
                  }}
                >
                  مشاهده درخواست‌ها
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

              {/* Orders */}

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
                    <span>وضعیت</span>
                    <span>سفارش‌ها</span>
                    <span>تاریخ ثبت‌نام</span>
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

                      <span className="user-status-cell">
                        <button
                          className={`user-status-btn ${
                            u.is_active ? "active" : "inactive"
                          }`}
                          onClick={() => changeUserStatus(u, !u.is_active)}
                        >
                          {u.is_active ? "فعال" : "غیرفعال"}
                        </button>
                      </span>

                      <span>{u.orders_count ?? 0}</span>

                      <span>{formatDate(u.created_at)}</span>

                      <span className="user-delete-cell">
                        <button
                          className="user-delete-btn"
                          onClick={() => deleteUser(u)}
                        >
                          حذف
                        </button>
                      </span>
                    </div>
                  ))}
                </div>

                <AdminPagination
                  meta={usersMeta}
                  loading={usersLoading}
                  onPageChange={(newPage) => loadUsers(newPage)}
                />
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

                                <span>
                                  {" × "}
                                  {item.quantity}
                                </span>
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

                <AdminPagination
                  meta={ordersMeta}
                  loading={ordersLoading}
                  onPageChange={(newPage) =>
                    loadOrders(newPage, ordersPendingOnly)
                  }
                />
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

            {/* Products Search */}

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
                  <div className="tr admin-products-row admin-products-header">
                    <span>تصویر</span>
                    <span>نام محصول</span>
                    <span>SKU</span>
                    <span>قیمت</span>
                    <span>تخفیف</span>
                    <span>موجودی</span>
                    <span>وضعیت</span>
                    <span>مدیریت</span>
                  </div>

                  {/* Products */}
                  {products.map((product) => {
                    const image = getProductImage(product);

                    return (
                      <div key={product.id} className="tr admin-products-row">
                        {/* Image */}
                        <span className="admin-product-image-cell">
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
                        <span className="admin-product-name-cell">
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
                        <span>
                          <span
                            className={`admin-product-status ${
                              product.is_active ? "active" : "inactive"
                            }`}
                          >
                            {product.is_active ? "فعال" : "غیرفعال"}
                          </span>
                        </span>

                        {/* Actions */}
                        <span className="admin-product-actions">
                          <Link
                            className="admin-product-edit-btn"
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

                <AdminPagination
                  meta={productsMeta}
                  loading={productsLoading}
                  onPageChange={(newPage) =>
                    loadProducts(newPage, productsFilter, productsSearch)
                  }
                />
              </>
            )}
          </div>
        </div>
      )}
      {/* ==================================================
    STOCK REQUESTS
================================================== */}

      {showStockRequests && (
        <div className="card admin-section-card">
          <div className="card-body">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">
                  🔔 درخواست‌های موجود شدن
                </h2>

                <p>محصولاتی که مشتریان درخواست موجود شدن آن‌ها را داده‌اند</p>
              </div>

              <button
                className="btn"
                onClick={() => setShowStockRequests(false)}
              >
                بستن
              </button>
            </div>

            {stockRequestsLoading ? (
              <p className="admin-status-message">
                در حال دریافت درخواست‌ها...
              </p>
            ) : stockRequests.length === 0 ? (
              <p className="admin-status-message">
                درخواستی برای موجود شدن وجود ندارد.
              </p>
            ) : (
              <>
                <div className="table admin-table-scroll">
                  <div className="tr admin-table-header admin-table-min-900">
                    <span>محصول</span>
                    <span>SKU</span>
                    <span>موجودی</span>
                    <span>تعداد درخواست</span>
                    <span>مشتریان</span>
                    <span>عملیات</span>
                  </div>

                  {stockRequests.map((item) => (
                    <div key={item.id} className="tr admin-table-min-900">
                      {/* Product */}
                      <span>
                        <b>{item.name || item.product?.name || "-"}</b>
                      </span>

                      {/* SKU */}
                      <span>{item.sku || item.product?.sku || "-"}</span>

                      {/* Stock */}
                      <span>{item.stock ?? item.product?.stock ?? 0}</span>

                      {/* Request count */}
                      <span>
                        {item.pending_stock_requests_count ??
                          item.requests_count ??
                          item.stock_requests_count ??
                          0}
                      </span>

                      {/* Customers */}
                      <span>
                        {item.stockRequests?.length
                          ? item.stockRequests
                              .map(
                                (request) =>
                                  request.user?.name ||
                                  request.user?.username ||
                                  request.user?.email ||
                                  "کاربر",
                              )
                              .join("، ")
                          : "-"}
                      </span>

                      {/* Actions */}
                      <span>
                        <button
                          className="btn"
                          disabled={
                            Number(item.stock ?? item.product?.stock ?? 0) <= 0
                          }
                          onClick={async () => {
                            try {
                              const productId =
                                item.product_id || item.product?.id || item.id;

                              await api.post(
                                `/admin/stock-requests/product/${productId}/notify`,
                              );

                              alert(
                                "درخواست‌ها با موفقیت اعلام موجود شدن شدند.",
                              );

                              await loadStockRequests(
                                stockRequestsMeta?.current_page || 1,
                              );
                            } catch (e) {
                              console.error(e);

                              alert(
                                e.response?.data?.message ||
                                  "اعلام موجود شدن انجام نشد.",
                              );
                            }
                          }}
                        >
                          اعلام موجود شدن
                        </button>
                      </span>
                    </div>
                  ))}
                </div>

                <AdminPagination
                  meta={stockRequestsMeta}
                  loading={stockRequestsLoading}
                  onPageChange={(newPage) => loadStockRequests(newPage)}
                />
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

async function deleteUser(user) {
  const confirmed = window.confirm(
    `آیا مطمئن هستید که می‌خواهید کاربر «${user.name || user.username || user.email}» را حذف کنید؟`,
  );

  if (!confirmed) return;

  try {
    await api.delete(`/admin/users/${user.id}`);

    alert("کاربر با موفقیت حذف شد.");

    // دوباره لیست کاربران را دریافت کن
    loadUsers(usersMeta?.current_page || 1);

    // آمار داشبورد را هم به‌روزرسانی کن
    load();
  } catch (error) {
    console.error("خطا در حذف کاربر:", error);

    alert(error?.response?.data?.message || "حذف کاربر انجام نشد.");
  }
}
