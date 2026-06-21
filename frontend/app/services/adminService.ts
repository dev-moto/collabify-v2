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

export type AdminUser = {
  id: string;
  display_name: string;
  role: "creator" | "business";
  city: string | null;
  status: "active" | "suspended" | "deleted";
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type DashboardStats = {
  total_users: number;
  total_creators: number;
  total_businesses: number;
  total_suspended: number;
  pending_verifications: number;
  open_reports: number;
};

/* ------------------------------------------------------------------ */
/*  Dashboard stats                                                    */
/* ------------------------------------------------------------------ */

/** Fetch aggregate counts for the admin dashboard. */
export async function getDashboardStats(): Promise<DashboardStats> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { count: total_users } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true });

  const { count: total_creators } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "creator");

  const { count: total_businesses } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("role", "business");

  const { count: total_suspended } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("status", "suspended");

  const { count: pending_verifications } = await supabase
    .from("business_profiles")
    .select("*", { count: "exact", head: true })
    .in("verification_status", ["unsubmitted", "pending"]);

  const { count: open_reports } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "reviewing"]);

  return {
    total_users: total_users ?? 0,
    total_creators: total_creators ?? 0,
    total_businesses: total_businesses ?? 0,
    total_suspended: total_suspended ?? 0,
    pending_verifications: pending_verifications ?? 0,
    open_reports: open_reports ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  User management                                                    */
/* ------------------------------------------------------------------ */

/** List all users with profile data, ordered by most recently created.
 *  Resolves admin status from the user_roles table. */
export async function listUsers(query?: string): Promise<AdminUser[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  let builder = supabase
    .from("profiles")
    .select(`
      id,
      display_name,
      role,
      city,
      status,
      created_at,
      updated_at
    `);

  if (query) {
    builder = builder.ilike("display_name", `%${query}%`);
  }

  const { data: profiles, error } = await builder
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<Pick<AdminUser, "id" | "display_name" | "role" | "city" | "status" | "created_at" | "updated_at">[]>();

  if (error) throw error;

  if (!profiles || profiles.length === 0) return [];

  // Resolve admin status for each user
  const userIds = profiles.map((p) => p.id);
  const { data: adminRoles } = await supabase
    .from("user_roles")
    .select("user_id")
    .in("user_id", userIds);

  const adminIds = new Set((adminRoles ?? []).map((r) => r.user_id));

  return profiles.map((p) => ({
    ...p,
    is_admin: adminIds.has(p.id),
  }));
}

/** Get a single user's profile plus admin role info. */
export async function getUserDetail(userId: string): Promise<AdminUser | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, display_name, role, city, status, created_at, updated_at")
    .eq("id", userId)
    .single()
    .returns<Pick<AdminUser, "id" | "display_name" | "role" | "city" | "status" | "created_at" | "updated_at"> | null>();

  if (error) throw error;
  if (!profile) return null;

  const { data: adminRole } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    ...profile,
    is_admin: !!adminRole,
  };
}

/** Suspend a user. RLS allows admins to update any profile. */
export async function suspendUser(
  userId: string,
): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { error } = await supabase
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", userId);

  if (error) throw error;
}

/** Reactivate a previously suspended user. */
export async function activateUser(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", userId);

  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Verification review                                                */
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

/* ------------------------------------------------------------------ */
/*  Audit logs                                                         */
/* ------------------------------------------------------------------ */

/** List audit log entries. RLS restricts to admins. */
export async function listAuditLogs(limit = 100): Promise<AuditLogEntry[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<AuditLogEntry[]>();

  if (error) throw error;
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Reports                                                            */
/* ------------------------------------------------------------------ */

/** List all reports, newest first. */
export async function listReports(statusFilter?: string): Promise<Report[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  let builder = supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter) {
    if (statusFilter === "open") {
      builder = builder.in("status", ["open", "reviewing"]);
    } else {
      builder = builder.eq("status", statusFilter);
    }
  }

  const { data, error } = await builder
    .limit(100)
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

/* ------------------------------------------------------------------ */
/*  Admin actions logging                                              */
/* ------------------------------------------------------------------ */

/** Record an admin action in the admin_actions log. */
export async function recordAdminAction(
  action: string,
  metadata?: Record<string, unknown>,
  targetUserId?: string,
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
    target_user_id: targetUserId ?? null,
  });

  if (error) throw error;
}
