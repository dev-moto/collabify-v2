import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/login";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MessageSquareText,
  ShieldCheck,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "~/components/BrandLogo";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui";
import { signInWithEmail, validateEmail, validatePassword } from "~/services/authService";
import { getCurrentProfile, profileHomePath } from "~/services/profileService";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Log in | Collabify" }];
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const emailError = email ? validateEmail(email) : "";
  const passwordError = password ? validatePassword(password) : "";
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const firstError = validateEmail(email) || validatePassword(password);
    if (firstError) { setStatus("error"); setMessage(firstError); return; }
    setStatus("loading");
    try { await signInWithEmail(email, password); const profile = await getCurrentProfile(); setStatus("success"); setMessage("Login successful. Redirecting to your workspace..."); setTimeout(() => navigate(profileHomePath(profile)), 600); }
    catch (error) { setStatus("error"); setMessage(error instanceof Error ? error.message : "Unable to log in."); }
  }
  return (
    <main className="min-h-svh overflow-y-auto bg-slate-50 text-slate-950 lg:h-svh lg:overflow-hidden dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-svh lg:h-full lg:min-h-0 lg:grid-cols-[1.02fr_0.98fr]">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-white p-7 text-slate-950 lg:flex lg:flex-col lg:justify-between xl:p-9 dark:border-white/10 dark:bg-slate-950 dark:text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(6,182,212,0.18),_transparent_32%),radial-gradient(circle_at_88%_18%,_rgba(124,58,237,0.16),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(248,250,252,1))] dark:bg-[radial-gradient(circle_at_20%_10%,_rgba(6,182,212,0.34),_transparent_32%),radial-gradient(circle_at_88%_18%,_rgba(124,58,237,0.36),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(2,6,23,1))]" />
          <div className="relative z-10">
            <BrandLogo />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-800 backdrop-blur xl:text-sm dark:border-white/10 dark:bg-white/10 dark:text-cyan-100">
              <ShieldCheck className="h-4 w-4" /> Secure collaboration workspace
            </div>
            <h1 className="text-4xl font-black tracking-tight xl:text-5xl">Welcome back to Collabify.</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600 xl:text-lg dark:text-slate-300">
              Manage collaborations, review campaign updates, schedule appointments, and continue private conversations with the right partners.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <TrustMetric icon={UserRoundCheck} label="Profiles" value="Public-safe" />
              <TrustMetric icon={MessageSquareText} label="Messages" value="Participant-only" />
              <TrustMetric icon={ShieldCheck} label="Access" value="RLS-backed" />
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-950/5 backdrop-blur xl:p-5 dark:border-white/10 dark:bg-white/10 dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">Verified outreach keeps collaborations safer.</p>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Businesses need approval before publishing campaigns or contacting creators.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-svh flex-col px-5 py-4 sm:px-8 lg:h-full lg:min-h-0 lg:px-10 xl:px-12">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.16),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.14),_transparent_34%)]" />
          <header className="flex items-center justify-between">
            <div className="lg:hidden">
              <BrandLogo />
            </div>
              <Link to="/" className="hidden cursor-pointer text-sm font-bold text-slate-600 hover:text-slate-950 lg:inline-flex dark:text-slate-300 dark:hover:text-white">
              ← Back to home
            </Link>
            <ThemeToggle />
          </header>

          <div className="flex min-h-0 flex-1 items-center justify-center py-6 lg:py-4">
            <div className="w-full max-w-xl">
              <div className="mb-5 text-center lg:text-left">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl xl:text-5xl">Log in to your account</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Enter your email and password to access your Collabify workspace.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-slate-950/8 backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6 xl:p-7">
                <form className="grid gap-4" onSubmit={onSubmit} noValidate>
                  <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Email address
                    <span className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-12 pr-4 text-slate-950 outline-none ring-cyan-500/20 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 dark:border-white/10 dark:bg-white/10 dark:text-white xl:py-3"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.currentTarget.value)}
                        aria-invalid={Boolean(emailError)}
                        autoComplete="email"
                      />
                    </span>
                  </label>
                  {emailError && <p className="text-xs font-medium text-red-600" role="alert">{emailError}</p>}

                  <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Password
                    <span className="relative">
                      <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-12 pr-12 text-slate-950 outline-none ring-cyan-500/20 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 dark:border-white/10 dark:bg-white/10 dark:text-white xl:py-3"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.currentTarget.value)}
                        aria-invalid={Boolean(passwordError)}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:text-slate-300 dark:hover:bg-white/10"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </span>
                  </label>
                  {passwordError && <p className="text-xs font-medium text-red-600" role="alert">{passwordError}</p>}

                  <div className="flex justify-end text-sm">
                    <Link to="/forgot-password" className="cursor-pointer font-bold text-cyan-700 hover:text-cyan-900 dark:text-cyan-300 dark:hover:text-cyan-100">Forgot password?</Link>
                  </div>

                  <Button type="submit" disabled={status === "loading"} className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 py-2.5 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.01] dark:text-white xl:py-3">
                    {status === "loading" ? "Signing you in..." : <>Log in <ArrowRight className="h-4 w-4" /></>}
                  </Button>

                  {status !== "idle" && status !== "loading" && (
                    <LoginAlert type={status} message={message} />
                  )}
                </form>
              </div>

              <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
                Don’t have an account yet? <Link to="/signup" className="cursor-pointer font-bold text-cyan-700 dark:text-cyan-300">Create one here</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function LoginAlert({ type, message }: { type: "success" | "error"; message: string }) {
  const isSuccess = type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
          : "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"
      }`}
    >
      {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <p className="leading-5">{message}</p>
    </div>
  );
}

function TrustMetric({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur xl:p-4 dark:border-white/10 dark:bg-white/10 dark:shadow-none">
      <Icon className="h-5 w-5 text-cyan-600 dark:text-cyan-200" />
      <p className="mt-3 text-base font-black text-slate-950 xl:text-lg dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}
