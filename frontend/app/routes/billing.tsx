import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Loader2, XCircle } from "lucide-react";
import { AppShell, Badge, Button, Card, ProtectedRoute, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import {
  listPlans,
  getMySubscription,
  subscribeToPlan,
  cancelSubscription,
  type Plan,
  type Subscription,
} from "~/services/billingService";

export function meta() { return [{ title: "Billing | Collabify" }]; }

export default function Billing() {
  const profile = useAppSelector((state) => state.session.profile);
  const role = profile?.role === "business" ? "business" : "creator";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setStatus("loading");
    try {
      const [activePlans, mySub] = await Promise.all([
        listPlans(),
        getMySubscription(),
      ]);
      // Filter plans by role
      const rolePrefix = role === "creator" ? "starter_creator" : "starter_business";
      const filtered = activePlans.filter(
        (p) => p.id.startsWith(rolePrefix.split("_").slice(0, -1).join("_")) || p.id === "enterprise",
      );
      setPlans(filtered);
      setSubscription(mySub);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing data.");
      setStatus("error");
    }
  }

  async function handleSubscribe(planId: string) {
    setActionLoading(planId);
    setActionError("");
    try {
      await subscribeToPlan(planId);
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to subscribe.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCancel() {
    setActionLoading("cancel");
    setActionError("");
    try {
      await cancelSubscription();
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to cancel.");
    } finally {
      setActionLoading(null);
    }
  }

  const currentPlanId = subscription?.plan_id;
  const isSubscribed = subscription?.status === "active" || subscription?.status === "trialing";

  return (
    <ProtectedRoute>
      <AppShell role={role} title="Billing & plans" description="Manage your subscription plan and view available features.">
        {actionError && (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300" role="alert">
            {actionError}
          </div>
        )}

        {status === "loading" && <StatusPanel type="loading" title="Loading plans" message="Please wait while we load available plans." />}
        {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}

        {/* Current subscription status */}
        {status === "success" && (
          <>
            {subscription && (
              <Card className="mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">Current plan</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      {plans.find((p) => p.id === currentPlanId)?.name ?? subscription.plan_id ?? "No plan"} ·{" "}
                      <Badge tone={isSubscribed ? "green" : "slate"}>
                        {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                      </Badge>
                    </p>
                    {subscription.current_period_end && (
                      <p className="mt-1 text-xs text-slate-500">
                        Current period ends: {new Date(subscription.current_period_end).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {isSubscribed && (
                    <Button
                      variant="secondary"
                      className="!text-red-600"
                      disabled={actionLoading === "cancel"}
                      onClick={handleCancel}
                    >
                      {actionLoading === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Cancel subscription
                    </Button>
                  )}
                </div>
              </Card>
            )}

            {/* Plans grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {plans.map((plan) => {
                const isCurrent = currentPlanId === plan.id;
                const features: string[] = plan.metadata?.features ?? [];

                return (
                  <Card key={plan.id} className={isCurrent ? "ring-2 ring-cyan-500" : ""}>
                    {isCurrent && <Badge tone="cyan">Current</Badge>}
                    <h2 className={`mt-4 text-2xl font-black ${isCurrent ? "text-cyan-700 dark:text-cyan-300" : ""}`}>
                      {plan.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {plan.id.includes("pro") ? "Paid plan — advanced features" : plan.id === "enterprise" ? "Custom plan for teams" : "Free — core features included"}
                    </p>

                    <ul className="mt-6 space-y-3">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span className="capitalize">{f.replace(/_/g, " ")}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      {isCurrent ? (
                        <Button variant="secondary" disabled>
                          <CheckCircle2 className="h-4 w-4" /> Current plan
                        </Button>
                      ) : (
                        <Button
                          disabled={actionLoading === plan.id}
                          onClick={() => handleSubscribe(plan.id)}
                        >
                          {actionLoading === plan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4" />
                          )}
                          {plan.id === "enterprise" ? "Contact sales" : plan.id.includes("pro") ? "Upgrade" : "Subscribe"}
                        </Button>
                      )}
                    </div>

                    {plan.id.includes("starter") && (
                      <p className="mt-4 text-xs text-slate-400">
                        Payment not required during MVP — subscribe to activate features.
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
