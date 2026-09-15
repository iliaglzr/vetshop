import {
  Routes,
  Route,
  useParams,
} from 'react-router-dom';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Products from './pages/Products';
import {
  Login,
  Register,
} from './pages/Auth';

import {
  Cart,
  Checkout,
  Dashboard,
  Orders,
  OrderDetail,
} from './pages/ShopPages';


// ================================
// داشبوردهای جدید
// ================================

import UserDashboard from './dashboards/UserDashboard';
import PetShopDashboard from './dashboards/PetShopDashboard';
import PharmacyDashboard from './dashboards/PharmacyDashboard';
import VaccinationDashboard from './dashboards/VaccinationDashboard';
import AdminDashboard from './dashboards/AdminDashboard';


// ================================
// صفحات Admin
// ================================

import {
  AdminUsers,
  AdminProducts,
  AdminInventory,
  AdminOrders,
  AdminPayments,
} from './admin/AdminPages';

import AdminProduct from './admin/AdminProduct';


// =====================================================
// APP
// =====================================================

export default function App() {

  return (
    <Routes>

      {/* =========================================
          Layout اصلی
      ========================================= */}

      <Route element={<Layout />}>

        {/* =========================================
            صفحات عمومی
        ========================================= */}

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/products"
          element={<Products />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* =========================================
            صفحات مخصوص کاربران لاگین شده
        ========================================= */}

        <Route element={<ProtectedRoute />}>

          <Route
            path="/cart"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<Checkout />}
          />

          <Route
            path="/orders"
            element={<Orders />}
          />

          <Route
            path="/orders/:id"
            element={<OrderDetailRoute />}
          />

        </Route>


        {/* =========================================
            USER DASHBOARD
        ========================================= */}

        <Route
          element={
            <ProtectedRoute
              roles={['user']}
            />
          }
        >
          <Route
            path="/dashboard"
            element={<UserDashboard />}
          />
        </Route>


        {/* =========================================
            PET SHOP DASHBOARD
        ========================================= */}

        <Route
          element={
            <ProtectedRoute
              roles={['pet_shop']}
            />
          }
        >
          <Route
            path="/dashboard/pet-shop"
            element={<PetShopDashboard />}
          />
        </Route>


        {/* =========================================
            PHARMACY DASHBOARD
        ========================================= */}

        <Route
          element={
            <ProtectedRoute
              roles={['pharmacy']}
            />
          }
        >
          <Route
            path="/dashboard/pharmacy"
            element={<PharmacyDashboard />}
          />
        </Route>


        {/* =========================================
            VACCINATION DASHBOARD
        ========================================= */}

        <Route
          element={
            <ProtectedRoute
              roles={['vaccination']}
            />
          }
        >
          <Route
            path="/dashboard/vaccination"
            element={<VaccinationDashboard />}
          />
        </Route>


        {/* =========================================
            ADMIN
        ========================================= */}

        <Route
          element={
            <ProtectedRoute
              roles={['admin']}
            />
          }
        >

          <Route
            path="/admin"
            element={<AdminDashboard />}
          />

          <Route
            path="/admin/users"
            element={<AdminUsers />}
          />

          <Route
            path="/admin/products"
            element={<AdminProducts />}
          />

          <Route
            path="/admin/products/new"
            element={<AdminProduct />}
          />

          <Route
            path="/admin/products/:id"
            element={<AdminProduct />}
          />

          <Route
            path="/admin/inventory"
            element={<AdminInventory />}
          />

          <Route
            path="/admin/orders"
            element={<AdminOrders />}
          />

          <Route
            path="/admin/payments"
            element={<AdminPayments />}
          />

        </Route>

      </Route>

    </Routes>
  );
}


// =====================================================
// ORDER DETAIL ROUTE
// =====================================================

function OrderDetailRoute() {

  const { id } = useParams();

  return (
    <OrderDetail id={id} />
  );
}