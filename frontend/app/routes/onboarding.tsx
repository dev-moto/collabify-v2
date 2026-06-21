import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, CheckCircle2, UserRound, type LucideIcon } from "lucide-react";
import type { Route } from "./+types/onboarding";

import { Button, ProtectedRoute, StatusPanel } from "~/components/ui";
import { completeOnboarding, profileHomePath, type ProfileRole } from "~/services/profileService";
import { useAppDispatch } from "~/store/hooks";
import { profileChanged } from "~/store/sessionSlice";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Onboarding | Collabify" }];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [role, setRole] = useState<ProfileRole>("creator");
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (displayName.trim().length < 2) {
      setStatus("error");
      setMessage("Enter a display name with at least 2 characters.");
      return;
    }

    setStatus("loading");
    try {
      const profile = await completeOnboarding({ role, displayName, city });
      dispatch(profileChanged(profile));
      setStatus("success");
      setMessage("Onboarding saved. Redirecting to your workspace...");
      setTimeout(() => navigate(profileHomePath(profile)), 700);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to complete onboarding.");
    }
  }

  return (
    <ProtectedRoute><main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <Link to="/" className="mb-10 text-sm font-bold text-cyan-700 dark:text-cyan-300">← Back to Collabify</Link>
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Onboarding</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Set up your Collabify workspace.</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Choose your role and public display details. Supabase RLS enforces that users can only create or update their own profile.</p>
        </div>
        <form className="mt-10 grid gap-6" onSubmit={onSubmit} noValidate>
          <div className="grid gap-5 md:grid-cols-2" role="radiogroup" aria-label="Choose account role">
            <RoleCard selected={role === "creator"} onSelect={() => setRole("creator")} icon={UserRound} title="I’m a creator" description="Build a public-safe profile, add social links, discover campaigns, and respond to verified businesses." />
            <RoleCard selected={role === "business"} onSelect={() => setRole("business")} icon={Building2} title="I’m a business" description="Create your business profile, submit verification documents, and publish campaigns after approval." />
          </div>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-black">Public basics</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use city-level location only. Exact coordinates are not collected or shown publicly.</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                Display name
                <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-white/10" value={displayName} onChange={(event) => setDisplayName(event.currentTarget.value)} placeholder={role === "creator" ? "Ana Reyes" : "Sunrise Cafe PH"} required />
              </label>
              <label className="grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                City or area
                <input className="rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/20 dark:border-white/10 dark:bg-white/10" value={city} onChange={(event) => setCity(event.currentTarget.value)} placeholder="Quezon City" />
              </label>
            </div>
          </section>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" disabled={status === "loading"}>{status === "loading" ? "Saving..." : "Complete onboarding"}</Button>
            <p className="text-sm text-slate-500">You can edit these details later from settings.</p>
          </div>
          {status !== "idle" && status !== "loading" && <StatusPanel type={status} title={status === "success" ? "Profile saved" : "Onboarding issue"} message={message} />}
        </form>
      </div>
    </main></ProtectedRoute>
  );
}

function RoleCard({ selected, onSelect, icon: Icon, title, description }: { selected: boolean; onSelect: () => void; icon: LucideIcon; title: string; description: string }) {
  return (
    <button type="button" role="radio" aria-checked={selected} onClick={onSelect} className={`rounded-[2rem] border p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 ${selected ? "border-cyan-400 bg-cyan-50 dark:border-cyan-300 dark:bg-cyan-400/10" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"}`}>
      <div className="flex items-center justify-between gap-4">
        <Icon className="h-10 w-10 text-cyan-500" />
        {selected && <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden="true" />}
      </div>
      <h2 className="mt-6 text-2xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </button>
  );
}
