import { Link } from "react-router";
import { Building2, UserRound, type LucideIcon } from "lucide-react";
import type { Route } from "./+types/onboarding";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Onboarding | Collabify" }];
}

export default function Onboarding() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center">
        <Link to="/" className="mb-10 text-sm font-bold text-cyan-700 dark:text-cyan-300">← Back to Collabify</Link>
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Onboarding</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Choose how you want to collaborate.</h1>
          <p className="mt-4 text-slate-600 dark:text-slate-300">This role selection is the starting point for profile setup. Backend policies will enforce sensitive role and admin authorization.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <RoleCard to="/creator/dashboard" icon={UserRound} title="I’m a creator" description="Build a public-safe profile, add social links, discover campaigns, and respond to verified businesses." />
          <RoleCard to="/business/dashboard" icon={Building2} title="I’m a business" description="Create your business profile, submit verification documents, and publish campaigns after approval." />
        </div>
      </div>
    </main>
  );
}

function RoleCard({ to, icon: Icon, title, description }: { to: string; icon: LucideIcon; title: string; description: string }) {
  return (
    <Link to={to} className="rounded-[2rem] border border-slate-200 bg-white p-8 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:border-white/10 dark:bg-white/5">
      <Icon className="h-10 w-10 text-cyan-500" />
      <h2 className="mt-6 text-2xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
    </Link>
  );
}
