import { useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { AppShell, Badge, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { listMyCampaigns, createCampaign, type CampaignWithMeta } from "~/services/campaignsService";

export function meta() { return [{ title: "Campaigns and x-deals | Collabify" }]; }

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<CampaignWithMeta[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<"idle" | "success" | "error">("idle");
  const [createMessage, setCreateMessage] = useState("");

  useEffect(() => {
    listMyCampaigns()
      .then((data) => {
        setCampaigns(data);
        setStatus("success");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load campaigns.");
        setStatus("error");
      });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) {
      setCreateResult("error");
      setCreateMessage("Campaign title must be at least 2 characters.");
      return;
    }

    setCreating(true);
    setCreateResult("idle");
    try {
      const campaign = await createCampaign({ title: title.trim(), description: description.trim() || undefined, city: city.trim() || undefined });
      setCampaigns((prev) => [{ ...campaign, offers: [] }, ...prev]);
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

  return (
    <ProtectedRoute>
      <AppShell title="Campaigns and x-deals" description="Manage offers, deliverables, x-deal details, notes, and campaign progress.">
        <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <div className="grid gap-4">
            {status === "loading" && <StatusPanel type="loading" title="Loading campaigns" message="Please wait while we load your campaigns." />}
            {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
            {status === "success" && campaigns.length === 0 && (
              <StatusPanel type="empty" title="No campaigns yet" message="Create your first campaign draft to get started." />
            )}
            {status === "success" && campaigns.map((c) => (
              <Card key={c.id}>
                <div className="flex flex-wrap justify-between gap-3">
                  <h2 className="text-xl font-black">{c.title}</h2>
                  <Badge tone={c.status === "published" ? "green" : c.status === "draft" ? "amber" : c.status === "closed" ? "slate" : "red"}>
                    {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {c.description ?? "No description"} {c.city ? `· ${c.city}` : ""} · {c.offers.length} offer{c.offers.length !== 1 ? "s" : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {c.offers.map((o) => (
                    <Badge key={o.id} tone={o.status === "accepted" ? "green" : o.status === "pending" ? "violet" : o.status === "completed" ? "cyan" : "slate"}>
                      {o.status}
                    </Badge>
                  ))}
                </div>
                <progress className="mt-4 h-2 w-full" value={c.offers.filter((o) => o.status === "completed" || o.status === "accepted").length} max={Math.max(c.offers.length, 1)} aria-label="Campaign progress" />
              </Card>
            ))}
          </div>

          <Card>
            <h2 className="text-xl font-black">Create offer draft</h2>
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
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
