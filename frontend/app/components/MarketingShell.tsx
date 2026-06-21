import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState, type MouseEvent, type ReactNode } from "react";

import { BrandLogo } from "./BrandLogo";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { label: "Creators", id: "for-creators" },
  { label: "Businesses", id: "for-businesses" },
  { label: "Features", id: "features" },
  { label: "Trust", id: "trust" },
];

export function MarketingHeader() {
  const [activeSection, setActiveSection] = useState("top");

  useEffect(() => {
    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    const onScroll = () => {
      let current: HTMLElement | undefined;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= 140) current = section;
      }
      setActiveSection(current?.id ?? "top");
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function scrollToSection(event: MouseEvent<HTMLAnchorElement>, sectionId: string) {
    const target = document.getElementById(sectionId);
    if (!target) return;

    event.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${sectionId}`);
    setActiveSection(sectionId);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 shadow-sm shadow-slate-950/5 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:shadow-none">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8" aria-label="Main navigation">
        <div className="shrink-0">
          <BrandLogo />
        </div>

        <div className="hidden items-center rounded-full border border-slate-200 bg-white/75 p-1 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur md:flex dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`/#${item.id}`}
                onClick={(event) => scrollToSection(event, item.id)}
                aria-current={isActive ? "page" : undefined}
                className={`cursor-pointer rounded-full px-4 py-2 transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"
                    : "hover:bg-slate-100 hover:text-slate-950 dark:hover:bg-white/10 dark:hover:text-white"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link to="/login" className="hidden cursor-pointer rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:inline-flex dark:text-slate-200 dark:hover:bg-white/10">
            Log in
          </Link>
          <Link to="/signup" className="cursor-pointer rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200">
            Get started
          </Link>
        </div>
      </nav>
      <nav aria-label="Landing page sections" className="flex gap-2 overflow-x-auto px-4 pb-3 md:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <a
              key={item.id}
              href={`/#${item.id}`}
              onClick={(event) => scrollToSection(event, item.id)}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 cursor-pointer rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                isActive
                  ? "border-transparent bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/20"
                  : "border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              }`}
            >
              {item.label}
            </a>
          );
        })}
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
