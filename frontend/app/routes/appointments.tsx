import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Loader2,
  Repeat2,
  XCircle,
} from "lucide-react";
import { AppShell, Badge, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import {
  createAppointment,
  listAppointmentsWithNames,
  updateAppointmentStatus,
  rescheduleAppointment,
  type AppointmentWithCounterpart,
  type AppointmentStatus,
  type CreateAppointmentInput,
} from "~/services/appointmentsService";

export function meta() {
  return [{ title: "Appointments | Collabify" }];
}

/* ------------------------------------------------------------------ */
/*  Badge helper                                                        */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<AppointmentStatus, { label: string; tone: "green" | "amber" | "red" | "violet" | "slate" | "cyan" }> = {
  accepted: { label: "Accepted", tone: "green" },
  requested: { label: "Requested", tone: "amber" },
  declined: { label: "Declined", tone: "red" },
  rescheduled: { label: "Rescheduled", tone: "violet" },
  cancelled: { label: "Cancelled", tone: "slate" },
  completed: { label: "Completed", tone: "cyan" },
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Appointments() {
  const profile = useAppSelector((s) => s.session.profile);
  const role = profile?.role ?? "creator";

  const [appointments, setAppointments] = useState<AppointmentWithCounterpart[]>([]);
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  // Create form
  const [counterpartId, setCounterpartId] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createResult, setCreateResult] = useState<"idle" | "success" | "error">("idle");
  const [createMessage, setCreateMessage] = useState("");

  // Action state
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [actionError, setActionError] = useState("");

  // Reschedule modal state
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setStatus("loading");
    try {
      const data = await listAppointmentsWithNames();
      setAppointments(data);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load appointments.");
      setStatus("error");
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!counterpartId.trim()) {
      setCreateResult("error");
      setCreateMessage("Please enter the other participant's user ID.");
      return;
    }

    setCreating(true);
    setCreateResult("idle");
    try {
      const isBusiness = role === "business";
      const input: CreateAppointmentInput = {
        businessId: isBusiness ? (profile?.id ?? "") : counterpartId.trim(),
        creatorId: isBusiness ? counterpartId.trim() : (profile?.id ?? ""),
        scheduledFor: scheduledFor || undefined,
        notes: notes.trim() || undefined,
      };
      const appointment = await createAppointment(input);
      // Reload to get the counterpart name
      await loadAppointments();
      setCounterpartId("");
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

  async function handleAction(appointmentId: string, newStatus: AppointmentStatus) {
    setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));
    setActionError("");
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      await loadAppointments();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: false }));
    }
  }

  async function handleRescheduleSubmit(appointmentId: string) {
    if (!rescheduleDate) return;
    setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));
    setActionError("");
    try {
      await rescheduleAppointment(appointmentId, rescheduleDate);
      await loadAppointments();
      setRescheduling(null);
      setRescheduleDate("");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Reschedule failed.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: false }));
    }
  }

  function ActionButtons({ a }: { a: AppointmentWithCounterpart }) {
    const isBusiness = a.business_id === profile?.id;

    // Determine which actions are available based on status and role
    const actions: { label: string; status: AppointmentStatus; icon: React.ReactNode; variant?: "primary" | "secondary"; className?: string }[] = [];

    if (a.status === "requested") {
      // The recipient can accept or decline
      actions.push(
        { label: "Accept", status: "accepted", icon: <CheckCircle2 className="h-4 w-4" />, variant: "primary", className: "!bg-emerald-600 !text-white hover:!bg-emerald-700" },
        { label: "Decline", status: "declined", icon: <XCircle className="h-4 w-4" />, variant: "secondary", className: "!text-red-600 hover:!bg-red-50 dark:!text-red-400" },
      );
    } else if (a.status === "accepted") {
      // Either party can complete or cancel
      actions.push(
        { label: "Complete", status: "completed", icon: <CalendarCheck className="h-4 w-4" />, variant: "primary", className: "!bg-emerald-600 !text-white hover:!bg-emerald-700" },
        { label: "Cancel", status: "cancelled", icon: <XCircle className="h-4 w-4" />, variant: "secondary", className: "!text-red-600 hover:!bg-red-50 dark:!text-red-400" },
      );
    } else if (a.status === "rescheduled") {
      // Treat new proposed time like a new request
      actions.push(
        { label: "Accept", status: "accepted", icon: <CheckCircle2 className="h-4 w-4" />, variant: "primary", className: "!bg-emerald-600 !text-white hover:!bg-emerald-700" },
        { label: "Decline", status: "declined", icon: <XCircle className="h-4 w-4" />, variant: "secondary", className: "!text-red-600 hover:!bg-red-50 dark:!text-red-400" },
      );
    }

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((act) => (
          <Button
            key={act.status}
            variant={act.variant ?? "secondary"}
            className={act.className ?? ""}
            disabled={!!actionLoading[a.id]}
            onClick={() => handleAction(a.id, act.status)}
          >
            {actionLoading[a.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : act.icon}
            {act.label}
          </Button>
        ))}
        {/* Reschedule button — available for accepted/rescheduled/requested */}
        {(a.status === "accepted" || a.status === "requested") && (
          <Button
            variant="secondary"
            disabled={!!actionLoading[a.id]}
            onClick={() => setRescheduling(rescheduling === a.id ? null : a.id)}
          >
            <Repeat2 className="h-4 w-4" />
            {rescheduling === a.id ? "Cancel" : "Reschedule"}
          </Button>
        )}
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell role={role} title="Appointments" description="Schedule and manage meetings with your collaboration partners.">
        {actionError && (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300" role="alert">
            {actionError}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          {/* Appointment list */}
          <Card>
            <h2 className="text-xl font-black">Upcoming meetings</h2>
            {status === "loading" && <StatusPanel type="loading" title="Loading appointments" message="Please wait while we load your appointments." />}
            {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
            {status === "success" && appointments.length === 0 && (
              <StatusPanel type="empty" title="No appointments yet" message="Request a meeting with a creator or business to get started." />
            )}
            {status === "success" && (
              <div className="mt-4 grid gap-3">
                {appointments.map((a) => {
                  const meta = STATUS_META[a.status];
                  return (
                    <article key={a.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{a.counterpart_name}</h3>
                          <p className="text-xs text-slate-500">
                            {a.counterpart_role === "creator" ? "Creator" : "Business"}
                          </p>
                        </div>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                        {a.scheduled_for ? (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(a.scheduled_for).toLocaleDateString(undefined, {
                              weekday: "short",
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        ) : (
                          <span className="text-slate-400">No date set</span>
                        )}
                        {a.notes && <span className="italic">"{a.notes.slice(0, 80)}{a.notes.length > 80 ? "..." : ""}"</span>}
                      </div>

                      {/* Action buttons */}
                      <ActionButtons a={a} />

                      {/* Inline reschedule form */}
                      {rescheduling === a.id && (
                        <div className="mt-3 flex flex-wrap items-end gap-3 border-t border-slate-200 pt-3 dark:border-white/10">
                          <Field label="New date">
                            <input
                              className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                              type="date"
                              value={rescheduleDate}
                              onChange={(e) => setRescheduleDate(e.currentTarget.value ?? "")}
                            />
                          </Field>
                          <Button
                            disabled={!rescheduleDate || !!actionLoading[a.id]}
                            onClick={() => handleRescheduleSubmit(a.id)}
                          >
                            {actionLoading[a.id] ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Repeat2 className="h-4 w-4" />
                            )}
                            Propose new time
                          </Button>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Create form */}
          <Card>
            <h2 className="text-xl font-black">Request meeting</h2>
            <form className="mt-4 grid gap-4" onSubmit={handleCreate} noValidate>
              <Field label={role === "business" ? "Creator user ID" : "Business user ID"}>
                <input
                  className="rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                  value={counterpartId}
                  onChange={(e) => setCounterpartId(e.currentTarget.value ?? "")}
                  required
                  placeholder="Paste the user's UUID"
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
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4" />
                )}
                {creating ? "Sending..." : "Send request"}
              </Button>
              {createResult !== "idle" && (
                <StatusPanel type={createResult} title={createResult === "success" ? "Sent" : "Error"} message={createMessage} />
              )}
              <p className="text-xs text-slate-500">
                You are requesting a meeting as a <strong>{role}</strong>. Enter the other participant's user ID.
              </p>
            </form>
          </Card>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
