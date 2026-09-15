import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { dashboardPath } from '../utils/roles';


// =====================================================
// LOGIN
// =====================================================

export function Login() {
  const navigate = useNavigate();

  const {
    login,
  } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const user = await login(
        form.email,
        form.password
      );

      // انتقال به داشبورد Role
      navigate(
        dashboardPath(user.role),
        { replace: true }
      );

    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
        'ایمیل یا رمز عبور اشتباه است.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>ورود به VetShop</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>
              ایمیل
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              رمز عبور
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading
              ? 'در حال ورود...'
              : 'ورود'}
          </button>

        </form>

        <p>
          حساب کاربری ندارید؟
          {' '}

          <Link to="/register">
            ثبت‌نام کنید
          </Link>
        </p>

      </div>

    </div>
  );
}


// =====================================================
// REGISTER
// =====================================================

export function Register() {
  const navigate = useNavigate();

  const {
    register,
  } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    // بررسی رمز عبور
    if (
      form.password !==
      form.password_confirmation
    ) {
      setError(
        'رمز عبور و تکرار آن یکسان نیستند.'
      );

      return;
    }

    setLoading(true);

    try {
      const user = await register(form);

      // کاربر جدید همیشه user است
      navigate(
        dashboardPath(user.role),
        { replace: true }
      );

    } catch (err) {
      console.error(err);

      const errors =
        err?.response?.data?.errors;

      if (errors) {
        const firstError =
          Object.values(errors)
            .flat()
            .at(0);

        setError(
          firstError ||
          'اطلاعات وارد شده صحیح نیست.'
        );
      } else {
        setError(
          err?.response?.data?.message ||
          'ثبت‌نام انجام نشد.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>ثبت‌نام در VetShop</h1>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label>
              نام
            </label>

            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              ایمیل
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              شماره تلفن
            </label>

            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              رمز عبور
            </label>

            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label>
              تکرار رمز عبور
            </label>

            <input
              type="password"
              name="password_confirmation"
              value={
                form.password_confirmation
              }
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading
              ? 'در حال ثبت‌نام...'
              : 'ثبت‌نام'}
          </button>

        </form>

        <p>
          قبلاً ثبت‌نام کرده‌اید؟
          {' '}

          <Link to="/login">
            ورود
          </Link>
        </p>

      </div>

    </div>
  );
}