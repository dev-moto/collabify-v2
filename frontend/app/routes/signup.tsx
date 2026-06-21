import { Link, useNavigate } from "react-router";
import type { Route } from "./+types/signup";
import { useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "~/components/BrandLogo";
import { ThemeToggle } from "~/components/ThemeToggle";
import { Button } from "~/components/ui";
import { signUpWithEmail, validateEmail, validatePassword } from "~/services/authService";
import type { ProfileRole } from "~/services/profileService";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Create account | Collabify" }];
}

const personas = {
  creator: {
    icon: UserRoundCheck,
    label: "Creator",
    title: "I create content",
    description: "Build your profile, showcase niches, and respond to verified businesses.",
    bullets: ["Public-safe profile", "Campaign and x-deal opportunities", "Private messages and appointments"],
  },
  business: {
    icon: Building2,
    label: "Business",
    title: "I represent a brand",
    description: "Verify your business, discover creators, and manage campaigns professionally.",
    bullets: ["Verification-first outreach", "Creator discovery by city", "Campaign and offer tracking"],
  },
} satisfies Record<ProfileRole, { icon: LucideIcon; label: string; title: string; description: string; bullets: string[] }>;

export default function Signup() {
  const navigate = useNavigate();
  const [role, setRole] = useState<ProfileRole>("creator");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const selectedPersona = personas[role];
  const emailError = email ? validateEmail(email) : "";
  const passwordError = password ? validatePassword(password) : "";
  const SelectedPersonaIcon = selectedPersona.icon;

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const firstError = validateEmail(email) || validatePassword(password);
    if (firstError) {
      setStatus("error");
      setMessage(firstError);
      return;
    }

    if (displayName.trim().length < 2) {
      setStatus("error");
      setMessage(role === "creator" ? "Enter your creator name." : "Enter your business or brand name.");
      return;
    }

    setStatus("loading");
    try {
      await signUpWithEmail(email, password, {
        intended_role: role,
        display_name: displayName.trim(),
        city: city.trim(),
      });
      setStatus("success");
      setMessage("Account created. Please verify your email to continue.");
      setTimeout(() => navigate("/verify-email"), 900);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to create account.");
    }
  }

  return (
    <main className="min-h-svh overflow-y-auto bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="grid min-h-svh lg:grid-cols-[0.95fr_1.05fr]">
        <section className="relative hidden overflow-hidden border-r border-slate-200 bg-white p-7 lg:flex lg:flex-col lg:justify-between xl:p-9 dark:border-white/10 dark:bg-slate-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,_rgba(6,182,212,0.18),_transparent_32%),radial-gradient(circle_at_88%_18%,_rgba(124,58,237,0.16),_transparent_30%),linear-gradient(135deg,_rgba(255,255,255,0.96),_rgba(248,250,252,1))] dark:bg-[radial-gradient(circle_at_20%_10%,_rgba(6,182,212,0.3),_transparent_32%),radial-gradient(circle_at_88%_18%,_rgba(124,58,237,0.34),_transparent_30%),linear-gradient(135deg,_rgba(15,23,42,0.92),_rgba(2,6,23,1))]" />
          <div className="relative z-10"><BrandLogo /></div>

          <div className="relative z-10 max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-800 dark:border-white/10 dark:bg-white/10 dark:text-cyan-100">
              <Sparkles className="h-4 w-4" /> Start with the right workspace
            </div>
            <h1 className="text-4xl font-black tracking-tight xl:text-5xl">Create your Collabify account.</h1>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Choose whether you are joining as a creator or a business. We will use this to guide your onboarding after email verification.
            </p>
          </div>

          <div className="relative z-10 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-xl shadow-slate-950/5 backdrop-blur dark:border-white/10 dark:bg-white/10 dark:shadow-none">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">Privacy-first from day one.</p>
                <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">Public discovery uses safe fields only. Private deal details stay protected by Supabase RLS.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-svh flex-col px-5 py-4 sm:px-8 lg:px-10 xl:px-12">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.16),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,0.14),_transparent_34%)]" />
          <header className="flex items-center justify-between">
            <div className="lg:hidden"><BrandLogo /></div>
            <Link to="/" className="hidden cursor-pointer text-sm font-bold text-slate-600 hover:text-slate-950 lg:inline-flex dark:text-slate-300 dark:hover:text-white">← Back to home</Link>
            <ThemeToggle />
          </header>

          <div className="flex flex-1 items-center justify-center py-6">
            <div className="w-full max-w-3xl">
              <div className="mb-5 text-center lg:text-left">
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Create account</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">Select your account type and enter your login details.</p>
              </div>

              <form className="grid gap-5" onSubmit={onSubmit} noValidate>
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Choose account type">
                  {(Object.keys(personas) as ProfileRole[]).map((persona) => (
                    <PersonaCard key={persona} selected={role === persona} onSelect={() => setRole(persona)} {...personas[persona]} />
                  ))}
                </div>

                <div className="rounded-[1.75rem] border border-slate-200 bg-white/90 p-5 shadow-2xl shadow-slate-950/8 backdrop-blur dark:border-white/10 dark:bg-white/5 sm:p-6">
                  <div className="mb-5 flex items-start gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                    <SelectedPersonaIcon className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600 dark:text-cyan-200" />
                    <div>
                      <p className="font-bold">Signing up as {selectedPersona.label}</p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selectedPersona.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {role === "creator" ? "Creator name" : "Business or brand name"}
                      <input className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-slate-950 outline-none ring-cyan-500/20 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 dark:border-white/10 dark:bg-white/10 dark:text-white" value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} placeholder={role === "creator" ? "Ana Reyes" : "Sunrise Cafe PH"} />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      City or area
                      <span className="relative">
                        <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-950 outline-none ring-cyan-500/20 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 dark:border-white/10 dark:bg-white/10 dark:text-white" value={city} onChange={(event) => setCity(event.currentTarget.value)} placeholder="Quezon City" />
                      </span>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Email address
                      <span className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-slate-950 outline-none ring-cyan-500/20 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 dark:border-white/10 dark:bg-white/10 dark:text-white" type="email" value={email} onChange={(event) => setEmail(event.currentTarget.value)} placeholder="you@example.com" aria-invalid={Boolean(emailError)} autoComplete="email" />
                      </span>
                    </label>
                    <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Password
                      <span className="relative">
                        <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-11 pr-12 text-slate-950 outline-none ring-cyan-500/20 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-4 dark:border-white/10 dark:bg-white/10 dark:text-white" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.currentTarget.value)} placeholder="At least 8 characters" aria-invalid={Boolean(passwordError)} autoComplete="new-password" />
                        <button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:text-slate-300 dark:hover:bg-white/10">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </span>
                    </label>
                  </div>

                  {(emailError || passwordError) && <p className="mt-3 text-xs font-medium text-red-600" role="alert">{emailError || passwordError}</p>}

                  <Button type="submit" disabled={status === "loading"} className="mt-5 w-full bg-gradient-to-r from-cyan-500 to-violet-600 py-3 text-white shadow-lg shadow-cyan-500/20 hover:scale-[1.01] dark:text-white">
                    {status === "loading" ? "Creating account..." : <>Create {selectedPersona.label.toLowerCase()} account <ArrowRight className="h-4 w-4" /></>}
                  </Button>

                  {status !== "idle" && status !== "loading" && <SignupAlert type={status} message={message} />}
                </div>
              </form>

              <div className="mt-4 text-center text-sm text-slate-600 dark:text-slate-300">
                Already have an account? <Link to="/login" className="cursor-pointer font-bold text-cyan-700 dark:text-cyan-300">Log in</Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PersonaCard({ selected, onSelect, icon: Icon, title, description, bullets }: { selected: boolean; onSelect: () => void; icon: LucideIcon; title: string; description: string; bullets: string[] }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={`cursor-pointer rounded-[1.5rem] border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 ${selected ? "border-cyan-400 bg-cyan-50 shadow-lg shadow-cyan-500/10 dark:border-cyan-300 dark:bg-cyan-400/10" : "border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/5"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white"><Icon className="h-5 w-5" /></div>
        {selected && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
      </div>
      <h3 className="mt-4 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
      <ul className="mt-4 grid gap-2">
        {bullets.map((bullet) => <li key={bullet} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {bullet}</li>)}
      </ul>
    </button>
  );
}

function SignupAlert({ type, message }: { type: "success" | "error"; message: string }) {
  const isSuccess = type === "success";
  return (
    <div role={isSuccess ? "status" : "alert"} className={`mt-4 flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${isSuccess ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200"}`}>
      {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
      <p className="leading-5">{message}</p>
    </div>
  );
}
