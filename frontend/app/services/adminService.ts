import { supabase } from "~/lib/supabase";
import type { VerificationDocument } from "~/services/verificationService";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type VerificationItem = {
  id: string;
  business_name: string;
  industry: string | null;
  city: string | null;
  verification_status: "unsubmitted" | "pending" | "approved" | "rejected";
  is_discoverable: boolean;
  updated_at: string;
};

export type AuditLogEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reason: string;
  details: string | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

/** List business profiles pending verification review.
 *  RLS restricts this to admins (is_admin() returns true). */
export async function listPendingVerifications(): Promise<VerificationItem[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("business_profiles")
    .select("id, business_name, industry, city, verification_status, is_discoverable, updated_at")
    .in("verification_status", ["unsubmitted", "pending"])
    .order("updated_at", { ascending: false })
    .returns<VerificationItem[]>();

  if (error) throw error;
  return data ?? [];
}

/** Approve or reject a business verification. Admin only via RLS. */
export async function updateVerificationStatus(
  businessId: string,
  status: "approved" | "rejected",
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { error } = await supabase
    .from("business_profiles")
    .update({ verification_status: status })
    .eq("id", businessId);

  if (error) throw error;
}

/** List verification documents for a specific business (admin only). */
export async function listVerificationDocuments(
  businessId: string,
): Promise<VerificationDocument[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("verification_documents")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })
    .returns<VerificationDocument[]>();

  if (error) throw error;
  return data ?? [];
}

/** List audit log entries. RLS restricts to admins. */
export async function listAuditLogs(): Promise<AuditLogEntry[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<AuditLogEntry[]>();

  if (error) throw error;
  return data ?? [];
}

/** List reports (open/reviewing). RLS restricts to admins for select. */
export async function listReports(): Promise<Report[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .in("status", ["open", "reviewing"])
    .order("created_at", { ascending: false })
    .returns<Report[]>();

  if (error) throw error;
  return data ?? [];
}

/** Update report status (resolve/dismiss). RLS restricts to admins. */
export async function updateReportStatus(
  reportId: string,
  status: Report["status"],
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { error } = await supabase
    .from("reports")
    .update({ status })
    .eq("id", reportId);

  if (error) throw error;
}

/** Record an admin action in the audit log. */
export async function recordAdminAction(
  action: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to record an action.");

  const { error } = await supabase.from("admin_actions").insert({
    admin_id: user.id,
    action,
    metadata: metadata ?? {},
  });

  if (error) throw error;
}
