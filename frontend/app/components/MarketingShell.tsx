import { Link } from "react-router";
import { ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-950/85">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8" aria-label="Main navigation">
        <Link to="/" className="flex items-center gap-2 font-semibold text-slate-950 dark:text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Collabify</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          <a href="/#features" className="hover:text-slate-950 dark:hover:text-white">Features</a>
          <a href="/#trust" className="hover:text-slate-950 dark:hover:text-white">Trust</a>
          <a href="/#how-it-works" className="hover:text-slate-950 dark:hover:text-white">How it works</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex dark:text-slate-200 dark:hover:bg-white/10">
            Log in
          </Link>
          <Link to="/signup" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 dark:border-white/10 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8 dark:text-slate-400">
        <p>© {new Date().getFullYear()} Collabify. Philippines-first creator collaborations.</p>
        <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Backend-enforced access with Supabase RLS.</p>
      </div>
    </footer>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
