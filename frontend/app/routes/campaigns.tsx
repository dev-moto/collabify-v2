import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Loader2,
  Plus,
  Send,
  XCircle,
} from "lucide-react";
import { AppShell, Badge, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import {
  createCampaign,
  createOffer,
  listMyCampaigns,
  updateCampaignStatus,
  updateOfferStatus,
  type CampaignWithMeta,
  type Offer,
} from "~/services/campaignsService";

export function meta() { return [{ title: "Campaigns | Collabify" }]; }

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "slate" | "cyan" | "violet"> = {
  draft: "amber",
  published: "green",
  closed: "slate",
  cancelled: "red",
  pending: "violet",
  accepted: "green",
  rejected: "red",
  completed: "cyan",
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Campaigns() {
  const profile = useAppSelector((s) => s.session.profile);
  const role = profile?.role ?? "creator";

  const [campaigns, setCampaigns] = useState<CampaignWithMeta[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<"idle" | "success" | "error">("idle");
  const [createMessage, setCreateMessage] = useState("");

  // Expanded campaign for detail view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Offer creation (within expanded campaign)
  const [offerCreatorId, setOfferCreatorId] = useState("");
  const [offerTerms, setOfferTerms] = useState("");
  const [creatingOffer, setCreatingOffer] = useState(false);

  // Action loading
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setStatus("loading");
    try {
      const data = await listMyCampaigns();
      setCampaigns(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load campaigns.");
      setStatus("error");
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) {
      setCreateResult("error");
      setCreateMessage("Campaign title must be at least 2 characters.");
      return;
    }

    setCreating(true);
    setCreateResult("idle");
    try {
      await createCampaign({
        title: title.trim(),
        description: description.trim() || undefined,
        city: city.trim() || undefined,
      });
      await loadCampaigns();
      setTitle("");
      setDescription("");
      setCity("");
      setCreateResult("success");
      setCreateMessage("Campaign draft saved.");
    } catch (err) {
      setCreateResult("error");
      setCreateMessage(err instanceof Error ? err.message : "Failed to create campaign.");
    } finally {
      setCreating(false);
    }
  }

  async function handleCreateOffer(campaignId: string) {
    if (!offerCreatorId.trim()) return;
    setCreatingOffer(true);
    setActionError("");
    try {
      await createOffer({
        campaignId,
        creatorId: offerCreatorId.trim(),
        privateTerms: offerTerms.trim() || undefined,
      });
      await loadCampaigns();
      setOfferCreatorId("");
      setOfferTerms("");
      setCreatingOffer(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to create offer.");
      setCreatingOffer(false);
    }
  }

  async function handleUpdateOffer(offerId: string, newStatus: Offer["status"]) {
    setActionLoading((prev) => ({ ...prev, [offerId]: true }));
    setActionError("");
    try {
      await updateOfferStatus(offerId, newStatus);
      await loadCampaigns();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to update offer.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [offerId]: false }));
    }
  }

  const isBusiness = role === "business";

  return (
    <ProtectedRoute>
      <AppShell role={role} title="Campaigns" description={isBusiness ? "Manage your campaigns and send offers to creators." : "Browse campaigns and respond to offers from verified businesses."}>
        {actionError && (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300" role="alert">
            {actionError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
          {/* Campaign list */}
          <div className="grid gap-4">
            {status === "loading" && <StatusPanel type="loading" title="Loading campaigns" message="Please wait while we load your campaigns." />}
            {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
            {status === "success" && campaigns.length === 0 && (
              <StatusPanel type="empty" title="No campaigns yet" message={isBusiness ? "Create your first campaign draft to get started." : "No published campaigns from verified businesses yet."} />
            )}
            {status === "success" && campaigns.map((c) => (
              <Card key={c.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{c.title}</h2>
                    {!isBusiness && (
                      <p className="text-xs text-slate-500">by {c.business_id.slice(0, 8)}...</p>
                    )}
                  </div>
                  <Badge tone={STATUS_TONE[c.status] ?? "slate"}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {c.description ?? "No description"} {c.city ? `· ${c.city}` : ""} · {c.offers.length} offer{c.offers.length !== 1 ? "s" : ""}
                </p>

                {/* Offer badges */}
                {c.offers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {c.offers.map((o) => (
                      <Badge key={o.id} tone={STATUS_TONE[o.status] ?? "slate"}>
                        {o.status} · {o.creator_id.slice(0, 6)}...
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Progress bar */}
                <progress
                  className="mt-4 h-2 w-full"
                  value={c.offers.filter((o) => o.status === "completed" || o.status === "accepted").length}
                  max={Math.max(c.offers.length, 1)}
                  aria-label="Campaign progress"
                />

                {/* Action buttons */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {isBusiness && c.status === "draft" && (
                    <Button onClick={async () => {
                      setActionLoading((prev) => ({ ...prev, [`pub-${c.id}`]: true }));
                      try {
                        await updateCampaignStatus(c.id, "published");
                        await loadCampaigns();
                      } catch (err) {
                        setActionError(err instanceof Error ? err.message : "Failed to publish.");
                      } finally {
                        setActionLoading((prev) => ({ ...prev, [`pub-${c.id}`]: false }));
                      }
                    }} disabled={!!actionLoading[`pub-${c.id}`]}>
                      {actionLoading[`pub-${c.id}`] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Publish
                    </Button>
                  )}
                  {isBusiness && c.status === "published" && (
                    <Button variant="secondary" onClick={async () => {
                      setActionLoading((prev) => ({ ...prev, [`close-${c.id}`]: true }));
                      try {
                        await updateCampaignStatus(c.id, "closed");
                        await loadCampaigns();
                      } catch (err) {
                        setActionError(err instanceof Error ? err.message : "Failed to close.");
                      } finally {
                        setActionLoading((prev) => ({ ...prev, [`close-${c.id}`]: false }));
                      }
                    }}>Close</Button>
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                  >
                    <Eye className="h-4 w-4" />
                    {expandedId === c.id ? "Collapse" : "Details"}
                  </Button>
                </div>

                {/* Expanded detail view */}
                {expandedId === c.id && (
                  <div className="mt-4 border-t border-slate-200 pt-4 dark:border-white/10">
                    {/* Offers list */}
                    {c.offers.length > 0 && (
                      <div className="mb-4 grid gap-2">
                        <h3 className="text-sm font-bold">Offers</h3>
                        {c.offers.map((o) => (
                          <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/10">
                            <div className="min-w-0">
                              <p className="text-sm font-medium">
                                Creator: {o.creator_id.slice(0, 8)}...
                              </p>
                              {o.private_terms && (
                                <p className="mt-1 text-xs text-slate-500 italic">{o.private_terms}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge tone={STATUS_TONE[o.status] ?? "slate"}>
                                {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                              </Badge>
                              {/* Action buttons based on role and status */}
                              {!isBusiness && o.status === "pending" && (
                                <>
                                  <Button
                                    className="!bg-emerald-600 !text-white hover:!bg-emerald-700"
                                    disabled={!!actionLoading[o.id]}
                                    onClick={() => handleUpdateOffer(o.id, "accepted")}
                                  >
                                    {actionLoading[o.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Accept
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    className="!text-red-600"
                                    disabled={!!actionLoading[o.id]}
                                    onClick={() => handleUpdateOffer(o.id, "rejected")}
                                  >
                                    {actionLoading[o.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                    Decline
                                  </Button>
                                </>
                              )}
                              {isBusiness && o.status === "accepted" && (
                                <Button
                                  className="!bg-emerald-600 !text-white hover:!bg-emerald-700"
                                  disabled={!!actionLoading[o.id]}
                                  onClick={() => handleUpdateOffer(o.id, "completed")}
                                >
                                  {actionLoading[o.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardCheck className="h-4 w-4" />}
                                  Complete
                                </Button>
                              )}
                              {(o.status === "accepted" || o.status === "pending") && (
                                <Button
                                  variant="secondary"
                                  className="!text-red-600"
                                  disabled={!!actionLoading[o.id]}
                                  onClick={() => handleUpdateOffer(o.id, "cancelled")}
                                >
                                  {actionLoading[o.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                  Cancel
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Create offer (business only) */}
                    {isBusiness && c.status !== "closed" && c.status !== "cancelled" && (
                      <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
                        <h3 className="text-sm font-bold">Send offer to creator</h3>
                        <Field label="Creator user ID">
                          <input
                            className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                            value={offerCreatorId}
                            onChange={(e) => setOfferCreatorId(e.currentTarget.value ?? "")}
                            placeholder="Paste the creator's UUID"
                          />
                        </Field>
                        <Field label="Private terms (optional)">
                          <textarea
                            className="min-h-20 w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                            value={offerTerms}
                            onChange={(e) => setOfferTerms(e.currentTarget.value ?? "")}
                            placeholder="Budget, deliverables, timeline..."
                          />
                        </Field>
                        <Button
                          disabled={creatingOffer || !offerCreatorId.trim()}
                          onClick={() => handleCreateOffer(c.id)}
                        >
                          {creatingOffer ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          {creatingOffer ? "Sending..." : "Send offer"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Create campaign form (business only) */}
          {isBusiness && (
            <Card>
              <h2 className="text-xl font-black">Create campaign</h2>
              <form className="mt-4 grid gap-4" onSubmit={handleCreate} noValidate>
                <Field label="Campaign title">
                  <input
                    className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={title}
                    onChange={(e) => setTitle(e.currentTarget.value ?? "")}
                    required
                  />
                </Field>
                <Field label="Description">
                  <input
                    className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value ?? "")}
                    placeholder="Campaign goals and details"
                  />
                </Field>
                <Field label="City (optional)">
                  <input
                    className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={city}
                    onChange={(e) => setCity(e.currentTarget.value ?? "")}
                    placeholder="Quezon City"
                  />
                </Field>
                <Button type="submit" disabled={creating}>
                  <ClipboardCheck className="h-4 w-4" /> {creating ? "Saving..." : "Save draft"}
                </Button>
                {createResult !== "idle" && (
                  <StatusPanel type={createResult} title={createResult === "success" ? "Saved" : "Error"} message={createMessage} />
                )}
              </form>
            </Card>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
