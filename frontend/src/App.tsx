import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useEffect } from 'react';
import { RouteMeta } from './components/Seo/RouteMeta';
import { MainLayout } from './components/Layout/MainLayout';
import { AdminLayout } from './components/Layout/AdminLayout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import './styles/payment-success.css';

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
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage').then((module) => ({ default: module.OrderSuccessPage })));
const PaymentSuccessPage = lazy(() => import('./pages/PaymentSuccessPage').then((module) => ({ default: module.PaymentSuccessPage })));
const PaymentReturnPage = lazy(() => import('./pages/PaymentReturnPage').then((module) => ({ default: module.PaymentReturnPage })));
const WishlistPage = lazy(() => import('./pages/WishlistPage').then((module) => ({ default: module.WishlistPage })));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })));
const AdminProductsPage = lazy(() => import('./pages/AdminProductsPage').then((module) => ({ default: module.AdminProductsPage })));
const AdminOrdersPage = lazy(() => import('./pages/AdminOrdersPage').then((module) => ({ default: module.AdminOrdersPage })));
const AdminReportsPage = lazy(() => import('./pages/AdminReportsPage').then((module) => ({ default: module.AdminReportsPage })));
const AdminVouchersPage = lazy(() => import('./pages/AdminVouchersPage').then((module) => ({ default: module.AdminVouchersPage })));
const AdminAuditLogsPage = lazy(() => import('./pages/AdminAuditLogsPage').then((module) => ({ default: module.AdminAuditLogsPage })));
const AdminOrderDetailPage = lazy(() => import('./pages/AdminOrderDetailPage').then((module) => ({ default: module.AdminOrderDetailPage })));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage').then((module) => ({ default: module.AdminUsersPage })));
const AdminUserDetailPage = lazy(() => import('./pages/AdminUserDetailPage').then((module) => ({ default: module.AdminUserDetailPage })));
const AdminDecantPage = lazy(() => import('./pages/AdminDecantPage').then((module) => ({ default: module.AdminDecantPage })));
const AdminInventoryPage = lazy(() => import('./pages/AdminInventoryPage').then((module) => ({ default: module.AdminInventoryPage })));
const AdminProductAddPage = lazy(() => import('./pages/AdminProductAddPage').then((module) => ({ default: module.AdminProductAddPage })));
const AdminProductEditPage = lazy(() => import('./pages/AdminProductEditPage').then((module) => ({ default: module.AdminProductEditPage })));
const AdminProductManagementPage = lazy(() => import('./pages/AdminProductManagementPage').then((module) => ({ default: module.AdminProductManagementPage })));

const appMode = typeof __HUY_PERFUME_APP__ === 'undefined' ? 'user' : __HUY_PERFUME_APP__;
const userHomeUrl = `${(import.meta.env.VITE_USER_APP_URL || 'http://localhost:5177').replace(/\/+$/, '')}/home`;
const adminHomeUrl = `${(import.meta.env.VITE_ADMIN_APP_URL || 'http://localhost:5178').replace(/\/+$/, '')}/admin`;

function Loading() {
  return (
    <div className="luxury-page container py-5">
      <div className="luxury-surface p-5 text-center">
        <div className="spinner-border" role="status" aria-label="Đang tải" />
      </div>
    </div>
  );
}

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);

  return <Loading />;
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin" element={<ProtectedRoute adminOnly unauthorizedTo="/login"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="voucher" element={<AdminVouchersPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="decant" element={<AdminDecantPage />} />
        <Route path="users/:id" element={<AdminUserDetailPage />} />
        <Route path="products/add" element={<AdminProductAddPage />} />
        <Route path="products/:id/edit" element={<AdminProductEditPage />} />
        <Route path="products/manage" element={<AdminProductManagementPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<ExternalRedirect to={userHomeUrl} />} />
      <Route path="/products" element={<Navigate to="/admin/products" replace />} />
      <Route path="/orders" element={<Navigate to="/admin/orders" replace />} />
      <Route path="/reports" element={<Navigate to="/admin/reports" replace />} />
      <Route path="/users" element={<Navigate to="/admin/users" replace />} />
      <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}

function UserRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistoryPage /></ProtectedRoute>} />
        <Route path="/orders/:id/success" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
        <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
        <Route path="/checkout/success" element={<PaymentSuccessPage />} />
        <Route path="/order-success" element={<PaymentSuccessPage />} />
        <Route path="/payment/return" element={<PaymentReturnPage />} />
        <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      </Route>

      <Route path="/admin" element={<ExternalRedirect to={`${adminHomeUrl.replace(/\/admin$/, '')}/admin`} />} />
      <Route path="/admin/*" element={<ExternalRedirect to={adminHomeUrl} />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
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
