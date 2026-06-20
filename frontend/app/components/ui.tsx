import { Link, Navigate } from "react-router";
import { AlertCircle, Bell, CheckCircle2, Loader2, Search, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useAppSelector } from "~/store/hooks";

export function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = variant === "primary" ? "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950" : variant === "secondary" ? "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 dark:border-white/10 dark:bg-white/10 dark:text-white" : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10";
  return <button className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-cyan-400 ${styles} ${className}`} {...props}>{children}</button>;
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
  const nav = role === "admin" ? [["Admin", "/admin"], ["Reports", "/admin"], ["Audit logs", "/admin"], ["Settings", "/settings"]] : [["Dashboard", role === "creator" ? "/creator/dashboard" : "/business/dashboard"], ["Discover", "/discover/creators"], ["Campaigns", "/campaigns"], ["Appointments", "/appointments"], ["Messages", "/messages"], ["Billing", "/billing"]];
  return <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-slate-950/90"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3"><Link to="/" className="font-black">Collabify</Link><nav aria-label={`${role} navigation`} className="hidden gap-1 md:flex">{nav.map(([label, href]) => <Link key={label} to={href} className="rounded-full px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10">{label}</Link>)}</nav><button aria-label="Notifications" className="rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-cyan-400"><Bell className="h-5 w-5" /></button></div></header><main className="mx-auto max-w-7xl px-4 py-8"><div className="mb-8"><Badge tone="cyan">{role} workspace</Badge><h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{description}</p></div>{children}</main></div>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const status = useAppSelector((state) => state.session.status);
  if (status === "idle" || status === "loading") return <main className="min-h-screen p-6"><StatusPanel type="loading" title="Checking your session" message="Please wait while we confirm your access." /></main>;
  if (status !== "authenticated") return <Navigate to="/login" replace />;
  return children;
}

export function SearchBox({ placeholder = "Search" }: { placeholder?: string }) {
  return <label className="relative block"><span className="sr-only">Search</span><Search className="pointer-events-none absolute left-4 top-3 h-5 w-5 text-slate-400" /><input className="w-full rounded-full border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-cyan-400 dark:border-white/10 dark:bg-white/10" placeholder={placeholder} /></label>;
}

export function VerifiedMark() { return <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-300"><ShieldCheck className="h-4 w-4" /> Verified</span>; }

export function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) { return <Card><Icon className="h-5 w-5 text-cyan-500" /><p className="mt-4 text-2xl font-black">{value}</p><p className="text-sm text-slate-500">{label}</p></Card>; }
