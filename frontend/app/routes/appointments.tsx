import { useEffect, useState } from "react";
import { CalendarPlus } from "lucide-react";
import { AppShell, Badge, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { listAppointments, createAppointment, type Appointment, type CreateAppointmentInput } from "~/services/appointmentsService";

export function meta() { return [{ title: "Appointments | Collabify" }]; }

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [businessId, setBusinessId] = useState("");
  const [creatorId, setCreatorId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<"idle" | "success" | "error">("idle");
  const [createMessage, setCreateMessage] = useState("");

  useEffect(() => {
    listAppointments()
      .then((data) => {
        setAppointments(data);
        setStatus("success");
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load appointments.");
        setStatus("error");
      });
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId.trim() || !creatorId.trim()) {
      setCreateResult("error");
      setCreateMessage("Both participant IDs are required.");
      return;
    }

    setCreating(true);
    setCreateResult("idle");
    try {
      const input: CreateAppointmentInput = {
        businessId: businessId.trim(),
        creatorId: creatorId.trim(),
        scheduledFor: scheduledFor || undefined,
        notes: notes.trim() || undefined,
      };
      const appointment = await createAppointment(input);
      setAppointments((prev) => [...prev, appointment]);
      setBusinessId("");
      setCreatorId("");
      setScheduledFor("");
      setNotes("");
      setCreateResult("success");
      setCreateMessage("Meeting request sent.");
    } catch (err) {
      setCreateResult("error");
      setCreateMessage(err instanceof Error ? err.message : "Failed to create appointment.");
    } finally {
      setCreating(false);
    }
  }

  const statusBadge = (s: Appointment["status"]) => {
    const tones: Record<string, "green" | "amber" | "cyan" | "violet" | "red" | "slate"> = {
      accepted: "green",
      requested: "amber",
      pending: "amber",
      declined: "red",
      rescheduled: "violet",
      cancelled: "slate",
      completed: "cyan",
    };
    return tones[s] ?? "slate";
  };

  return (
    <ProtectedRoute>
      <AppShell title="Appointments" description="Calendar-friendly meeting requests with clear statuses and accessible forms.">
        <div className="grid gap-6 lg:grid-cols-[1fr_.8fr]">
          <Card>
            <h2 className="text-xl font-black">Upcoming meetings</h2>
            {status === "loading" && <StatusPanel type="loading" title="Loading appointments" message="Please wait while we load your appointments." />}
            {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
            {status === "success" && appointments.length === 0 && (
              <StatusPanel type="empty" title="No appointments yet" message="Request a meeting with a creator or business to get started." />
            )}
            {status === "success" && (
              <div className="mt-4 grid gap-3">
                {appointments.map((a) => (
                  <article key={a.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-bold">Appointment {a.id.slice(0, 8)}</h3>
                      <Badge tone={statusBadge(a.status)}>
                        {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {a.scheduled_for ? new Date(a.scheduled_for).toLocaleDateString() : "No date set"} · {a.notes ? `${a.notes.slice(0, 60)}${a.notes.length > 60 ? "..." : ""}` : ""}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-xl font-black">Request meeting</h2>
            <form className="mt-4 grid gap-4" onSubmit={handleCreate} noValidate>
              <Field label="Business ID">
                <input
                  className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  value={businessId}
                  onChange={(e) => setBusinessId(e.currentTarget.value ?? "")}
                  required
                  placeholder="Business user UUID"
                />
              </Field>
              <Field label="Creator ID">
                <input
                  className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  value={creatorId}
                  onChange={(e) => setCreatorId(e.currentTarget.value ?? "")}
                  required
                  placeholder="Creator user UUID"
                />
              </Field>
              <Field label="Preferred date">
                <input
                  className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  type="date"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.currentTarget.value ?? "")}
                />
              </Field>
              <Field label="Notes">
                <textarea
                  className="min-h-28 rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  maxLength={500}
                  value={notes}
                  onChange={(e) => setNotes(e.currentTarget.value ?? "")}
                  placeholder="Agenda, links, and preparation notes"
                />
              </Field>
              <Button type="submit" disabled={creating}>
                <CalendarPlus className="h-4 w-4" /> {creating ? "Sending..." : "Send request"}
              </Button>
              {createResult !== "idle" && (
                <StatusPanel type={createResult} title={createResult === "success" ? "Sent" : "Error"} message={createMessage} />
              )}
              <p className="text-xs text-slate-500">
                Validation checks required participant and date before sending to Supabase.
              </p>
            </form>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
