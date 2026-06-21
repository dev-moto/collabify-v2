import { Bell, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "~/components/ui";

type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  unread: boolean;
};

const PLACEHOLDER_NOTIFICATIONS: Notification[] = [
  { id: "1", title: "Welcome to Collabify", message: "Complete your profile to get discovered.", time: "Just now", unread: true },
  { id: "2", title: "Verification update", message: "Business verification feature is coming soon.", time: "2h ago", unread: true },
  { id: "3", title: "Discovery is live", message: "Your profile is visible in public-safe discovery.", time: "1d ago", unread: false },
];

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications] = useState<Notification[]>(PLACEHOLDER_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications (${unreadCount} unread)`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((prev) => !prev)}
        className="relative cursor-pointer rounded-full p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:text-slate-300 dark:hover:bg-white/10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-950/10 dark:border-white/10 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm font-bold">Notifications</span>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-full p-1 text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-1 max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-slate-500">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  role="menuitem"
                  className={`w-full cursor-pointer rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-400 dark:hover:bg-white/5 ${
                    n.unread ? "bg-indigo-50/60 dark:bg-indigo-400/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold">{n.title}</span>
                    {n.unread && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-500" aria-label="Unread" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{n.message}</p>
                  <span className="mt-1 block text-[10px] text-slate-400">{n.time}</span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-slate-200 px-3 py-2 text-center dark:border-white/10">
            <span className="text-[11px] text-slate-400">Notifications are placeholder content until the system is built.</span>
          </div>
        </div>
      )}
    </div>
  );
}
