import { useEffect, useState, type FormEvent } from "react";
import { Building2, Globe, MapPin, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { AppShell, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { BusinessVerification } from "~/components/BusinessVerification";
import { useAppSelector } from "~/store/hooks";
import {
  getBusinessProfile,
  updateBusinessProfile,
  type BusinessProfileExtended,
  type BusinessProfileUpdate,
} from "~/services/verificationService";

export function meta() {
  return [{ title: "Business profile | Collabify" }];
}

export default function BusinessProfileEdit() {
  const sessionStatus = useAppSelector((s) => s.session.status);
  const profileStatus = useAppSelector((s) => s.session.profileStatus);
  const profile = useAppSelector((s) => s.session.profile);

  /* --- Form state --- */
  const [bizProfile, setBizProfile] = useState<BusinessProfileExtended | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [city, setCity] = useState("");
  const [isDiscoverable, setIsDiscoverable] = useState(true);
  const [loadStatus, setLoadStatus] = useState<"loading" | "success" | "error">("loading");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (sessionStatus !== "authenticated" || profileStatus !== "ready" || profile?.role !== "business") return;
    loadProfile();
  }, [sessionStatus, profileStatus, profile?.role]);

  async function loadProfile() {
    setLoadStatus("loading");
    try {
      const bp = await getBusinessProfile();
      if (bp) {
        setBizProfile(bp);
        setBusinessName(bp.business_name);
        setIndustry(bp.industry ?? "");
        setCity(bp.city ?? "");
        setIsDiscoverable(bp.is_discoverable);
        setLoadStatus("success");
      } else {
        setLoadError("Business profile not found. Please complete onboarding first.");
        setLoadStatus("error");
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load profile.");
      setLoadStatus("error");
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveResult("idle");

    try {
      const input: BusinessProfileUpdate = {
        business_name: businessName.trim() || undefined,
        industry: industry.trim() || null,
        city: city.trim() || null,
        is_discoverable: isDiscoverable,
      };

      const updated = await updateBusinessProfile(input);
      setBizProfile(updated);
      setSaveResult("success");
      setSaveMessage("Profile saved.");
    } catch (err) {
      setSaveResult("error");
      setSaveMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute allowedRoles={["business"]}>
      <AppShell role="business" title="Business profile" description="Edit your business profile and manage verification documents.">
        {loadStatus === "loading" && <StatusPanel type="loading" title="Loading profile" message="Fetching your business profile..." />}
        {loadStatus === "error" && <StatusPanel type="error" title="Error" message={loadError} />}

        {loadStatus === "success" && bizProfile && (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
            {/* Editor */}
            <div>
              <Card>
                <div className="flex items-center gap-3">
                  <Building2 className="h-8 w-8 text-cyan-500" />
                  <h1 className="text-2xl font-black">Business profile</h1>
                </div>

                <form className="mt-6 grid gap-5" onSubmit={handleSave} noValidate>
                  <Field label="Business name">
                    <input
                      className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.currentTarget.value ?? "")}
                      placeholder="Your brand or company name"
                      required
                      minLength={2}
                    />
                  </Field>

                  <Field label="Industry">
                    <input
                      className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                      value={industry}
                      onChange={(e) => setIndustry(e.currentTarget.value ?? "")}
                      placeholder="e.g. Food & Beverage, Tech, Fashion"
                    />
                  </Field>

                  <Field label="City">
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className="w-full rounded-2xl border p-3 pl-10 dark:border-white/10 dark:bg-white/10"
                        value={city}
                        onChange={(e) => setCity(e.currentTarget.value ?? "")}
                        placeholder="Metro Manila, Cebu, Davao..."
                      />
                    </div>
                  </Field>

                  {/* Discoverable toggle */}
                  <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsDiscoverable((prev) => !prev)}
                      className="cursor-pointer"
                      aria-checked={isDiscoverable}
                      role="switch"
                    >
                      {isDiscoverable ? (
                        <ToggleRight className="h-6 w-6 text-cyan-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-400" />
                      )}
                    </button>
                    <span>
                      {isDiscoverable ? "Discoverable — your profile appears in search results" : "Hidden — your profile is not shown in search"}
                    </span>
                  </label>

                  <Button type="submit" disabled={saving}>
                    <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save changes"}
                  </Button>

                  {saveResult !== "idle" && (
                    <StatusPanel
                      type={saveResult}
                      title={saveResult === "success" ? "Saved" : "Error"}
                      message={saveMessage}
                    />
                  )}
                </form>
              </Card>

              {/* Quick info */}
              <Card className="mt-6">
                <h2 className="text-lg font-black">Public profile</h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Other users see your <strong>{bizProfile.business_name}</strong> profile with the industry,
                  city, and a verified badge when approved. Full contact info unlocks after verification.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-500">
                  <Globe className="h-4 w-4" />{" "}
                  {[
                    bizProfile.business_name,
                    bizProfile.industry,
                    bizProfile.city,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </div>
              </Card>
            </div>

            {/* Verification section */}
            <div>
              <BusinessVerification />
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
