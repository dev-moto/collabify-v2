import { Link, Navigate, useLocation } from "react-router";
import { AlertCircle, CheckCircle2, Loader2, Search, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useAppSelector } from "~/store/hooks";
import { BrandLogo } from "~/components/BrandLogo";
import { NotificationBell } from "~/components/NotificationBell";
import { ThemeToggle } from "~/components/ThemeToggle";
import { UserMenu } from "~/components/UserMenu";
import { profileHomePath, type AccountRole } from "~/services/profileService";

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = variant === "primary" ? "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950" : variant === "secondary" ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10";
  return <button className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-70 ${styles} ${className}`} {...props}>{children}</button>;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "cyan" | "violet" | "red" }) {
  const tones = { slate: "bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200", green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200", amber: "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-200", cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200", violet: "bg-violet-50 text-violet-700 dark:bg-violet-400/10 dark:text-violet-200", red: "bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200" };
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${tones[tone]}`}>{children}</span>;
}

export function StatusPanel({ type, title, message }: { type: "loading" | "empty" | "error" | "success"; title: string; message: string }) {
  const Icon = type === "loading" ? Loader2 : type === "error" ? AlertCircle : type === "success" ? CheckCircle2 : Sparkles;
  return <div role={type === "error" ? "alert" : "status"} className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center dark:border-white/10 dark:bg-white/5"><Icon className={`mx-auto h-8 w-8 ${type === "loading" ? "animate-spin" : ""}`} /><h3 className="mt-3 font-black">{title}</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message}</p></div>;
}

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200"><span>{label}</span>{children}{error && <span className="text-xs font-medium text-red-600" role="alert">{error}</span>}</label>;
}

export function AppShell({ children, role = "creator", title, description }: { children: ReactNode; role?: "creator" | "business" | "admin"; title: string; description: string }) {
  const discoverLabel = role === "creator" ? "Discover businesses" : "Discover creators";
  const discoverHref = role === "creator" ? "/discover/businesses" : "/discover/creators";
  const nav = role === "admin" ? [["Admin", "/admin"], ["Reports", "/admin"], ["Audit logs", "/admin"]] : [["Dashboard", role === "creator" ? "/creator/dashboard" : "/business/dashboard"], [discoverLabel, discoverHref], ["Campaigns", "/campaigns"], ["Appointments", "/appointments"], ["Messages", "/messages"]];
  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="cursor-pointer font-black">Collabify</Link>
          <nav aria-label={`${role} navigation`} className="hidden gap-1 md:flex">
            {nav.map(([label, href]) => <Link key={label} to={href} className="cursor-pointer rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">{label}</Link>)}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
        <nav aria-label={`${role} mobile navigation`} className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {nav.map(([label, href]) => <Link key={label} to={href} className="shrink-0 cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">{label}</Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <Badge tone="cyan">{role} workspace</Badge>
          <h1 className="mt-3 text-2xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">{description}</p>
        </div>
        <div className="min-w-0">{children}</div>
      </main>
    </div>
  );
}

/** Lightweight shell for public pages (discover, profiles). Shows app navigation
 *  with links tailored for both authenticated and anonymous users. */
export function PublicShell({ children }: { children: ReactNode }) {
  const status = useAppSelector((state) => state.session.status);
  const profile = useAppSelector((state) => state.session.profile);
  const isAuthed = status === "authenticated";

  const discoverLinks = isAuthed
    ? profile?.role === "creator"
      ? [["Discover businesses", "/discover/businesses"] as const]
      : profile?.role === "business"
        ? [["Discover creators", "/discover/creators"] as const]
        : []
    : [["Discover creators", "/discover/creators"] as const, ["Discover businesses", "/discover/businesses"] as const];

  const navLinks = [
    ...(isAuthed && profile?.role === "creator" ? [["Dashboard", "/creator/dashboard"]] as const : []),
    ...(isAuthed && profile?.role === "business" ? [["Dashboard", "/business/dashboard"]] as const : []),
    ...discoverLinks,
    ...(isAuthed ? [["Messages", "/messages"] as const, ["Campaigns", "/campaigns"] as const] : []),
    ...(isAuthed ? [] : [["Log in", "/login"] as const]),
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <BrandLogo />
          <nav aria-label="Public navigation" className="hidden items-center gap-1 md:flex">
            {navLinks.map(([label, href]) => (
              <Link key={label} to={href} className="cursor-pointer rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">
                {label}
              </Link>
            ))}
            {isAuthed && <NotificationBell />}
            {isAuthed && <UserMenu />}
            <ThemeToggle />
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            {isAuthed && <NotificationBell />}
            {isAuthed && <UserMenu />}
            <ThemeToggle />
          </div>
        </div>
        <nav aria-label="Public mobile navigation" className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navLinks.map(([label, href]) => (
            <Link key={label} to={href} className="shrink-0 cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}

export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: AccountRole[] }) {
  const status = useAppSelector((state) => state.session.status);
  const profile = useAppSelector((state) => state.session.profile);
  const profileStatus = useAppSelector((state) => state.session.profileStatus);
  const location = useLocation();

  if (status === "idle" || status === "loading") return <main className="min-h-screen p-6"><StatusPanel type="loading" title="Checking your session" message="Please wait while we confirm your access." /></main>;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  if (profileStatus === "idle" || profileStatus === "loading") return <main className="min-h-screen p-6"><StatusPanel type="loading" title="Loading your profile" message="Please wait while we prepare your workspace." /></main>;
  if (profileStatus === "error") return <main className="min-h-screen p-6"><StatusPanel type="error" title="Profile unavailable" message="We could not load your profile. Please refresh or try again later." /></main>;
  if (location.pathname !== "/onboarding" && (profileStatus === "missing" || !profile?.onboarding_completed)) return <Navigate to="/onboarding" replace />;
  if (allowedRoles?.length && profile && !allowedRoles.includes(profile.role)) return <Navigate to={profileHomePath(profile)} replace />;

  return children;
}

export function SearchBox({ placeholder = "Search", value, onChange, ...props }: { placeholder?: string; value?: string; onChange?: React.ChangeEventHandler<HTMLInputElement> } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "placeholder" | "value" | "onChange">) {
  return <label className="relative block"><span className="sr-only">{placeholder}</span><Search className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" /><input value={value} onChange={onChange} className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-400 dark:border-white/10 dark:bg-white/10" placeholder={placeholder} {...props} /></label>;
}

export function VerifiedMark() { return <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" /> Verified</span>; }

export function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <Card><Icon className="h-5 w-5 text-cyan-500" /><p className="mt-4 text-2xl font-black">{value}</p><p className="text-sm text-slate-500">{label}</p></Card>; }
