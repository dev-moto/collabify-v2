import { supabase } from "~/lib/supabase";

export type AccountRole = "creator" | "business";

export type Profile = {
  id: string;
  role: AccountRole;
  display_name: string;
  city: string | null;
  status: "active" | "suspended" | "deleted";
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type OnboardingInput = {
  role: AccountRole;
  displayName: string;
  city?: string;
};

export function profileHomePath(profile: Pick<Profile, "role"> | null) {
  if (profile?.role === "business") return "/business/dashboard";
  if (profile?.role === "creator") return "/creator/dashboard";
  return "/onboarding";
}

export async function getCurrentProfile() {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, display_name, city, status, onboarding_completed, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (error) throw error;

  return data;
}

export async function completeOnboarding(input: OnboardingInput) {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const displayName = input.displayName.trim();
  const city = input.city?.trim() || null;

  if (displayName.length < 2) {
    throw new Error("Display name must be at least 2 characters.");
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to complete onboarding.");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        role: input.role,
        display_name: displayName,
        city,
        onboarding_completed: true,
      },
      { onConflict: "id" },
    )
    .select("id, role, display_name, city, status, onboarding_completed, created_at, updated_at")
    .single<Profile>();

  if (error) throw error;

  return data;
}

export type ProfileUpdateInput = {
  display_name?: string;
  city?: string | null;
};

/** Update the current user's profile fields (display_name, city).
 *  RLS restricts updates to the profile owner or admin. */
export async function updateProfile(input: ProfileUpdateInput): Promise<Profile> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to update your profile.");

  const updates: Record<string, unknown> = {};

  if (input.display_name !== undefined) {
    const name = input.display_name.trim();
    if (name.length < 2) throw new Error("Display name must be at least 2 characters.");
    updates.display_name = name;
  }

  if (input.city !== undefined) {
    updates.city = input.city?.trim() || null;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No fields to update.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, role, display_name, city, status, onboarding_completed, created_at, updated_at")
    .single<Profile>();

  if (error) throw error;
  if (!data) throw new Error("Failed to update profile.");
  return data;
}
