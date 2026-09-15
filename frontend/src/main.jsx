import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  useNavigate,
  useLocation,
  Link,
} from "react-router-dom";
import {
  ShoppingCart,
  Search,
  User,
  Package,
  LogOut,
  Plus,
  Minus,
  CheckCircle,
  Clock,
  Truck,
} from "lucide-react";
import { api } from "./api";
import "./styles.css";

const money = (n) =>
  new Intl.NumberFormat("fa-IR").format(Math.round(n || 0)) + " تومان";

function Header({ cartCount, onLogout }) {
  // دریافت اطلاعات کاربر واردشده
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  // تعیین مسیر داشبورد بر اساس نقش کاربر
  const dashboardPath =
    user?.role === "admin" ||
    user?.role === "super_admin" ||
    user?.role === "operator"
      ? "/admin"
      : "/dashboard";

  return (
    <header>
      <div className="wrap nav">
        <Link to="/" className="logo">
          Vet<span>Shop</span>
        </Link>

        <nav>
          <Link to="/products">محصولات</Link>
          <Link to="/products?category=1">داروها</Link>
          <Link to="/products?category=2">مکمل‌ها</Link>
          <Link to="/products?category=3">تجهیزات</Link>
        </nav>

        <div className="nav-actions">
          <Link to="/cart" className="icon">
            <ShoppingCart />
            <b>{cartCount}</b>
          </Link>

          {localStorage.getItem("token") ? (
            <>
              {/* داشبورد بر اساس نقش کاربر */}
              <Link to={dashboardPath}>
                <User />
              </Link>

              <button className="ghost" onClick={onLogout}>
                <LogOut />
              </button>
            </>
          ) : (
            <Link className="btn small" to="/login">
              ورود
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function Home() {
  const [p, setP] = useState([]);

  useEffect(() => {
    api
      .get("/products", { params: { on_sale: 1 } })
      .then((r) => setP(r.data.data || []));
  }, []);

  return (
    <>
      {/* محصولات */}
      <section className="wrap section">
        <div className="section-head">
          <div>
            <span className="eyebrow">پیشنهادات ویژه</span>
            <h2>تخفیف‌های امروز</h2>
          </div>

          <Link to="/products">مشاهده همه</Link>
        </div>

        <div className="grid">
          {p.slice(0, 4).map((x) => (
            <ProductCard key={x.id} p={x} />
          ))}
        </div>
      </section>

      {/* Hero */}
      <section className="hero">
        <div>
          <span className="eyebrow">شرکت توزیع و پخش طب گشتر کاوه</span>

          <h1>همه‌چیز برای سلامت و نگهداری دام</h1>

          <p>دارو، مکمل و تجهیزات با مدیریت هوشمند موجودی و سفارش.</p>

          <Link className="btn" to="/products">
            مشاهده محصولات
          </Link>
        </div>
      </section>
    </>
  );
}

function ProductCard({ p }) {
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    try {
      await api.post("/cart/items", {
        product_id: p.id,
        quantity: p.minimum_order_quantity || 1,
      });
      alert("به سبد خرید اضافه شد");
    } catch (e) {
      alert(e.response?.data?.message || "خطا");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="card">
      <div className="pic">
        {p.main_image ? <img src={p.main_image} /> : <Package size={48} />}
        {p.discount_percentage > 0 && (
          <span className="badge">{p.discount_percentage}% تخفیف</span>
        )}
      </div>
      <div className="card-body">
        <h3>{p.name}</h3>
        <p>{p.short_description || "محصول باکیفیت دامپزشکی"}</p>
        <div className="price">
          {money(
            p.final_price ?? p.price * (1 - (p.discount_percentage || 0) / 100),
          )}
          {p.old_price && <del>{money(p.old_price)}</del>}
        </div>
        <div className="stock">
          موجودی: {p.stock} | حداقل: {p.minimum_order_quantity}
        </div>
        <button className="btn full" disabled={busy || !p.stock} onClick={add}>
          {busy ? "..." : !p.stock ? "ناموجود" : "افزودن به سبد"}
        </button>
      </div>
    </article>
  );
}

function Products() {
  const [ps, setPs] = useState([]);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load(currentPage = page) {
    setLoading(true);

    try {
      const r = await api.get("/products", {
        params: {
          search: q,
          page: currentPage,
        },
      });

      setPs(r.data.data || []);
      setMeta(r.data);
      setPage(currentPage);
    } catch (e) {
      alert(e.response?.data?.message || "خطا در دریافت محصولات");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  function searchProducts() {
    load(1);
  }

  function changePage(newPage) {
    if (newPage < 1) return;
    if (meta?.last_page && newPage > meta.last_page) return;

    load(newPage);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <section className="wrap section">
      <div className="section-head">
        <div>
          <span className="eyebrow">کاتالوگ</span>
          <h2>محصولات</h2>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <Search />

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchProducts();
            }}
            placeholder="جستجوی نام، SKU یا توضیحات..."
          />

          <button onClick={searchProducts}>جستجو</button>
        </div>
      </div>

      {loading ? (
        <div className="empty">در حال دریافت محصولات...</div>
      ) : ps.length === 0 ? (
        <div className="empty">محصولی پیدا نشد.</div>
      ) : (
        <>
          <div className="grid">
            {ps.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>

          {meta && meta.last_page > 1 && (
            <div className="pagination pagination-wrap">
              <button
                className="btn small"
                disabled={page === 1}
                onClick={() => changePage(page - 1)}
              >
                قبلی
              </button>

              {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => changePage(number)}
                    className={`btn small pagination-number ${page === number ? "active" : ""}`}
                  >
                    {number}
                  </button>
                ),
              )}

              <button
                className="btn small"
                disabled={page === meta.last_page}
                onClick={() => changePage(page + 1)}
              >
                بعدی
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Login() {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", r.data.token);
      localStorage.setItem("user", JSON.stringify(r.data.user));
      nav(r.data.user.role === "user" ? "/" : "/admin");
    } catch (e) {
      alert(e.response?.data?.message || "ورود ناموفق بود");
    }
  }
  return (
    <AuthForm title="ورود به حساب" onSubmit={submit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="ایمیل"
        required
      />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        placeholder="رمز عبور"
        required
      />
      <button className="btn full">ورود</button>
      <p>
        حساب ندارید؟ <Link to="/register">ثبت‌نام</Link>
      </p>
    </AuthForm>
  );
}

function Register() {
  const [f, setF] = useState({
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
    }),
    nav = useNavigate();
  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api.post("/auth/register", f);
      localStorage.setItem("token", r.data.token);
      nav("/dashboard");
    } catch (e) {
      alert(
        Object.values(e.response?.data?.errors || { x: ["ثبت‌نام ناموفق"] })
          .flat()
          .join("\n"),
      );
    }
  }
  return (
    <AuthForm title="ساخت حساب" onSubmit={submit}>
      {["name", "email", "phone", "password", "password_confirmation"].map(
        (k) => (
          <input
            key={k}
            value={f[k]}
            onChange={(e) => setF({ ...f, [k]: e.target.value })}
            type={k.includes("password") ? "password" : "text"}
            placeholder={
              {
                name: "نام و نام خانوادگی",
                email: "ایمیل",
                phone: "شماره تماس",
                password: "رمز عبور",
                password_confirmation: "تکرار رمز عبور",
              }[k]
            }
            required={k !== "phone"}
          />
        ),
      )}
      <button className="btn full">ثبت‌نام</button>
    </AuthForm>
  );
}

function AuthForm({ title, onSubmit, children }) {
  return (
    <section className="auth">
      <form className="panel" onSubmit={onSubmit}>
        <span className="eyebrow">VetShop</span>
        <h2>{title}</h2>
        {children}
      </form>
    </section>
  );
}

function Cart() {
  const [c, setC] = useState(null),
    nav = useNavigate();
  async function load() {
    setC((await api.get("/cart")).data);
  }
  useEffect(() => {
    load();
  }, []);
  if (!localStorage.getItem("token")) return <NavigateToLogin />;
  return (
    <section className="wrap section">
      <h2>سبد خرید</h2>
      {!c?.items?.length ? (
        <div className="empty">سبد خرید شما خالی است.</div>
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
                    onClick={async () => {
                      await api.patch("/cart/items/" + i.id, {
                        quantity: i.quantity + 1,
                      });
                      load();
                    }}
                  >
                    <Plus />
                  </button>
                  <b>{i.quantity}</b>
                  <button
                    onClick={async () => {
                      if (i.quantity > i.product.minimum_order_quantity) {
                        await api.patch("/cart/items/" + i.id, {
                          quantity: i.quantity - 1,
                        });
                      } else await api.delete("/cart/items/" + i.id);
                      load();
                    }}
                  >
                    <Minus />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <aside className="summary">
            <h3>خلاصه سفارش</h3>
            <p>تعداد اقلام: {c.items.length}</p>
            <strong>
              {money(
                c.items.reduce((s, i) => s + i.unit_price * i.quantity, 0),
              )}
            </strong>
            <button className="btn full" onClick={() => nav("/checkout")}>
              ثبت سفارش
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}

function NavigateToLogin() {
  const n = useNavigate();
  useEffect(() => n("/login"), []);
  return null;
}

function Checkout() {
  const nav = useNavigate(),
    [method, setMethod] = useState("bank_transfer"),
    [form, setForm] = useState({
      province: "",
      city: "",
      address: "",
      postal_code: "",
      phone: "",
    }),
    [order, setOrder] = useState(null);
  async function submit(e) {
    e.preventDefault();
    try {
      const r = await api.post("/orders", {
        payment_method: method,
        shipping_address: form,
      });
      setOrder(r.data);
      if (method === "online")
        alert("اتصال به درگاه باید در محیط واقعی به Gateway متصل شود.");
    } catch (e) {
      alert(
        Object.values(
          e.response?.data?.errors || {
            x: [e.response?.data?.message || "خطا"],
          },
        )
          .flat()
          .join("\n"),
      );
    }
  }
  if (order) return <PaymentUpload order={order} />;
  return (
    <section className="wrap section">
      <h2>ثبت سفارش</h2>
      <form className="checkout" onSubmit={submit}>
        <div className="panel">
          <h3>آدرس ارسال</h3>
          {["province", "city", "address", "postal_code", "phone"].map((k) => (
            <input
              key={k}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              placeholder={
                {
                  province: "استان",
                  city: "شهر",
                  address: "آدرس کامل",
                  postal_code: "کد پستی",
                  phone: "شماره تماس",
                }[k]
              }
              required={k !== "postal_code"}
            />
          ))}
        </div>
        <div className="panel">
          <h3>روش پرداخت</h3>
          <label className="radio">
            <input
              type="radio"
              checked={method === "bank_transfer"}
              onChange={() => setMethod("bank_transfer")}
            />{" "}
            شبا و ارسال فیش
          </label>
          <label className="radio">
            <input
              type="radio"
              checked={method === "check"}
              onChange={() => setMethod("check")}
            />{" "}
            چک و ارسال تصویر
          </label>
          <label className="radio">
            <input
              type="radio"
              checked={method === "online"}
              onChange={() => setMethod("online")}
            />{" "}
            پرداخت آنلاین
          </label>
          {method !== "online" && (
            <p className="hint">
              پس از ثبت سفارش، تصویر فیش یا چک را از دوربین/گالری ارسال کنید.
            </p>
          )}
          <button className="btn full">ثبت سفارش</button>
        </div>
      </form>
    </section>
  );
}

function PaymentUpload({ order }) {
  const [method, setMethod] = useState(
      order.payment_method === "check" ? "check" : "bank_transfer",
    ),
    [file, setFile] = useState(null),
    [done, setDone] = useState(false);
  async function send(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("receipt", file);
    fd.append("method", method);
    try {
      await api.post(`/orders/${order.id}/payment`, fd);
      setDone(true);
    } catch (e) {
      alert(e.response?.data?.message || "آپلود ناموفق بود");
    }
  }
  if (done)
    return (
      <section className="auth">
        <div className="panel center">
          <CheckCircle size={52} />
          <h2>در انتظار تأیید</h2>
          <p>
            مدرک پرداخت برای اپراتور ارسال شد. پس از تأیید، سفارش نهایی می‌شود.
          </p>
          <Link className="btn" to="/orders">
            پیگیری سفارش
          </Link>
        </div>
      </section>
    );
  return (
    <section className="auth">
      <form className="panel" onSubmit={send}>
        <h2>{method === "check" ? "ارسال تصویر چک" : "ارسال فیش واریزی"}</h2>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <button className="btn full">ارسال برای تأیید</button>
      </form>
    </section>
  );
}

function Dashboard() {
  const [u, setU] = useState(null),
    [orders, setOrders] = useState([]);
  useEffect(() => {
    api.get("/me").then((r) => setU(r.data));
    api.get("/orders").then((r) => setOrders(r.data.data || []));
  }, []);
  return (
    <section className="wrap section">
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">حساب کاربری</span>
          <h2>سلام {u?.name || "کاربر"} 👋</h2>
        </div>
        <Link className="btn" to="/products">
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
          <b>{orders.filter((x) => x.status.includes("waiting")).length}</b>
          <span>در انتظار</span>
        </div>
        <div>
          <Truck />
          <b>
            {
              orders.filter((x) => ["shipped", "delivered"].includes(x.status))
                .length
            }
          </b>
          <span>ارسال شده</span>
        </div>
      </div>
      <h3>آخرین سفارش‌ها</h3>
      <div className="table">
        {orders.map((o) => (
          <div className="tr" key={o.id}>
            <b>{o.order_number}</b>
            <span>{money(o.total)}</span>
            <span>{o.status}</span>
            <Link className="details-btn" to={"/orders/" + o.id}>
              جزئیات
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function Admin() {
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
                  </div>

                  {users.map((u) => (
                    <div key={u.id} className="tr admin-table-min-900">
                      <span>{u.username || "-"}</span>

                      <span>{u.name || "-"}</span>

                      <span>{u.email || "-"}</span>

                      <span>{u.phone || "-"}</span>

                      <span>
                        {u.role === "admin"
                          ? "مدیر"
                          : u.role === "super_admin"
                            ? "مدیر ارشد"
                            : u.role === "operator"
                              ? "اپراتور"
                              : "کاربر"}
                      </span>

                      <span>{u.orders_count ?? 0}</span>

                      <span>{formatDate(u.created_at)}</span>
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

function AdminProduct({ id }) {
  const [p, setP] = useState({
      name: "",
      sku: "",
      category_id: 1,
      price: "",
      old_price: "",
      discount_percentage: 0,
      stock: 0,
      minimum_order_quantity: 1,
      minimum_stock: 5,
      description: "",
      is_featured: false,
      is_active: true,
    }),
    [cats, setCats] = useState([]),
    nav = useNavigate();
  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data));
    if (id) api.get("/products/" + id).then((r) => setP(r.data));
  }, [id]);
  async function save(e) {
    e.preventDefault();
    try {
      if (id) await api.put("/admin/products/" + id, p);
      else await api.post("/admin/products", p);
      nav("/admin");
    } catch (e) {
      alert(
        Object.values(
          e.response?.data?.errors || {
            x: [e.response?.data?.message || "خطا"],
          },
        )
          .flat()
          .join("\n"),
      );
    }
  }

  async function removeProduct() {
    if (!id) return;

    const confirmed = window.confirm(
      "آیا مطمئن هستید که می‌خواهید این محصول را حذف کنید؟\nاین عملیات قابل بازگشت نیست.",
    );

    if (!confirmed) return;

    try {
      await api.delete("/admin/products/" + id);

      alert("محصول با موفقیت حذف شد.");
      nav("/admin");
    } catch (e) {
      console.error(e);

      alert(e.response?.data?.message || "حذف محصول انجام نشد.");
    }
  }

  return (
    <section className="wrap section">
      <div className="panel form">
        <h2>{id ? "ویرایش محصول" : "افزودن محصول"}</h2>
        <div className="form-grid">
          {[
            ["name", "نام محصول"],
            ["sku", "SKU"],
            ["price", "قیمت"],
            ["old_price", "قیمت قبلی"],
            ["discount_percentage", "تخفیف درصدی"],
            ["stock", "موجودی"],
            ["minimum_order_quantity", "حداقل سفارش"],
            ["minimum_stock", "حداقل موجودی"],
            ["expiration_date", "تاریخ انقضا"],
          ].map(([k, l]) => (
            <input
              key={k}
              value={p[k] ?? ""}
              onChange={(e) => setP({ ...p, [k]: e.target.value })}
              placeholder={l}
            />
          ))}
          <select
            value={p.category_id || ""}
            onChange={(e) => setP({ ...p, category_id: e.target.value })}
          >
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={p.description || ""}
          onChange={(e) => setP({ ...p, description: e.target.value })}
          placeholder="توضیحات کامل محصول"
        />
        <label>
          <input
            type="checkbox"
            checked={!!p.is_featured}
            onChange={(e) => setP({ ...p, is_featured: e.target.checked })}
          />{" "}
          محصول ویژه
        </label>
        <div className="admin-product-form-actions">
          <button className="btn" onClick={save}>
            ذخیره محصول
          </button>

          {id && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={removeProduct}
            >
              حذف محصول
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
function Orders() {
  const [o, setO] = useState([]);
  useEffect(() => {
    api.get("/orders").then((r) => setO(r.data.data || []));
  }, []);
  return (
    <section className="wrap section">
      <h2>سفارش‌های من</h2>
      <div className="table">
        {o.map((x) => (
          <div className="tr" key={x.id}>
            <b>{x.order_number}</b>
            <span>{money(x.total)}</span>
            <span>{x.status}</span>
            <Link to={"/orders/" + x.id}>جزئیات</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
function OrderDetail({ id }) {
  const [o, setO] = useState(null);
  useEffect(() => {
    api.get("/orders/" + id).then((r) => setO(r.data));
  }, [id]);
  return (
    <section className="wrap section">
      <h2>سفارش {o?.order_number}</h2>
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
            <span>{i.quantity} عدد</span>
            <b>{money(i.total)}</b>
          </div>
        ))}
        <hr />
        <h3>{money(o?.total)}</h3>
        {o?.rejection_reason && (
          <p className="error">دلیل رد: {o.rejection_reason}</p>
        )}
      </div>
    </section>
  );
}
function isLoggedIn() {
  return !!localStorage.getItem("token");
}

function App() {
  const [cartCount, setCartCount] = useState(0);
  const loc = useLocation();

  async function refresh() {
    if (isLoggedIn()) {
      try {
        const c = (await api.get("/cart")).data;
        setCartCount(c.items?.reduce((s, i) => s + i.quantity, 0) || 0);
      } catch {}
    }
  }

  useEffect(() => {
    refresh();
  }, [loc.pathname]);

  function logout() {
    localStorage.clear();
    location.href = "/login";
  }

  const publicPages = ["/login", "/register"];
  const isPublicPage = publicPages.includes(loc.pathname);

  // اگر کاربر لاگین نیست و وارد صفحه‌ای غیر از Login/Register شده
  if (!isLoggedIn() && !isPublicPage) {
    return <LoginRedirect />;
  }

  // اگر کاربر لاگین است و می‌خواهد Login/Register را باز کند
  if (isLoggedIn() && isPublicPage) {
    location.href = "/";
    return null;
  }

  let content;

  if (loc.pathname === "/") content = <Home />;
  else if (loc.pathname === "/products") content = <Products />;
  else if (loc.pathname === "/login") content = <Login />;
  else if (loc.pathname === "/register") content = <Register />;
  else if (loc.pathname === "/cart") content = <Cart />;
  else if (loc.pathname === "/checkout") content = <Checkout />;
  else if (loc.pathname === "/dashboard") content = <Dashboard />;
  else if (loc.pathname === "/orders") content = <Orders />;
  else if (loc.pathname.startsWith("/orders/"))
    content = <OrderDetail id={loc.pathname.split("/")[2]} />;
  else if (loc.pathname === "/admin") content = <Admin />;
  else if (loc.pathname === "/admin/products/new") content = <AdminProduct />;
  else if (loc.pathname.startsWith("/admin/products/"))
    content = <AdminProduct id={loc.pathname.split("/")[3]} />;
  else content = <Home />;

  return (
    <>
      <Header cartCount={cartCount} onLogout={logout} />

      {content}

      <footer>
        <div className="wrap">
          <b>VetShop</b>
          <span>فروشگاه تخصصی دارو، مکمل و تجهیزات دامپزشکی</span>
        </div>
      </footer>
    </>
  );
}
function LoginRedirect() {
  const nav = useNavigate();

  useEffect(() => {
    nav("/login", { replace: true });
  }, [nav]);

  return null;
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
