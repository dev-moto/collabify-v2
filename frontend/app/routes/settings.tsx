import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AppShell, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { getCurrentProfile, updateProfile, type Profile } from "~/services/profileService";
import { useAppDispatch } from "~/store/hooks";
import { profileChanged } from "~/store/sessionSlice";

export function meta() { return [{ title: "Settings | Collabify" }]; }

export default function Settings() {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"idle" | "success" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    getCurrentProfile()
      .then((data) => {
        if (data) {
          setProfile(data);
          setDisplayName(data.display_name);
          setCity(data.city ?? "");
          setStatus("success");
        } else {
          setError("Profile not found. Please complete onboarding.");
          setStatus("error");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load profile.");
        setStatus("error");
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setSaveResult("error");
      setSaveMessage("Display name must be at least 2 characters.");
      return;
    }

    setSaving(true);
    setSaveResult("idle");
    try {
      const updated = await updateProfile({
        display_name: displayName.trim(),
        city: city.trim() || null,
      });
      setProfile(updated);
      dispatch(profileChanged(updated));
      setSaveResult("success");
      setSaveMessage("Settings saved.");
    } catch (err) {
      setSaveResult("error");
      setSaveMessage(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ProtectedRoute>
      <AppShell title="Settings" description="Control account preferences, notifications, privacy, and safe public visibility.">
        {status === "loading" && <StatusPanel type="loading" title="Loading profile" message="Please wait while we load your settings." />}
        {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
        {status === "success" && profile && (
          <Card>
            <form className="grid gap-5 md:grid-cols-2" onSubmit={handleSave} noValidate>
              <Field label="Display name">
                <input
                  className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.currentTarget.value ?? "")}
                  required
                />
              </Field>
              <Field label="Public city area">
                <input
                  className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  value={city}
                  onChange={(e) => setCity(e.currentTarget.value ?? "")}
                  placeholder="Quezon City"
                />
              </Field>
              <Field label="Account type">
                <input
                  className="rounded-2xl border bg-slate-50 p-3 text-slate-500 dark:border-white/10 dark:bg-white/5"
                  value={profile.role === "creator" ? "Creator" : "Business"}
                  disabled
                />
              </Field>
              <Field label="Status">
                <input
                  className="rounded-2xl border bg-slate-50 p-3 text-slate-500 dark:border-white/10 dark:bg-white/5"
                  value={profile.status}
                  disabled
                />
              </Field>
              <Button className="md:col-span-2 md:w-fit" type="submit" disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save settings"}
              </Button>
              {saveResult !== "idle" && (
                <div className="md:col-span-2">
                  <StatusPanel type={saveResult} title={saveResult === "success" ? "Saved" : "Error"} message={saveMessage} />
                </div>
              )}
            </form>
          </Card>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
