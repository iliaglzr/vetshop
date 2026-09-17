
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../api';
import ProductCard from '../components/ProductCard';

export default function Products() {
  const [ps, setPs] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const [meta, setMeta] = useState({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  const [params] = useSearchParams();

  async function load(pageNumber = 1) {
    try {
      const r = await api.get('/products', {
        params: {
          search: q || undefined,
          category_id: params.get('category') || undefined,
          page: pageNumber,
          per_page: 15,
        },
      });

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

  useEffect(() => {
    setPage(1);
    load(1);
  }, [params.toString()]);

  function handleSearch() {
    setPage(1);
    load(1);
  }

  function goToPage(newPage) {
    if (newPage < 1 || newPage > meta.last_page) {
      return;
    }

    setPage(newPage);
    load(newPage);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ساخت شماره صفحات
  function getPageNumbers() {
    const pages = [];

    const current = page;
    const last = meta.last_page;

    // اگر 3 صفحه یا کمتر داریم
    if (last <= 3) {
      for (let i = 1; i <= last; i++) {
        pages.push(i);
      }

      return pages;
    }

    // ابتدای صفحات
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

    // انتهای صفحات
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

    // وسط صفحات
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
          <span className="eyebrow">کاتالوگ</span>
          <h2>محصولات</h2>
        </div>
      </div>

      <div className="filters">
        <div className="search">
          <Search />

          <input
            value={q}
            onChange={e => setQ(e.target.value)}
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
      </div>

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

          {/* صفحه قبل */}
          <button
            className="pagination-btn arrow"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            aria-label="صفحه قبل"
            title="صفحه قبل"
          >
            ‹
          </button>

          {/* شماره صفحات */}
          {getPageNumbers().map((item, index) => {

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
                  page === item ? 'active' : ''
                }`}
                onClick={() => goToPage(item)}
              >
                {item}
              </button>
            );
          })}

          {/* صفحه بعد */}
          <button
            className="pagination-btn arrow"
            disabled={page >= meta.last_page}
            onClick={() => goToPage(page + 1)}
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
