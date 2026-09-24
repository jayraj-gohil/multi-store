import type { ReactNode } from 'react';

const highlights = [
  ['Multi-store inventory', 'Products live in several stores at once, tracked independently.'],
  ['Smart allocation', 'Orders are filled from the nearest store that can cover the quantity.'],
  ['Automatic discounts', 'Quantity and platform discounts are applied server-side, never combined.'],
] as const;

/** Split-screen shell shared by the login and register pages. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-slate-900 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 text-white">M</span>
            Multi-Store
          </div>
        </div>
        <div className="relative space-y-8">
          <h1 className="text-3xl font-bold leading-tight">Run every store from one dashboard.</h1>
          <ul className="space-y-5">
            {highlights.map(([heading, body]) => (
              <li key={heading} className="flex gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs">
                  ✓
                </span>
                <div>
                  <p className="font-medium">{heading}</p>
                  <p className="text-sm text-slate-300">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">© {new Date().getFullYear()} Multi-Store Ordering System</p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 text-lg font-semibold text-slate-900 lg:hidden">
            <span className="flex size-8 items-center justify-center rounded-lg bg-slate-900 text-white">M</span>
            Multi-Store
          </div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
