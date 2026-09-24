import { createBrowserRouter } from 'react-router';
import { MainLayout } from '../layouts/MainLayout';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';

/**
 * Central route table. Add pages as children of the layout they belong to.
 * For protected pages, wrap them in a guard route element once auth exists, e.g.
 *   { element: <ProtectedRoute />, children: [{ path: 'dashboard', element: <DashboardPage /> }] }
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
