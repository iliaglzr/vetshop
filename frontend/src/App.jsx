import { Routes, Route, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Products from './pages/Products';
import { Login, Register } from './pages/Auth';
import { Cart, Checkout, Dashboard, Orders, OrderDetail } from './pages/ShopPages';
import { RoleDashboard } from './dashboards/RoleDashboards';
import AdminDashboard from './admin/AdminDashboard';
import { AdminUsers, AdminProducts, AdminInventory, AdminOrders, AdminPayments } from './admin/AdminPages';
import AdminProduct from './admin/AdminProduct';

export default function App() {
  return <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Product/catalog access is intentionally private: no unauthenticated user can see products. */}
      <Route element={<ProtectedRoute />}>
        <Route path="/products" element={<Products />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetailRoute />} />
        <Route path="/dashboard" element={<Dashboard />} />

        <Route element={<ProtectedRoute roles={['pet_shop']} />}>
          <Route path="/dashboard/pet-shop" element={<RoleDashboard type="pet_shop" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['pharmacy']} />}>
          <Route path="/dashboard/pharmacy" element={<RoleDashboard type="pharmacy" />} />
        </Route>
        <Route element={<ProtectedRoute roles={['vaccination']} />}>
          <Route path="/dashboard/vaccination" element={<RoleDashboard type="vaccination" />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/new" element={<AdminProduct />} />
          <Route path="/admin/products/:id" element={<AdminProduct />} />
          <Route path="/admin/inventory" element={<AdminInventory />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
        </Route>
      </Route>
    </Route>
  </Routes>;
}

function OrderDetailRoute() {
  const { id } = useParams();
  return <OrderDetail id={id} />;
}
