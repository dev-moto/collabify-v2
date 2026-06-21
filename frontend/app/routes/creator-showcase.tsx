import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  Briefcase,
  ExternalLink,
  Globe,
  Image,
  Loader2,
  MessageCircle,
  Music2,
  Plus,
  Save,
  Trash2,
  Video,
} from "lucide-react";
import { AppShell, Badge, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import {
  getMyCreatorProfile,
  updateMyCreatorProfile,
  listSocialAccounts,
  addSocialAccount,
  deleteSocialAccount,
  listStatsSnapshots,
  addStatsSnapshot,
  deleteStatsSnapshot,
  listPortfolioMedia,
  uploadPortfolioMedia,
  deletePortfolioMedia,
  getPortfolioMediaUrl,
  type CreatorProfile,
  type CreatorProfileUpdate,
  type SocialAccount,
  type SocialAccountInput,
  type StatsSnapshot,
  type StatsSnapshotInput,
  type PortfolioMedia,
  type AvailabilityStatus,
} from "~/services/creatorProfileService";

export function meta() {
  return [{ title: "Creator showcase | Collabify" }];
}

/* ------------------------------------------------------------------ */
/*  Platform icon helper                                                */
/* ------------------------------------------------------------------ */

function PlatformIcon({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  if (p.includes("instagram")) return <Image className="h-4 w-4" />;
  if (p.includes("twitter") || p.includes("x")) return <MessageCircle className="h-4 w-4" />;
  if (p.includes("youtube") || p.includes("vimeo")) return <Video className="h-4 w-4" />;
  if (p.includes("tiktok")) return <Music2 className="h-4 w-4" />;
  if (p.includes("linkedin")) return <Briefcase className="h-4 w-4" />;
  if (p.includes("twitch")) return <ExternalLink className="h-4 w-4" />;
  return <Globe className="h-4 w-4" />;
}

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function CreatorShowcase() {
  const sessionStatus = useAppSelector((s) => s.session.status);
  const profileStatus = useAppSelector((s) => s.session.profileStatus);
  const profile = useAppSelector((s) => s.session.profile);

  /* --- Profile state --- */
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [bio, setBio] = useState("");
  const [nichesStr, setNichesStr] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [city, setCity] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [availability, setAvailability] = useState<AvailabilityStatus | "">("");
  const [rateCard, setRateCard] = useState("");
  const [profileLoadStatus, setProfileLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [profileError, setProfileError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveResult, setProfileSaveResult] = useState<"idle" | "success" | "error">("idle");
  const [profileSaveMessage, setProfileSaveMessage] = useState("");

  /* --- Social accounts state --- */
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [socialLoadStatus, setSocialLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [showAddSocial, setShowAddSocial] = useState(false);
  const [newSocial, setNewSocial] = useState<SocialAccountInput>({ platform: "", handle: "", url: "" });
  const [savingSocial, setSavingSocial] = useState(false);

  /* --- Stats state --- */
  const [stats, setStats] = useState<StatsSnapshot[]>([]);
  const [statsLoadStatus, setStatsLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [showAddStats, setShowAddStats] = useState(false);
  const [newStats, setNewStats] = useState<StatsSnapshotInput>({ platform: "", follower_count: undefined, engagement_rate: undefined, average_views: undefined });
  const [savingStats, setSavingStats] = useState(false);

  /* --- Portfolio state --- */
  const [portfolio, setPortfolio] = useState<PortfolioMedia[]>([]);
  const [portfolioLoadStatus, setPortfolioLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileCaption, setFileCaption] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------------------------------------------------------------- */
  /*  Load all data                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (sessionStatus !== "authenticated" || profileStatus !== "ready" || profile?.role !== "creator") return;

    const load = async () => {
      setProfileLoadStatus("loading");
      try {
        const cp = await getMyCreatorProfile();
        if (cp) {
          setCreatorProfile(cp);
          setBio(cp.bio ?? "");
          setNichesStr(cp.niches.join(", "));
          setPublicEmail(cp.public_email ?? "");
          setCity(cp.city ?? "");
          setIsDiscoverable(cp.is_discoverable);
          setAvailability((cp.availability_status as AvailabilityStatus | "") ?? "");
          setRateCard(cp.rate_card ?? "");
        }
        setProfileLoadStatus("success");
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : "Failed to load profile.");
        setProfileLoadStatus("error");
      }
    };

    load();
    loadSocial();
    loadStats();
    loadPortfolio();
  }, [sessionStatus, profileStatus, profile?.role]);

  async function loadSocial() {
    setSocialLoadStatus("loading");
    try {
      const accounts = await listSocialAccounts();
      setSocialAccounts(accounts);
      setSocialLoadStatus("success");
    } catch {
      setSocialLoadStatus("error");
    }
  }

  async function loadStats() {
    setStatsLoadStatus("loading");
    try {
      const snapshots = await listStatsSnapshots();
      setStats(snapshots);
      setStatsLoadStatus("success");
    } catch {
      setStatsLoadStatus("error");
    }
  }

  async function loadPortfolio() {
    setPortfolioLoadStatus("loading");
    try {
      const items = await listPortfolioMedia();
      setPortfolio(items);
      setPortfolioLoadStatus("success");
    } catch {
      setPortfolioLoadStatus("error");
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Profile save                                                      */
  /* ---------------------------------------------------------------- */

  async function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSaveResult("idle");

    try {
      const niches = nichesStr
        .split(",")
        .map((n) => n.trim().toLowerCase())
        .filter(Boolean);

      const input: CreatorProfileUpdate = {
        bio: bio.trim() || null,
        niches,
        public_email: publicEmail.trim() || null,
        city: city.trim() || null,
        is_discoverable: isDiscoverable,
        availability_status: (availability as AvailabilityStatus) || null,
        rate_card: rateCard.trim() || null,
      };

      const updated = await updateMyCreatorProfile(input);
      setCreatorProfile(updated);
      setProfileSaveResult("success");
      setProfileSaveMessage("Showcase saved.");
    } catch (err) {
      setProfileSaveResult("error");
      setProfileSaveMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSavingProfile(false);
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Social account handlers                                            */
  /* ---------------------------------------------------------------- */

  async function handleAddSocial(e: FormEvent) {
    e.preventDefault();
    setSavingSocial(true);
    try {
      await addSocialAccount(newSocial);
      setNewSocial({ platform: "", handle: "", url: "" });
      setShowAddSocial(false);
      await loadSocial();
    } catch {
      // Silently fail — user can retry
    } finally {
      setSavingSocial(false);
    }
  }

  async function handleDeleteSocial(id: string) {
    try {
      await deleteSocialAccount(id);
      await loadSocial();
    } catch {
      // Silently fail
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Stats handlers                                                     */
  /* ---------------------------------------------------------------- */

  async function handleAddStats(e: FormEvent) {
    e.preventDefault();
    setSavingStats(true);
    try {
      await addStatsSnapshot(newStats);
      setNewStats({ platform: "", follower_count: undefined, engagement_rate: undefined, average_views: undefined });
      setShowAddStats(false);
      await loadStats();
    } catch {
      // Silently fail
    } finally {
      setSavingStats(false);
    }
  }

  async function handleDeleteStats(id: string) {
    try {
      await deleteStatsSnapshot(id);
      await loadStats();
    } catch {
      // Silently fail
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Portfolio handlers                                                 */
  /* ---------------------------------------------------------------- */

  async function handleUploadPortfolio() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      await uploadPortfolioMedia(file, fileCaption || undefined);
      setFileCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadPortfolio();
    } catch {
      // Silently fail
    } finally {
      setUploadingFile(false);
    }
  }

  async function handleDeletePortfolio(id: string) {
    try {
      await deletePortfolioMedia(id);
      await loadPortfolio();
    } catch {
      // Silently fail
    }
  }

  /* ---------------------------------------------------------------- */
  /*  Render                                                             */
  /* ---------------------------------------------------------------- */

  return (
    <ProtectedRoute allowedRoles={["creator"]}>
      <AppShell
        role="creator"
        title="Creator showcase"
        description="Manage your public-safe creator profile, social links, stats, and portfolio."
      >
        <div className="grid gap-8">
          {/* ============================================================ */}
          {/*  Basic info                                                     */}
          {/* ============================================================ */}
          <Card>
            <h2 className="text-xl font-black">Showcase info</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              These fields appear on your public profile card.
            </p>

            {profileLoadStatus === "loading" && <StatusPanel type="loading" title="Loading" message="Fetching your profile..." />}
            {profileLoadStatus === "error" && <StatusPanel type="error" title="Error" message={profileError} />}

            {profileLoadStatus === "success" && (
              <form className="mt-4 grid gap-5 md:grid-cols-2" onSubmit={handleSaveProfile} noValidate>
                <div className="md:col-span-2">
                <Field label="Bio">
                  <textarea
                    className="min-h-[100px] w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={bio}
                    onChange={(e) => setBio(e.currentTarget.value ?? "")}
                    placeholder="Tell brands about yourself..."
                  />
                </Field>
                </div>

                <Field label="Niches (comma-separated)">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={nichesStr}
                    onChange={(e) => setNichesStr(e.currentTarget.value ?? "")}
                    placeholder="food, travel, lifestyle"
                  />
                </Field>

                <Field label="Public email">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    type="email"
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.currentTarget.value ?? "")}
                    placeholder="creator@example.com"
                  />
                </Field>

                <Field label="City">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={city}
                    onChange={(e) => setCity(e.currentTarget.value ?? "")}
                    placeholder="Quezon City"
                  />
                </Field>

                <Field label="Availability status">
                  <select
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={availability}
                    onChange={(e) => setAvailability(e.currentTarget.value as AvailabilityStatus | "")}
                  >
                    <option value="">Not set</option>
                    <option value="available">Available for collab</option>
                    <option value="selective">Selective — reviewing offers</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </Field>

                <Field label="Rate card / pricing notes">
                  <textarea
                    className="min-h-[80px] w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={rateCard}
                    onChange={(e) => setRateCard(e.currentTarget.value ?? "")}
                    placeholder="Free-text rate card or pricing notes..."
                  />
                </Field>

                <label className="flex items-center gap-3 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={isDiscoverable}
                    onChange={(e) => setIsDiscoverable(e.currentTarget.checked)}
                    className="h-5 w-5 rounded"
                  />
                  Show in discovery results
                </label>

                <div className="md:col-span-2">
                  <Button type="submit" disabled={savingProfile}>
                    {savingProfile ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Save className="h-4 w-4" /> Save showcase</>}
                  </Button>
                  {profileSaveResult !== "idle" && (
                    <div className="mt-3">
                      <StatusPanel type={profileSaveResult} title={profileSaveResult === "success" ? "Saved" : "Error"} message={profileSaveMessage} />
                    </div>
                  )}
                </div>
              </form>
            )}
          </Card>

          {/* ============================================================ */}
          {/*  Social accounts                                                */}
          {/* ============================================================ */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Social accounts</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Links to your social media profiles.
                </p>
              </div>
              <Button type="button" onClick={() => setShowAddSocial(!showAddSocial)} disabled={socialLoadStatus === "loading"}>
                <Plus className="h-4 w-4" /> {showAddSocial ? "Cancel" : "Add account"}
              </Button>
            </div>

            {/* Add form */}
            {showAddSocial && (
              <form className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/10" onSubmit={handleAddSocial} noValidate>
                <Field label="Platform">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={newSocial.platform}
                    onChange={(e) => setNewSocial((p) => ({ ...p, platform: e.currentTarget.value }))}
                    placeholder="Instagram, Twitter, YouTube..."
                    required
                  />
                </Field>
                <Field label="Handle">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={newSocial.handle}
                    onChange={(e) => setNewSocial((p) => ({ ...p, handle: e.currentTarget.value }))}
                    placeholder="@yourhandle"
                    required
                  />
                </Field>
                <Field label="URL">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    type="url"
                    value={newSocial.url}
                    onChange={(e) => setNewSocial((p) => ({ ...p, url: e.currentTarget.value }))}
                    placeholder="https://instagram.com/yourhandle"
                    required
                  />
                </Field>
                <Button type="submit" disabled={savingSocial}>
                  {savingSocial ? "Adding..." : "Add"}
                </Button>
              </form>
            )}

            {/* List */}
            {socialLoadStatus === "loading" && <StatusPanel type="loading" title="Loading" message="Fetching social accounts..." />}
            {socialLoadStatus === "error" && <StatusPanel type="error" title="Error" message="Failed to load social accounts." />}
            {socialLoadStatus === "success" && socialAccounts.length === 0 && (
              <StatusPanel type="empty" title="No accounts" message="Add your social media accounts to showcase your reach." />
            )}
            {socialLoadStatus === "success" && socialAccounts.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {socialAccounts.map((acc) => (
                  <li key={acc.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/10">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={acc.platform} />
                      <div>
                        <span className="text-sm font-medium">{acc.platform}</span>
                        <span className="ml-2 text-xs text-slate-500">@{acc.handle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={acc.url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-700 dark:text-cyan-400">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeleteSocial(acc.id)}
                        className="text-red-500 hover:text-red-600"
                        aria-label={`Delete ${acc.platform} account`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ============================================================ */}
          {/*  Stats snapshots                                                */}
          {/* ============================================================ */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Stats snapshots</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Manually track your follower counts and engagement.
                </p>
              </div>
              <Button type="button" onClick={() => setShowAddStats(!showAddStats)} disabled={statsLoadStatus === "loading"}>
                <Plus className="h-4 w-4" /> {showAddStats ? "Cancel" : "Add stats"}
              </Button>
            </div>

            {/* Add form */}
            {showAddStats && (
              <form className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/10" onSubmit={handleAddStats} noValidate>
                <Field label="Platform">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={newStats.platform}
                    onChange={(e) => setNewStats((p) => ({ ...p, platform: e.currentTarget.value }))}
                    placeholder="Instagram"
                    required
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Followers">
                    <input
                      className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                      type="number"
                      min="0"
                      value={newStats.follower_count ?? ""}
                      onChange={(e) => setNewStats((p) => ({ ...p, follower_count: e.currentTarget.value ? Number(e.currentTarget.value) : undefined }))}
                      placeholder="10000"
                    />
                  </Field>
                  <Field label="Engagement rate %">
                    <input
                      className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newStats.engagement_rate ?? ""}
                      onChange={(e) => setNewStats((p) => ({ ...p, engagement_rate: e.currentTarget.value ? Number(e.currentTarget.value) : undefined }))}
                      placeholder="3.5"
                    />
                  </Field>
                  <Field label="Avg views">
                    <input
                      className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                      type="number"
                      min="0"
                      value={newStats.average_views ?? ""}
                      onChange={(e) => setNewStats((p) => ({ ...p, average_views: e.currentTarget.value ? Number(e.currentTarget.value) : undefined }))}
                      placeholder="5000"
                    />
                  </Field>
                </div>
                <Button type="submit" disabled={savingStats}>
                  {savingStats ? "Adding..." : "Add stats"}
                </Button>
              </form>
            )}

            {/* List */}
            {statsLoadStatus === "loading" && <StatusPanel type="loading" title="Loading" message="Fetching stats..." />}
            {statsLoadStatus === "error" && <StatusPanel type="error" title="Error" message="Failed to load stats." />}
            {statsLoadStatus === "success" && stats.length === 0 && (
              <StatusPanel type="empty" title="No stats" message="Add your audience stats to showcase your reach." />
            )}
            {statsLoadStatus === "success" && stats.length > 0 && (
              <ul className="mt-4 grid gap-2">
                {stats.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/10">
                    <div className="grid gap-1 sm:grid-cols-4">
                      <span className="text-sm font-medium">{s.platform}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {s.follower_count != null ? `${s.follower_count.toLocaleString()} followers` : "—"}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {s.engagement_rate != null ? `${s.engagement_rate}% eng.` : "—"}
                      </span>
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        {s.average_views != null ? `${s.average_views.toLocaleString()} avg views` : "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteStats(s.id)}
                      className="text-red-500 hover:text-red-600"
                      aria-label="Delete stats"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* ============================================================ */}
          {/*  Portfolio media                                                */}
          {/* ============================================================ */}
          <Card>
            <div>
              <h2 className="text-xl font-black">Portfolio media</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Upload images or videos to showcase your work (max 20 MB each).
              </p>
            </div>

            {/* Upload form */}
            <div className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/10">
              <Field label="File">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4"
                  className="block w-full rounded-2xl border border-slate-200 p-3 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white dark:border-white/10 dark:file:bg-white dark:file:text-slate-950"
                />
              </Field>
              <Field label="Caption (optional)">
                <input
                  className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  value={fileCaption}
                  onChange={(e) => setFileCaption(e.currentTarget.value ?? "")}
                  placeholder="A brief description of this work..."
                />
              </Field>
              <Button type="button" onClick={handleUploadPortfolio} disabled={uploadingFile}>
                {uploadingFile ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</> : <><Image className="h-4 w-4" /> Upload</>}
              </Button>
            </div>

            {/* List */}
            {portfolioLoadStatus === "loading" && <StatusPanel type="loading" title="Loading" message="Fetching portfolio..." />}
            {portfolioLoadStatus === "error" && <StatusPanel type="error" title="Error" message="Failed to load portfolio." />}
            {portfolioLoadStatus === "success" && portfolio.length === 0 && (
              <StatusPanel type="empty" title="No portfolio items" message="Upload images or videos to showcase your work." />
            )}
            {portfolioLoadStatus === "success" && portfolio.length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {portfolio.map((item) => {
                  const url = getPortfolioMediaUrl(item.storage_path);
                  return (
                    <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-white/10">
                      <img
                        src={url}
                        alt={item.caption ?? "Portfolio item"}
                        className="h-48 w-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                        {item.caption && <p className="text-xs text-white">{item.caption}</p>}
                        <button
                          type="button"
                          onClick={() => handleDeletePortfolio(item.id)}
                          className="mt-2 flex items-center gap-1 text-xs font-bold text-red-300 hover:text-red-200"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
