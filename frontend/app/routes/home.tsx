import type { Route } from "./+types/home";
import { Link } from "react-router";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Globe2,
  MapPin,
  MessageSquareText,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

import { MarketingShell } from "~/components/MarketingShell";
import { useAppSelector } from "~/store/hooks";
import { profileHomePath } from "~/services/profileService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Collabify | Trusted creator collaborations in the Philippines" },
    {
      name: "description",
      content:
        "Collabify helps Philippines-based creators and verified businesses discover, message, schedule, and launch trusted collaborations.",
    },
  ];
}

const features = [
  {
    icon: Search,
    title: "City-based discovery",
    description: "Find creators and businesses by public-safe city signals, never exact location data.",
  },
  {
    icon: ShieldCheck,
    title: "Verified business outreach",
    description: "Businesses must be approved before outreach or campaign publishing.",
  },
  {
    icon: MessageSquareText,
    title: "Text and link messaging",
    description: "Participant-only conversations keep private deal details protected by RLS.",
  },
  {
    icon: CalendarCheck,
    title: "Appointments",
    description: "Request, reschedule, accept, or decline collaboration meetings in one place.",
  },
];

const stats = [
  { label: "RLS checks passing", value: "23" },
  { label: "Public-safe views", value: "3" },
  { label: "MVP workflows", value: "8+" },
];

const audienceCards = [
  {
    id: "for-creators",
    icon: UserRoundCheck,
    label: "For creators",
    title: "Turn your content into trusted collaborations.",
    description: "Build a public-safe profile, showcase niches and social proof, discover campaigns, and keep deal details private.",
    bullets: ["Creator profile and portfolio", "City-level discovery", "Participant-only messages"],
  },
  {
    id: "for-businesses",
    icon: Building2,
    label: "For businesses",
    title: "Find local creators after verification.",
    description: "Submit verification, discover relevant creators by city, publish campaigns, and manage x-deals or paid offers.",
    bullets: ["Verification-first outreach", "Campaign and x-deal workflows", "Appointments and offer tracking"],
  },
];

const steps = [
  "Create your creator or business profile.",
  "Businesses submit verification before outreach.",
  "Discover by city and start participant-only conversations.",
  "Manage offers, appointments, and campaign updates securely.",
];

export default function Home() {
  const status = useAppSelector((state) => state.session.status);
  const profile = useAppSelector((state) => state.session.profile);
  const isAuthed = status === "authenticated";
  const needsOnboarding = isAuthed && !profile;
  const homePath = needsOnboarding ? "/onboarding" : isAuthed ? profileHomePath(profile) : "/signup";
  const dashboardLabel = profile?.role === "business" ? "Business dashboard" : "Creator dashboard";

  return (
    <MarketingShell>
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,_rgba(236,254,255,0.9),_rgba(248,250,252,0.92)_45%,_rgba(255,255,255,1)),radial-gradient(circle_at_top_left,_rgba(6,182,212,0.24),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.22),_transparent_34%)] dark:bg-[linear-gradient(180deg,_rgba(15,23,42,1),_rgba(2,6,23,0.96)_55%,_rgba(2,6,23,1)),radial-gradient(circle_at_top_left,_rgba(6,182,212,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(124,58,237,0.22),_transparent_34%)]" />
          <div className="mx-auto grid max-w-7xl gap-14 px-6 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:py-28">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 dark:border-cyan-400/20 dark:bg-cyan-400/10 dark:text-cyan-200">
                <Sparkles className="h-4 w-4" /> Philippines-first creator marketplace
              </div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl dark:text-white">
                Trusted creator collaborations, from discovery to deal done.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
                Collabify helps Filipino creators and verified businesses find the right partners, coordinate campaigns, schedule appointments, and protect private collaboration details with Supabase-backed access controls.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                {isAuthed ? (
                  needsOnboarding ? (
                    <Link to="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-500/20 hover:scale-[1.01]">
                      Complete onboarding <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link to={homePath} className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-500/20 hover:scale-[1.01]">
                      Go to {dashboardLabel} <ArrowRight className="h-4 w-4" />
                    </Link>
                  )
                ) : (
                  <>
                    <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-cyan-500/20 hover:scale-[1.01]">
                      Start collaborating <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link to="/login" className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-800 hover:bg-slate-100 dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15">
                      I already have an account
                    </Link>
                  </>
                )}
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
                    <p className="text-2xl font-black text-slate-950 dark:text-white">{stat.value}</p>
                    <p className="mt-1 text-xs font-medium leading-5 text-slate-500 dark:text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-10 hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-950/10 lg:block dark:border-white/10 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300"><ShieldCheck className="h-5 w-5" /></div>
                  <div>
                    <p className="text-sm font-black">Business verified</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Outreach unlocked</p>
                  </div>
                </div>
              </div>
              <div className="rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-white/10">
                <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white ring-1 ring-white/10">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm text-cyan-200">Live collaboration workspace</p>
                      <h2 className="mt-1 text-2xl font-bold">Cebu food launch</h2>
                      <p className="mt-2 text-sm text-slate-400">Paid + meal x-deal · public-safe discovery</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-200">Verified</span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MetricCard icon={UserRoundCheck} label="Matched creators" value="24" />
                    <MetricCard icon={MapPin} label="City" value="Cebu" />
                    <MetricCard icon={MessageSquareText} label="Private threads" value="8" />
                    <MetricCard icon={CalendarCheck} label="Appointments" value="5" />
                  </div>
                  <div className="mt-6 rounded-2xl bg-white/10 p-4">
                    <div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-cyan-200" /><p className="text-sm font-semibold text-white">Latest secure update</p></div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Creator accepted the briefing appointment. Campaign notes remain visible to participants only.</p>
                  </div>
                  <div className="mt-4 grid gap-3 rounded-2xl bg-white/5 p-4">
                    {["Shortlist 24 creators", "Send participant-only offer", "Track deliverables"].map((item) => (
                      <div key={item} className="flex items-center gap-3 text-sm text-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Verification before outreach", copy: "Businesses must be approved before publishing campaigns or starting outreach." },
              { icon: Globe2, title: "City-level discovery", copy: "Public results use safe fields and never expose exact coordinates." },
              { icon: ClipboardCheck, title: "Deal workflows", copy: "Campaigns, appointments, offers, and messages are structured for clarity." },
            ].map((item) => (
              <article key={item.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <item.icon className="h-7 w-7 text-cyan-500" />
                <h2 className="mt-4 font-black">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-6 py-16 lg:grid-cols-2 lg:px-8">
          {audienceCards.map((card) => (
            <article id={card.id} key={card.id} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-violet-600 text-white"><card.icon className="h-6 w-6" /></div>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">{card.label}</p>
                <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{card.title}</h2>
              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">{card.description}</p>
              <ul className="mt-6 grid gap-3">
                {card.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {bullet}</li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">MVP features</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Everything needed for safe first collaborations.</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article key={feature.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
                <feature.icon className="h-8 w-8 text-cyan-500" />
                <h3 className="mt-5 text-lg font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="trust" className="bg-slate-950 py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-3 lg:px-8">
            <div className="lg:col-span-1">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">Trust baseline</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight">Privacy and verification before scale.</h2>
            </div>
            <div className="grid gap-4 lg:col-span-2 sm:grid-cols-2">
              {[
                "Business verification gates outreach and published campaigns.",
                "Public profile cards expose safe fields only.",
                "Frontend guards are UX; Supabase RLS enforces access.",
                "Messaging supports text and links only for the MVP.",
              ].map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-white/10 p-5">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                  <p className="text-sm leading-6 text-slate-200">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5 md:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">Professional workflows</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Built for real brand conversations, not random DMs.</h2>
                <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">Collabify gives creators and businesses shared structure for discovery, offers, appointments, campaign status, and private messaging.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: PlayCircle, title: "Campaign briefs", copy: "Keep deliverables, notes, and x-deal details understandable." },
                  { icon: UsersRound, title: "Participant access", copy: "Only involved users should see private conversation details." },
                  { icon: Star, title: "Creator showcase", copy: "Highlight niches, stats, portfolio, and availability clearly." },
                  { icon: CalendarCheck, title: "Appointment flow", copy: "Plan briefings, content reviews, and collaboration calls." },
                ].map((item) => (
                  <div key={item.title} className="rounded-3xl bg-slate-50 p-5 dark:bg-white/10">
                    <item.icon className="h-6 w-6 text-cyan-500" />
                    <h3 className="mt-4 font-black">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">How it works</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Simple workflows for creators and local businesses.</h2>
            </div>
            <ol className="grid gap-4">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 font-black text-cyan-700 dark:bg-cyan-400/10 dark:text-cyan-200">{index + 1}</span>
                  <p className="self-center font-semibold text-slate-700 dark:text-slate-200">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-500 to-violet-600 p-8 text-white shadow-2xl shadow-cyan-500/20 md:p-12">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Building2 className="h-10 w-10" />
                <h2 className="mt-4 text-3xl font-black tracking-tight">Ready to build trusted collaborations?</h2>
                <p className="mt-3 max-w-2xl text-cyan-50">Create your account, complete onboarding, and help shape the Collabify MVP.</p>
              </div>
              {isAuthed ? (
                needsOnboarding ? (
                  <Link to="/onboarding" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">
                    Complete onboarding <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link to={homePath} className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">
                    Go to {dashboardLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                )
              ) : (
                <Link to="/signup" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 hover:bg-slate-100">
                  Join Collabify <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </MarketingShell>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <Icon className="h-5 w-5 text-cyan-200" />
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="text-xs font-medium text-slate-300">{label}</p>
    </div>
  );
}
