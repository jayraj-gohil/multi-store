import { Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function HomePage() {
  const { user } = useAuth();

  if (user?.role === 'ADMIN') return <Navigate to="/admin/stores" replace />;
  if (user?.role === 'CUSTOMER') return <Navigate to="/products" replace />;

  return (
    <section className="space-y-6 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Multi-Store Ordering System</h1>
      <p className="text-slate-600">
        <a href="/login" className="text-blue-600 hover:underline">
          Log in
        </a>{' '}
        or{' '}
        <a href="/register" className="text-blue-600 hover:underline">
          register
        </a>{' '}
        to get started.
      </p>
    </section>
  );
}
