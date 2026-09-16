import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardPath as getDashboardPath } from '../utils/roles';

function apiError(error, fallback) {
  const errors = error.response?.data?.errors;
  if (errors) return Object.values(errors).flat().join('\n');
  return error.response?.data?.message || fallback;
}

function AuthForm({ title, onSubmit, children }) {
  return <section className="auth"><form className="panel" onSubmit={onSubmit}><span className="eyebrow">VetShop</span><h2>{title}</h2>{children}</form></section>;
}

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const u = await login(email.trim(), password);
      const from = location.state?.from;
      nav(from || getDashboardPath(u.role), { replace: true });
    } catch (error) {
      alert(apiError(error, 'ورود ناموفق بود. ایمیل و رمز عبور را بررسی کنید.'));
    } finally {
      setBusy(false);
    }
  }

  return <AuthForm title="ورود به حساب" onSubmit={submit}>
    <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="ایمیل" autoComplete="email" required />
    <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="رمز عبور" autoComplete="current-password" required />
    <button className="btn full" disabled={busy}>{busy ? 'در حال ورود...' : 'ورود'}</button>
    <p>حساب ندارید؟ <Link to="/register">ثبت‌نام</Link></p>
  </AuthForm>;
}

export function Register() {
  const [f, setF] = useState({ name:'', email:'', phone:'', password:'', password_confirmation:'' });
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();
  const { register } = useAuth();

  async function submit(e) {
    e.preventDefault();
    if (busy) return;
    if (f.password !== f.password_confirmation) {
      alert('تکرار رمز عبور با رمز عبور یکسان نیست.');
      return;
    }
    setBusy(true);
    try {
      const u = await register({ ...f, email: f.email.trim() });
      nav(getDashboardPath(u.role), { replace: true });
    } catch (error) {
      alert(apiError(error, 'ثبت‌نام ناموفق بود. اطلاعات واردشده را بررسی کنید.'));
    } finally {
      setBusy(false);
    }
  }

  const labels = { name:'نام و نام خانوادگی', email:'ایمیل', phone:'شماره تماس', password:'رمز عبور', password_confirmation:'تکرار رمز عبور' };
  return <AuthForm title="ساخت حساب" onSubmit={submit}>
    {Object.keys(f).map(k => <input key={k} value={f[k]} onChange={e => setF({ ...f, [k]: e.target.value })} type={k.includes('password') ? 'password' : k === 'email' ? 'email' : 'text'} placeholder={labels[k]} autoComplete={k === 'password_confirmation' ? 'new-password' : k} required={k !== 'phone'} />)}
    <p className="hint">حساب جدید ابتدا کاربر عادی است؛ ادمین می‌تواند بعداً Role آن را تغییر دهد.</p>
    <button className="btn full" disabled={busy}>{busy ? 'در حال ثبت‌نام...' : 'ثبت‌نام'}</button>
    <p>حساب دارید؟ <Link to="/login">ورود</Link></p>
  </AuthForm>;
}
