import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { ROLE_LABELS } from "../utils/roles";

const roles = ["user", "pet_shop", "pharmacy", "vaccination"];

export default function AdminProduct() {
  const { id } = useParams();
  const nav = useNavigate();
  const [cats, setCats] = useState([]);
  const [p, setP] = useState({
    name: "",
    sku: "",
    category_id: "",
    brand_id: "",
    price: "",
    old_price: "",
    discount_type: "percentage",
    discount_percentage: 0,
    stock: 0,
    minimum_order_quantity: 1,
    minimum_stock: 5,
    expiration_date: "",
    description: "",
    short_description: "",
    is_featured: false,
    is_active: true,
    allowed_roles: [],
    images: [],
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const catRes = await api.get("/categories");
        setCats(catRes.data?.data || catRes.data || []);
        if (id) {
          const res = await api.get(`/products/${id}`);
          setP((x) => ({
            ...x,
            ...res.data,
            discount_type: res.data.discount_type || "percentage",
            discount_percentage: res.data.discount_percentage ?? 0,
            allowed_roles:
              res.data.roles?.map((r) => r.role) ||
              res.data.allowed_roles ||
              [],
            images: res.data.images || [],
          }));
        }
      } catch (e) {
        alert(e.response?.data?.message || "خطا در دریافت اطلاعات محصول");
      }
    };
    load();
  }, [id]);

  const set = (key, value) => setP((x) => ({ ...x, [key]: value }));

  const toggleRole = (role) =>
    setP((x) => ({
      ...x,
      allowed_roles: x.allowed_roles.includes(role)
        ? x.allowed_roles.filter((r) => r !== role)
        : [...x.allowed_roles, role],
    }));

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...p };
      delete payload.images;
      let savedId = id;
      if (id) {
        await api.put(`/admin/products/${id}`, payload);
      } else {
        const response = await api.post("/admin/products", payload);
        savedId = response.data?.id || response.data?.product?.id;
      }

      if (savedId && imageFiles.length) {
        for (const file of imageFiles) {
          const fd = new FormData();
          fd.append("image", file);
          await api.post(`/admin/products/${savedId}/images`, fd);
        }
      }

      nav("/admin", {
        state: {
          openProducts: true,
        },
      });
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
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage() {
    if (!id || !imageFiles.length) return;
    setUploading(true);
    try {
      for (const file of imageFiles) {
        const fd = new FormData();
        fd.append("image", file);
        const res = await api.post(`/admin/products/${id}/images`, fd);
        setP(res.data.product);
      }
      setImageFiles([]);
      alert("تصاویر با موفقیت اضافه شدند.");
    } catch (e) {
      alert(
        Object.values(
          e.response?.data?.errors || {
            x: [e.response?.data?.message || "آپلود تصویر ناموفق بود"],
          },
        )
          .flat()
          .join("\n"),
      );
    } finally {
      setUploading(false);
    }
  }
  async function deleteImage(imageId) {
    if (!id) return;

    const confirmed = window.confirm(
      "آیا مطمئن هستید که می‌خواهید این تصویر را حذف کنید؟",
    );

    if (!confirmed) return;

    try {
      const res = await api.delete(`/admin/products/${id}/images/${imageId}`);

      // اطلاعات محصول را از پاسخ API به‌روز می‌کنیم
      if (res.data?.product) {
        setP((prev) => ({
          ...prev,
          ...res.data.product,
          images: res.data.product.images || [],
        }));
      } else {
        // اگر API محصول را برنگرداند، فقط همان تصویر را از state حذف می‌کنیم
        setP((prev) => ({
          ...prev,
          images: prev.images.filter((img) => img.id !== imageId),
        }));
      }

      alert("تصویر با موفقیت حذف شد.");
    } catch (e) {
      alert(e.response?.data?.message || "حذف تصویر انجام نشد.");
    }
  }
  async function removeProduct() {
    if (!id || !window.confirm("آیا از حذف محصول مطمئن هستید؟")) return;
    try {
      await api.delete(`/admin/products/${id}`);
      nav("/admin/products");
    } catch (e) {
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
            ["stock", "موجودی"],
            ["minimum_order_quantity", "حداقل سفارش"],
            ["minimum_stock", "حداقل موجودی"],
            ["expiration_date", "تاریخ انقضا"],
          ].map(([key, label]) => (
            <input
              key={key}
              value={p[key] ?? ""}
              onChange={(e) => set(key, e.target.value)}
              placeholder={label}
            />
          ))}
          <select
            value={p.category_id || ""}
            onChange={(e) => set("category_id", e.target.value)}
          >
            <option value="">دسته‌بندی</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="discount-section">
          <h3>نوع تخفیف</h3>

          <div className="discount-type-options">
            <label>
              <input
                type="radio"
                name="discount_type"
                value="percentage"
                checked={p.discount_type === "percentage"}
                onChange={(e) => set("discount_type", e.target.value)}
              />
              تخفیف درصدی
            </label>

            <label>
              <input
                type="radio"
                name="discount_type"
                value="gift"
                checked={p.discount_type === "gift"}
                onChange={(e) => set("discount_type", e.target.value)}
              />
              تخفیف جنسی
            </label>
          </div>

          <div className="discount-value">
            <input
              type="number"
              min="0"
              max="100"
              value={p.discount_percentage ?? 0}
              onChange={(e) => set("discount_percentage", e.target.value)}
              placeholder={
                p.discount_type === "gift" ? "درصد تخفیف جنسی" : "درصد تخفیف"
              }
            />

            <span>%</span>
          </div>

          {p.discount_type === "gift" && (
            <p className="hint">
              مثال: اگر تخفیف جنسی ۲۰٪ باشد، به ازای هر ۵ عدد خرید، ۱ عدد رایگان
              تعلق می‌گیرد.
            </p>
          )}

          {p.discount_type === "percentage" && (
            <p className="hint">
              مثال: تخفیف ۲۰٪ یعنی قیمت محصول ۲۰٪ کاهش پیدا می‌کند.
            </p>
          )}
        </div>

        <textarea
          value={p.description || ""}
          onChange={(e) => set("description", e.target.value)}
          placeholder="توضیحات کامل محصول"
        />
        <textarea
          value={p.short_description || ""}
          onChange={(e) => set("short_description", e.target.value)}
          placeholder="توضیحات کوتاه"
        />

        <h3>Roleهای مجاز برای خرید</h3>
        <p className="hint">
          اگر هیچ Roleای انتخاب نشود، محصول برای همه کاربران واردشده مجاز است.
        </p>
        <div className="role-checks">
          {roles.map((role) => (
            <label key={role}>
              <input
                type="checkbox"
                checked={p.allowed_roles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>

        <label>
          <input
            type="checkbox"
            checked={!!p.is_featured}
            onChange={(e) => set("is_featured", e.target.checked)}
          />{" "}
          محصول ویژه
        </label>
        <label>
          <input
            type="checkbox"
            checked={!!p.is_active}
            onChange={(e) => set("is_active", e.target.checked)}
          />{" "}
          فعال
        </label>

        <div className="admin-subsection">
          <h3>تصاویر محصول</h3>
          {id &&
            (p.images?.length ? (
              <div className="admin-product-actions">
                {p.images.map((img) => (
                  <div key={img.id} className="admin-product-image-wrapper">
                    <img
                      src={img.url || img.path}
                      alt={p.name}
                      className="admin-product-image"
                    />

                    <button
                      type="button"
                      className="admin-product-image-delete"
                      onClick={() => deleteImage(img.id)}
                    >
                      حذف تصویر
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint">هنوز تصویری ثبت نشده است.</p>
            ))}
          <div className="admin-product-search">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
            />
            <span className="hint">
              می‌توانی یک تصویر اصلی و چند تصویر گالری انتخاب کنی؛ بعد از ذخیره
              محصول آپلود می‌شوند.
            </span>
            {id && (
              <button
                type="button"
                className="btn"
                disabled={!imageFiles.length || uploading}
                onClick={uploadImage}
              >
                {uploading ? "در حال آپلود..." : "افزودن تصویر"}
              </button>
            )}
          </div>
        </div>

        <div className="admin-product-form-actions">
          <button className="btn" onClick={save} disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره محصول"}
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
