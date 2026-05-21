import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { RouteMeta } from './components/Seo/RouteMeta';
import { MainLayout } from './components/Layout/MainLayout';
import { AdminLayout } from './components/Layout/AdminLayout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

declare const __HUY_PERFUME_APP__: 'user' | 'admin';

const HomePage = lazy(() => import('./pages/HomePage').then((module) => ({ default: module.HomePage })));
const ProductListPage = lazy(() => import('./pages/ProductListPage').then((module) => ({ default: module.ProductListPage })));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then((module) => ({ default: module.ProductDetailPage })));
const CartPage = lazy(() => import('./pages/CartPage').then((module) => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const OrderHistoryPage = lazy(() => import('./pages/OrderHistoryPage').then((module) => ({ default: module.OrderHistoryPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((module) => ({ default: module.WishlistPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage').then((module) => ({ default: module.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage').then((module) => ({ default: module.AdminOrdersPage })));
const AdminOrderDetailPage = lazy(() => import('./pages/AdminOrderDetailPage').then((module) => ({ default: module.AdminOrderDetailPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })));

const appMode = typeof __HUY_PERFUME_APP__ === 'undefined' ? 'user' : __HUY_PERFUME_APP__;

function Loading() {
  return (
    <div className="luxury-page container py-5">
      <div className="luxury-surface p-5 text-center">
        <div className="spinner-border" role="status" aria-label="Đang tải" />
      </div>
    </div>
  );
}

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute adminOnly unauthorizedTo="/login"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function UserRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      </Route>

      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <>
      <RouteMeta />
      <Suspense fallback={<Loading />}>
        {appMode === 'admin' ? <AdminRoutes /> : <UserRoutes />}
      </Suspense>
    </>
  );
}
