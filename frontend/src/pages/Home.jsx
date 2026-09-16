import { Link } from 'react-router-dom';

export default function Home() {
  return <>
    <section className="hero">
      <div>
        <span className="eyebrow">شرکت توزیع و پخش طب گشتر کاوه</span>
        <h1>همه‌چیز برای سلامت و نگهداری دام</h1>
        <p>دارو، مکمل و تجهیزات با مدیریت هوشمند موجودی و سفارش.</p>
        <Link className="btn" to="/login">ورود برای مشاهده محصولات</Link>
      </div>
    </section>
    <section className="wrap section">
      <div className="section-head"><div><span className="eyebrow">VetShop</span><h2>فروشگاه تخصصی دامپزشکی</h2></div></div>
      <div className="empty">برای مشاهده کاتالوگ محصولات ابتدا وارد حساب کاربری شوید.</div>
    </section>
  </>;
}
