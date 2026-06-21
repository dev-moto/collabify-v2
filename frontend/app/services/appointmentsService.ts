import { supabase } from "~/lib/supabase";
import { getCreatorCard, getBusinessCard } from "~/services/discoverService";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AppointmentStatus = "requested" | "accepted" | "declined" | "rescheduled" | "cancelled" | "completed";

export type Appointment = {
  id: string;
  business_id: string;
  creator_id: string;
  scheduled_for: string | null;
  status: AppointmentStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type CreateAppointmentInput = {
  businessId: string;
  creatorId: string;
  scheduledFor?: string;
  notes?: string;
};

export type AppointmentWithCounterpart = Appointment & {
  counterpart_name: string;
  counterpart_role: "creator" | "business";
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

async function resolveCounterpartName(appointment: Appointment, userId: string): Promise<string> {
  const isBusiness = appointment.business_id === userId;
  const counterpartId = isBusiness ? appointment.creator_id : appointment.business_id;
  const counterpartRole = isBusiness ? "creator" : "business";

  try {
    if (counterpartRole === "creator") {
      const card = await getCreatorCard(counterpartId);
      return card?.display_name ?? "Unknown creator";
    }
    const card = await getBusinessCard(counterpartId);
    return card?.business_name ?? "Unknown business";
  } catch {
    return counterpartRole === "creator" ? "Unknown creator" : "Unknown business";
  }
}

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

/** List appointments where the current user is either the business or creator. */
export async function listAppointments(): Promise<Appointment[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to view appointments.");

  // RLS policy allows select if business_id = auth.uid() or creator_id = auth.uid()
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .or(`business_id.eq.${user.id},creator_id.eq.${user.id}`)
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .returns<Appointment[]>();

  if (error) throw error;
  return data ?? [];
}

/** List appointments with counterpart display names resolved. */
export async function listAppointmentsWithNames(): Promise<AppointmentWithCounterpart[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const appointments = await listAppointments();
  const withNames = await Promise.all(
    appointments.map(async (a) => {
      const name = await resolveCounterpartName(a, user.id);
      const isBusiness = a.business_id === user.id;
      return { ...a, counterpart_name: name, counterpart_role: (isBusiness ? "creator" : "business") as "creator" | "business" };
    }),
  );
  return withNames;
}

/** Get a single appointment by ID (RLS enforces participant access). */
export async function getAppointment(id: string): Promise<Appointment | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", id)
    .maybeSingle<Appointment>();

  if (error) throw error;
  return data;
}

/** Create a new appointment request. */
export async function createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to create an appointment.");

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      business_id: input.businessId,
      creator_id: input.creatorId,
      scheduled_for: input.scheduledFor || null,
      notes: input.notes?.trim() || null,
      created_by: user.id,
    })
    .select("*")
    .single<Appointment>();

  if (error) throw error;
  if (!data) throw new Error("Failed to create appointment.");
  return data;
}

/** Update appointment status (accept/decline/reschedule/cancel/complete). */
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus,
): Promise<Appointment> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .select("*")
    .single<Appointment>();

  if (error) throw error;
  if (!data) throw new Error("Failed to update appointment.");
  return data;
}

/** Reschedule an appointment — updates both the date and sets status back to 'requested'
 *  so the other party can accept the new time. */
export async function rescheduleAppointment(
  appointmentId: string,
  scheduledFor: string,
): Promise<Appointment> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("appointments")
    .update({ scheduled_for: scheduledFor, status: "rescheduled" })
    .eq("id", appointmentId)
    .select("*")
    .single<Appointment>();

  if (error) throw error;
  if (!data) throw new Error("Failed to reschedule appointment.");
  return data;
}
