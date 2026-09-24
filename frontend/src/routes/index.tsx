import { createBrowserRouter, Navigate } from 'react-router';
import { AdminLayout } from '../layouts/AdminLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { MainLayout } from '../layouts/MainLayout';
import { AdminDiscountsPage } from '../pages/admin/AdminDiscountsPage';
import { AdminInventoryPage } from '../pages/admin/AdminInventoryPage';
import { AdminOrdersPage } from '../pages/admin/AdminOrdersPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminStoresPage } from '../pages/admin/AdminStoresPage';
import { CartPage } from '../pages/customer/CartPage';
import { CustomerOrdersPage } from '../pages/customer/CustomerOrdersPage';
import { CustomerProductsPage } from '../pages/customer/CustomerProductsPage';
import { OrderDetailPage } from '../pages/customer/OrderDetailPage';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { RegisterPage } from '../pages/RegisterPage';
import { ProtectedRoute } from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
  {
    element: <ProtectedRoute allowedRoles={['ADMIN']} />,
    children: [
      {
        path: 'admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="stores" replace /> },
          { path: 'stores', element: <AdminStoresPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'inventory', element: <AdminInventoryPage /> },
          { path: 'discounts', element: <AdminDiscountsPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={['CUSTOMER']} />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          { path: 'products', element: <CustomerProductsPage /> },
          { path: 'cart', element: <CartPage /> },
          { path: 'orders', element: <CustomerOrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
