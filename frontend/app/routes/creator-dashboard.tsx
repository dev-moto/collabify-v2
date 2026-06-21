import { useEffect, useState } from "react";
import { CalendarCheck, MessageSquareText, TrendingUp, UserRoundCheck } from "lucide-react";
import { AppShell, Badge, Card, ProtectedRoute, Stat, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import { listMyCampaigns, type CampaignWithMeta } from "~/services/campaignsService";
import { listAppointments, type Appointment } from "~/services/appointmentsService";
import { listConversations, type ConversationWithMeta } from "~/services/messagesService";

export function meta() { return [{ title: "Creator dashboard | Collabify" }]; }

export default function CreatorDashboard() {
  const sessionStatus = useAppSelector((state) => state.session.status);
  const profileStatus = useAppSelector((state) => state.session.profileStatus);
  const profile = useAppSelector((state) => state.session.profile);

  const [campaigns, setCampaigns] = useState<CampaignWithMeta[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (sessionStatus !== "authenticated" || profileStatus !== "ready" || profile?.role !== "creator") return;

    Promise.all([
      listMyCampaigns(),
      listAppointments(),
      listConversations(),
    ])
      .then(([camps, apps, convs]) => {
        setCampaigns(camps);
        setAppointments(apps);
        setConversations(convs);
        setStatus("success");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        setStatus("error");
      });
  }, [sessionStatus, profileStatus, profile?.role]);

  const unreadCount = conversations.reduce((sum, c) => sum + c.unread_count, 0);
  const upcomingCount = appointments.filter(
    (a) => a.status === "accepted" || a.status === "requested",
  ).length;

  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <AppShell role="creator" title="Creator dashboard" description="Track your profile, appointments, campaigns, and private messages in one friendly workspace.">
        {status === "loading" && <StatusPanel type="loading" title="Loading dashboard" message="Please wait while we load your data." />}
        {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
        {status === "success" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={UserRoundCheck} label="Campaigns" value={String(campaigns.length)} />
              <Stat icon={TrendingUp} label="Active offers" value={String(campaigns.reduce((s, c) => s + c.offers.length, 0))} />
              <Stat icon={CalendarCheck} label="Upcoming" value={String(upcomingCount)} />
              <Stat icon={MessageSquareText} label="Conversations" value={String(conversations.length)} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <Card className="min-w-0 lg:col-span-2">
                <h2 className="text-xl font-black">Campaign updates</h2>
                {campaigns.length === 0 ? (
                  <StatusPanel type="empty" title="No campaigns" message="Campaign invitations will appear here." />
                ) : (
                  <div className="mt-4 grid gap-3">
                    {campaigns.slice(0, 5).map((c) => (
                      <article key={c.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="min-w-0 font-bold">{c.title}</h3>
                          <Badge tone={c.status === "published" ? "green" : "amber"}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                          {c.description ?? "No description"} · {c.offers.length} offer{c.offers.length !== 1 ? "s" : ""}
                        </p>
                        <progress className="mt-3 h-2 w-full" value={c.offers.filter((o) => o.status === "completed" || o.status === "accepted").length} max={Math.max(c.offers.length, 1)} aria-label={`${c.title} progress`} />
                      </article>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="text-xl font-black">Next appointments</h2>
                {appointments.length === 0 ? (
                  <StatusPanel type="empty" title="No appointments" message="Accepted meetings will show here." />
                ) : (
                  <div className="mt-4 grid gap-3">
                    {appointments.slice(0, 5).map((a) => (
                      <p key={a.id} className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-white/10">
                        <b>{a.scheduled_for ? new Date(a.scheduled_for).toLocaleDateString() : "TBD"}</b>
                        <br />
                        <Badge tone={a.status === "accepted" ? "green" : a.status === "requested" ? "amber" : "slate"}>
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </Badge>
                      </p>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="lg:col-span-3">
                <h2 className="text-xl font-black">Recent messages</h2>
                {conversations.length === 0 ? (
                  <StatusPanel type="empty" title="No messages" message="Messages from businesses will appear here." />
                ) : (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {conversations.slice(0, 6).map((m) => (
                      <article key={m.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                        <Badge tone="cyan">Participant-only</Badge>
                        <h3 className="mt-3 font-bold truncate">Conversation {m.id.slice(0, 8)}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300">{m.last_message ?? "No messages yet"}</p>
                      </article>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
