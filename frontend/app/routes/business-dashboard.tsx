import { useEffect, useState, useCallback } from "react";
import { CalendarCheck, Megaphone, Search, ShieldCheck } from "lucide-react";
import { AppShell, Badge, Card, ProtectedRoute, Stat, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import { BusinessVerification } from "~/components/BusinessVerification";
import { listMyCampaigns, type CampaignWithMeta } from "~/services/campaignsService";
import { listAppointments, type Appointment } from "~/services/appointmentsService";
import type { VerificationStatus } from "~/services/verificationService";

export function meta() { return [{ title: "Business dashboard | Collabify" }]; }

export default function BusinessDashboard() {
  const sessionStatus = useAppSelector((state) => state.session.status);
  const profileStatus = useAppSelector((state) => state.session.profileStatus);
  const profile = useAppSelector((state) => state.session.profile);

  const [campaigns, setCampaigns] = useState<CampaignWithMeta[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  // Track verification to show it in the stat bar
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>("unsubmitted");

  const handleVerificationChange = useCallback((v: VerificationStatus) => {
    setVerificationStatus(v);
  }, []);

  useEffect(() => {
    if (sessionStatus !== "authenticated" || profileStatus !== "ready" || profile?.role !== "business") return;

    Promise.all([
      listMyCampaigns(),
      listAppointments(),
    ])
      .then(([camps, apps]) => {
        setCampaigns(camps);
        setAppointments(apps);
        setStatus("success");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        setStatus("error");
      });
  }, [sessionStatus, profileStatus, profile?.role]);

  const activeCampaigns = campaigns.filter((c) => c.status !== "cancelled" && c.status !== "closed");
  const upcomingCount = appointments.filter(
    (a) => a.status === "accepted" || a.status === "requested",
  ).length;

  const verLabel =
    verificationStatus === "approved"
      ? "Verified"
      : verificationStatus === "pending"
        ? "Pending"
        : verificationStatus === "rejected"
          ? "Rejected"
          : "Unverified";
  const verTone = verificationStatus === "approved" ? "green" : verificationStatus === "pending" ? "amber" : verificationStatus === "rejected" ? "red" : "slate";

  return (
    <ProtectedRoute allowedRoles={["business"]}>
      <AppShell role="business" title="Business dashboard" description="Discover public creator cards, manage campaign offers, and monitor verification status.">
        {status === "loading" && <StatusPanel type="loading" title="Loading dashboard" message="Please wait while we load your data." />}
        {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
        {status === "success" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Stat icon={ShieldCheck} label={verLabel} value={verificationStatus === "approved" ? "Yes" : "No"} />
              <Stat icon={Search} label="Offers received" value={String(campaigns.reduce((s, c) => s + c.offers.length, 0))} />
              <Stat icon={Megaphone} label="Active" value={String(activeCampaigns.length)} />
              <Stat icon={CalendarCheck} label="Meetings" value={String(upcomingCount)} />
            </div>

            {/* Full-width verification section */}
            <div className="mt-6">
              <BusinessVerification onStatusChange={handleVerificationChange} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
              <Card className="min-w-0">
                <h2 className="text-xl font-black">Campaigns</h2>
                {campaigns.length === 0 ? (
                  <StatusPanel type="empty" title="No campaigns" message="Create your first campaign from the Campaigns page." />
                ) : (
                  <div className="mt-4 grid gap-3">
                    {campaigns.map((c) => (
                      <article key={c.id} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <h3 className="font-bold">{c.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                              {c.description ?? "No description"} · {c.offers.length} offer{c.offers.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <Badge tone={c.status === "published" ? "green" : c.status === "draft" ? "amber" : "slate"}>
                            {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                          </Badge>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h2 className="text-xl font-black">Campaign health</h2>
                {campaigns.length === 0 ? (
                  <StatusPanel type="empty" title="No data" message="Campaign metrics will appear here." />
                ) : (
                  campaigns.slice(0, 5).map((c) => (
                    <div key={c.id} className="mt-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                      <Badge tone={c.status === "published" ? "green" : c.status === "draft" ? "amber" : "slate"}>
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </Badge>
                      <h3 className="mt-2 font-bold">{c.title}</h3>
                      <progress className="mt-3 h-2 w-full" value={c.offers.filter((o) => o.status === "completed" || o.status === "accepted").length} max={Math.max(c.offers.length, 1)} />
                    </div>
                  ))
                )}
              </Card>
            </div>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
