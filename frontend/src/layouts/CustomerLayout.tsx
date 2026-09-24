import { NavLink, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const links = [
  { to: '/products', label: 'Products' },
  { to: '/cart', label: 'Cart' },
  { to: '/orders', label: 'My orders' },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function CustomerLayout() {
  const { user, logout } = useAuth();
  const { lines } = useCart();
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                M
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">Multi-Store</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Storefront</p>
              </div>
            </div>
            <nav className="flex gap-6">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `text-sm font-medium ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900'}`
                  }
                >
                  {l.label}
                  {l.to === '/cart' && itemCount > 0 && (
                    <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-semibold text-white">
                      {itemCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                {user ? initials(user.name) : ''}
              </span>
              <div className="hidden leading-tight sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              type="button"
              className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="w-full flex-1 px-6 py-8">
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} Multi-Store Ordering System
      </footer>
    </div>
  );
}
