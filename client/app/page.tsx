// client/app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Top nav */}
      <header className="w-full border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg font-bold">
              IS
            </span>
            <span className="text-sm font-semibold tracking-tight">
              InventorySaaS
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/register"
              className="hidden sm:inline-flex text-sm text-slate-300 hover:text-white transition-colors"
            >
              Sign up
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1">
        <div className="mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/80">
            Multi-tenant inventory & POS
          </p>
          <h1 className="max-w-2xl text-balance text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight">
            Run your inventory, sales, and reports in one dashboard.
          </h1>
          <p className="mt-4 max-w-xl text-sm sm:text-base text-slate-300/80">
            Real-time stock, fast POS checkout, and clear reports for every
            location. Built for growing businesses that need clarity, not
            spreadsheets.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className="inline-flex items-center rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 shadow-sm hover:bg-emerald-400 transition-colors"
            >
              Login to dashboard
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center rounded-md border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-100 hover:border-slate-500 hover:bg-slate-900/40 transition-colors"
            >
              Start free trial
            </Link>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            No credit card required. You can add your first store in minutes.
          </p>
        </div>
      </section>

      {/* Tiny footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between text-[11px] text-slate-500">
          <span>© {new Date().getFullYear()} InventorySaaS</span>
          <span className="hidden sm:inline">
            Built with Next.js, Node.js, and MongoDB.
          </span>
        </div>
      </footer>
    </main>
  );
}
