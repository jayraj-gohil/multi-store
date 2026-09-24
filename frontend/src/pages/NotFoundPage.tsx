import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <p className="text-5xl font-bold text-slate-300">404</p>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
        Back to home
      </Link>
    </section>
  );
}
