import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';

export default function Products() {

  const [ps, setPs] = useState([]);

  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState('');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');
  const [inStock, setInStock] = useState('');

  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [params] = useSearchParams();

  /*
  |--------------------------------------------------------------------------
  | دریافت برندها
  |--------------------------------------------------------------------------
  */

  async function loadBrands() {
    try {
      const r = await api.get('/brands');

      console.log('BRANDS API:', r.data);

      const data = Array.isArray(r.data)
        ? r.data
        : (r.data?.data || []);

      setBrands(data);

    } catch (error) {
      console.error(
        'خطا در دریافت برندها:',
        error.response?.data || error
      );

      setBrands([]);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | دریافت محصولات
  |--------------------------------------------------------------------------
  */

  async function load(pageNumber = 1) {
    try {
      const queryParams = new URLSearchParams();

      if (search.trim()) {
        queryParams.set('search', search.trim());
      }

      if (sort) {
        queryParams.set('sort', sort);
      }

      if (inStock !== '') {
        queryParams.set('in_stock', inStock);
      }

      /*
      |--------------------------------------------------------------------------
      | فیلتر برند
      |--------------------------------------------------------------------------
      */

      if (brandId !== '') {
        queryParams.set('brand_id', brandId);
      }

      /*
      |--------------------------------------------------------------------------
      | فیلتر دسته‌بندی از URL
      |--------------------------------------------------------------------------
      */

      if (params.get('category')) {
        queryParams.set(
          'category_id',
          params.get('category')
        );
      }

      queryParams.set('page', pageNumber);
      queryParams.set('per_page', 15);

      const r = await api.get(
        `/products?${queryParams.toString()}`
      );

      setPs(r.data.data || []);

      setMeta({
        current_page:
          r.data.current_page ||
          r.data.meta?.current_page ||
          pageNumber,

        last_page:
          r.data.last_page ||
          r.data.meta?.last_page ||
          1,

        total:
          r.data.total ||
          r.data.meta?.total ||
          0,
      });

    } catch (error) {
      console.error('خطا در دریافت محصولات:', error);
      setPs([]);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Load brands
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadBrands();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Reload products when filters change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setPage(1);
    load(1);
  }, [
    params.toString(),
    sort,
    inStock,
    brandId,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  function handleSearch() {
    setPage(1);
    load(1);
  }

  /*
  |--------------------------------------------------------------------------
  | Pagination
  |--------------------------------------------------------------------------
  */

  function goToPage(newPage) {

    if (
      newPage < 1 ||
      newPage > meta.last_page
    ) {
      return;
    }

    setPage(newPage);
    load(newPage);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Page numbers
  |--------------------------------------------------------------------------
  */

  function getPageNumbers() {

    const pages = [];

    const current = page;
    const last = meta.last_page;

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
        pages.push('...');
      }

      pages.push(last);

      return pages;
    }

    if (current >= last - 1) {

      pages.push(1);

      if (last > 4) {
        pages.push('...');
      }

      pages.push(last - 2);
      pages.push(last - 1);
      pages.push(last);

      return pages;
    }

    pages.push(1);
    pages.push('...');
    pages.push(current);
    pages.push('...');
    pages.push(last);

    return pages;
  }

  return (
    <section className="wrap section">

      <div className="section-head">
        <div>
          <span className="eyebrow">
            کاتالوگ
          </span>

          <h2>
            محصولات
          </h2>
        </div>
      </div>

      <div className="filters">

        {/* جستجو */}

        <div className="search">

          <Search />

          <input
            value={search}
            onChange={e =>
              setSearch(e.target.value)
            }
            onKeyDown={e => {

              if (e.key === 'Enter') {
                handleSearch();
              }

            }}
            placeholder="جستجوی نام، SKU یا توضیحات..."
          />

          <button onClick={handleSearch}>
            جستجو
          </button>

        </div>

        {/* مرتب‌سازی */}

        <select
          value={sort}
          onChange={e =>
            setSort(e.target.value)
          }
        >
          <option value="newest">
            جدیدترین
          </option>

          <option value="oldest">
            قدیمی‌ترین
          </option>

          <option value="price_asc">
            قیمت: کم به زیاد
          </option>

          <option value="price_desc">
            قیمت: زیاد به کم
          </option>

          <option value="expiry_asc">
            تاریخ انقضا: نزدیک‌ترین
          </option>

          <option value="expiry_desc">
            تاریخ انقضا: دورترین
          </option>
        </select>

        {/* موجودی */}

        <select
          value={inStock}
          onChange={e =>
            setInStock(e.target.value)
          }
        >
          <option value="">
            همه محصولات
          </option>

          <option value="1">
            فقط موجود
          </option>

          <option value="0">
            فقط ناموجود
          </option>
        </select>

        {/* برند */}

        <select
          value={brandId}
          onChange={e => {
            setBrandId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">
            همه برندها
          </option>

          {brands.map(brand => (
            <option
              key={brand.id}
              value={brand.id}
            >
              {brand.name}
            </option>
          ))}
        </select>

      </div>

      {/* محصولات */}

      <div className="grid">

        {ps.map(p => (
          <ProductCard
            key={p.id}
            p={p}
          />
        ))}

      </div>

      {ps.length === 0 && (
        <div className="empty">
          محصولی پیدا نشد.
        </div>
      )}

      {/* Pagination */}

      {meta.last_page > 1 && (

        <div
          className="pagination"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '35px',
            direction: 'rtl',
          }}
        >

          <button
            className="pagination-btn arrow"
            disabled={page <= 1}
            onClick={() =>
              goToPage(page - 1)
            }
            aria-label="صفحه قبل"
            title="صفحه قبل"
          >
            ‹
          </button>

          {getPageNumbers().map(
            (item, index) => {

              if (item === '...') {

                return (
                  <span
                    key={`dots-${index}`}
                    className="pagination-dots"
                  >
                    …
                  </span>
                );
              }

              return (
                <button
                  key={item}
                  className={`pagination-btn ${
                    page === item
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    goToPage(item)
                  }
                >
                  {item}
                </button>
              );
            }
          )}

          <button
            className="pagination-btn arrow"
            disabled={
              page >= meta.last_page
            }
            onClick={() =>
              goToPage(page + 1)
            }
            aria-label="صفحه بعد"
            title="صفحه بعد"
          >
            ›
          </button>

        </div>
      )}

    </section>
  );
}