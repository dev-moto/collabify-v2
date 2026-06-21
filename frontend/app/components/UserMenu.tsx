import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { LogOut, Settings, ChevronDown, CreditCard } from "lucide-react";
import { useAppSelector } from "~/store/hooks";
import { signOut } from "~/services/authService";

export function UserMenu() {
  const navigate = useNavigate();
  const profile = useAppSelector((state) => state.session.profile);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/");
    } catch {
      setSigningOut(false);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`User menu for ${profile?.display_name ?? "user"}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        className="flex cursor-pointer items-center gap-2 rounded-full p-1 pr-3 text-sm font-bold text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-slate-200 dark:hover:bg-white/10"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-xs font-bold text-white">
          {initials}
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate">{profile?.display_name}</span>
        <ChevronDown className={`hidden h-4 w-4 text-slate-400 transition sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="User options"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900"
        >
          <div className="border-b border-slate-200 px-3 py-2 dark:border-white/10">
            <p className="text-sm font-bold">{profile?.display_name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile?.role ?? "user"}</p>
          </div>

          {(profile?.role === "creator" || profile?.role === "business") && (
            <Link
              to="/billing"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 dark:text-slate-200 dark:hover:bg-white/5"
            >
              <CreditCard className="h-4 w-4 text-slate-400" />
              Billing
            </Link>
          )}
          <Link
            to="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 dark:text-slate-200 dark:hover:bg-white/5"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            Settings
          </Link>

          <div className="border-t border-slate-200 pt-1 dark:border-white/10">
            <button
              type="button"
              role="menuitem"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-400 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-400/10"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
