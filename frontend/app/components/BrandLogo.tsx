import { Link } from "react-router";

export function BrandLogo({ to = "/", compact = false }: { to?: string; compact?: boolean }) {
  return (
    <Link to={to} className="inline-flex cursor-pointer items-center gap-2 font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:text-white dark:focus:ring-offset-slate-950">
      <img src="/collabify-logo.svg" alt="Collabify" className="h-10 w-10 rounded-2xl shadow-lg shadow-indigo-500/20" />
      {!compact && <span>Collabify</span>}
    </Link>
  );
}
