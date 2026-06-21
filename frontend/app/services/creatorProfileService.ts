import { supabase } from "~/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AvailabilityStatus = "available" | "selective" | "unavailable";

export type CreatorProfile = {
  id: string;
  bio: string | null;
  niches: string[];
  public_email: string | null;
  city: string | null;
  is_discoverable: boolean;
  availability_status: AvailabilityStatus | null;
  rate_card: string | null;
};

export type SocialAccount = {
  id: string;
  creator_id: string;
  platform: string;
  handle: string;
  url: string;
};

export type SocialAccountInput = {
  platform: string;
  handle: string;
  url: string;
};

export type StatsSnapshot = {
  id: string;
  creator_id: string;
  platform: string;
  follower_count: number | null;
  engagement_rate: number | null;
  average_views: number | null;
  captured_at: string;
};

export type StatsSnapshotInput = {
  platform: string;
  follower_count?: number;
  engagement_rate?: number;
  average_views?: number;
};

export type PortfolioMedia = {
  id: string;
  creator_id: string;
  storage_bucket: string;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type CreatorProfileUpdate = {
  bio?: string | null;
  niches?: string[];
  public_email?: string | null;
  city?: string | null;
  is_discoverable?: boolean;
  availability_status?: AvailabilityStatus | null;
  rate_card?: string | null;
};

/* ------------------------------------------------------------------ */
/*  Creator Profile CRUD                                               */
/* ------------------------------------------------------------------ */

/** Get the current user's creator profile extension. */
export async function getMyCreatorProfile(): Promise<CreatorProfile | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("creator_profiles")
    .select("id, bio, niches, public_email, city, is_discoverable, availability_status, rate_card")
    .eq("id", user.id)
    .maybeSingle<CreatorProfile>();

  if (error) throw error;
  return data;
}

/** Upsert the current user's creator profile (owner-only via RLS). */
export async function updateMyCreatorProfile(input: CreatorProfileUpdate): Promise<CreatorProfile> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("creator_profiles")
    .upsert({ id: user.id, ...input }, { onConflict: "id" })
    .select("id, bio, niches, public_email, city, is_discoverable, availability_status, rate_card")
    .single<CreatorProfile>();

  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Social Accounts CRUD                                               */
/* ------------------------------------------------------------------ */

export async function listSocialAccounts(): Promise<SocialAccount[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("creator_id", user.id)
    .order("platform", { ascending: true })
    .returns<SocialAccount[]>();

  if (error) throw error;
  return data ?? [];
}

export async function addSocialAccount(input: SocialAccountInput): Promise<SocialAccount> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("social_accounts")
    .insert({ creator_id: user.id, ...input })
    .select("*")
    .single<SocialAccount>();

  if (error) throw error;
  return data;
}

export async function updateSocialAccount(id: string, input: SocialAccountInput): Promise<SocialAccount> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("social_accounts")
    .update(input)
    .eq("id", id)
    .select("*")
    .single<SocialAccount>();

  if (error) throw error;
  return data;
}

export async function deleteSocialAccount(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { error } = await supabase
    .from("social_accounts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Stats Snapshots CRUD                                               */
/* ------------------------------------------------------------------ */

export async function listStatsSnapshots(): Promise<StatsSnapshot[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("stats_snapshots")
    .select("*")
    .eq("creator_id", user.id)
    .order("captured_at", { ascending: false })
    .returns<StatsSnapshot[]>();

  if (error) throw error;
  return data ?? [];
}

export async function addStatsSnapshot(input: StatsSnapshotInput): Promise<StatsSnapshot> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("stats_snapshots")
    .insert({ creator_id: user.id, ...input })
    .select("*")
    .single<StatsSnapshot>();

  if (error) throw error;
  return data;
}

export async function deleteStatsSnapshot(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { error } = await supabase
    .from("stats_snapshots")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Portfolio Media CRUD                                               */
/* ------------------------------------------------------------------ */

const PORTFOLIO_BUCKET = "portfolio-media";
const MAX_PORTFOLIO_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_PORTFOLIO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];

export async function listPortfolioMedia(): Promise<PortfolioMedia[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const { data, error } = await supabase
    .from("portfolio_media")
    .select("*")
    .eq("creator_id", user.id)
    .order("created_at", { ascending: false })
    .returns<PortfolioMedia[]>();

  if (error) throw error;
  return data ?? [];
}

/** Upload a portfolio media file and record metadata. */
export async function uploadPortfolioMedia(
  file: File,
  caption?: string,
): Promise<PortfolioMedia> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  if (!ALLOWED_PORTFOLIO_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} is not supported. Allowed: ${ALLOWED_PORTFOLIO_TYPES.join(", ")}`);
  }

  if (file.size > MAX_PORTFOLIO_FILE_SIZE) {
    throw new Error(`File size must not exceed ${MAX_PORTFOLIO_FILE_SIZE / 1024 / 1024} MB.`);
  }

  const { data: { user }, error: ue } = await supabase.auth.getUser();
  if (ue) throw ue;
  if (!user) throw new Error("You must be logged in.");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PORTFOLIO_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) throw uploadError;

  const { data, error: insertError } = await supabase
    .from("portfolio_media")
    .insert({
      creator_id: user.id,
      storage_bucket: PORTFOLIO_BUCKET,
      storage_path: storagePath,
      caption: caption?.trim() || null,
    })
    .select("*")
    .single<PortfolioMedia>();

  if (insertError) {
    // Rollback storage upload on DB insert failure
    await supabase.storage.from(PORTFOLIO_BUCKET).remove([storagePath]);
    throw insertError;
  }

  return data;
}

/** Delete a portfolio media entry and its storage file. */
export async function deletePortfolioMedia(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  // Fetch metadata to get storage path
  const { data: media, error: fetchError } = await supabase
    .from("portfolio_media")
    .select("storage_path")
    .eq("id", id)
    .single<{ storage_path: string }>();

  if (fetchError) throw fetchError;

  // Delete from storage
  await supabase.storage.from(PORTFOLIO_BUCKET).remove([media.storage_path]);

  // Delete metadata row
  const { error } = await supabase.from("portfolio_media").delete().eq("id", id);
  if (error) throw error;
}

/** Get a public URL for a portfolio media item. */
export function getPortfolioMediaUrl(storagePath: string): string {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");
  const { data } = supabase.storage.from(PORTFOLIO_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
