import { supabase } from "~/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Plan = {
  id: string;
  name: string;
  is_active: boolean;
  metadata: {
    features: string[];
  };
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string | null;
  status: "inactive" | "trialing" | "active" | "past_due" | "cancelled";
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

/** List all active plans available for subscription. */
export async function listPlans(): Promise<Plan[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("id", { ascending: true })
    .returns<Plan[]>();

  if (error) throw error;
  return data ?? [];
}

/** Get the current user's subscription, if any. */
export async function getMySubscription(): Promise<Subscription | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<Subscription>();

  if (error) throw error;
  return data;
}

/** Subscribe (or switch) to a plan. Creates a new subscription record. */
export async function subscribeToPlan(planId: string): Promise<Subscription> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  // Cancel any existing active/trialing subscriptions
  const { error: cancelErr } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"]);

  if (cancelErr) throw cancelErr;

  // Create new subscription
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_id: user.id,
      plan_id: planId,
      status: "active",
    })
    .select("*")
    .single<Subscription>();

  if (error) throw error;
  if (!data) throw new Error("Failed to create subscription.");
  return data;
}

/** Cancel the current active subscription. */
export async function cancelSubscription(): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in.");

  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"]);

  if (error) throw error;
}

/** Check if the current user has access to a specific feature. */
export async function hasFeatureAccess(feature: string): Promise<boolean> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .rpc("has_feature_access", { feature })
    .single<boolean>();

  if (error) throw error;
  return data ?? false;
}
