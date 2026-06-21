import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

function getPreferredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem("collabify-theme");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("collabify-theme", theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const preferred = getPreferredTheme();
    setTheme(preferred);
    applyTheme(preferred);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => {
        setTheme(nextTheme);
        applyTheme(nextTheme);
        setIsAnimating(true);
        window.setTimeout(() => setIsAnimating(false), 540);
      }}
      className={`group relative inline-flex h-10 w-16 cursor-pointer items-center rounded-full border border-slate-200 bg-white p-1 text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/10 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:border-white/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 ${isAnimating ? "theme-toggle-pop" : ""}`}
    >
      {isAnimating && (
        <span className="theme-toggle-orbit pointer-events-none absolute inset-0 rounded-full border border-cyan-300/60 dark:border-violet-300/50" />
      )}
      <span className="absolute left-2 text-amber-500 transition-opacity duration-300 dark:opacity-45">
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className="absolute right-2 text-violet-500 opacity-45 transition-opacity duration-300 dark:opacity-100 dark:text-cyan-200">
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span
        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all duration-500 ease-out ${
          theme === "dark"
            ? "translate-x-6 rotate-[360deg] bg-slate-950 text-cyan-200 shadow-violet-950/40"
            : "translate-x-0 rotate-0 bg-gradient-to-br from-amber-300 to-orange-400 text-white shadow-amber-500/30"
        }`}
      >
        {theme === "dark" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
      </span>
    </button>
  );
}
