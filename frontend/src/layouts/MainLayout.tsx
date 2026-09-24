import { NavLink, Outlet } from 'react-router';

export function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <NavLink to="/" className="text-lg font-semibold text-slate-900">
            App
          </NavLink>
          {/* Add navigation links here */}
        </nav>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-4 text-center text-sm text-slate-500">
        © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
