import { supabase } from "~/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Campaign = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  city: string | null;
  status: "draft" | "published" | "closed" | "cancelled";
  created_at: string;
  updated_at: string;
};

export type CampaignCard = {
  id: string;
  business_id: string;
  business_name: string;
  title: string;
  description: string | null;
  city: string | null;
  created_at: string;
  updated_at: string;
};

export type Offer = {
  id: string;
  campaign_id: string | null;
  business_id: string;
  creator_id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "completed";
  private_terms: string | null;
  created_at: string;
  updated_at: string;
};

export type CampaignWithMeta = {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  city: string | null;
  status: Campaign["status"];
  offers: Offer[];
  created_at: string;
  updated_at: string;
};

export type CreateCampaignInput = {
  title: string;
  description?: string;
  city?: string;
};

export type CreateOfferInput = {
  campaignId: string;
  creatorId: string;
  privateTerms?: string;
};

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

/** List campaigns for the current user's business (or published campaigns).
 *  For businesses: own campaigns + drafts.
 *  For creators: published campaigns via public_campaign_cards view. */
export async function listMyCampaigns(): Promise<CampaignWithMeta[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to view campaigns.");

  // Get the user's role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<{ role: "creator" | "business" }>();

  if (profileError) throw profileError;
  if (!profile) throw new Error("Profile not found.");

  let campaigns: Campaign[];

  if (profile.role === "business") {
    // Business sees own campaigns (any status)
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("business_id", user.id)
      .order("created_at", { ascending: false })
      .returns<Campaign[]>();

    if (error) throw error;
    campaigns = data ?? [];
  } else {
    // Creator sees published campaigns via the public view
    const { data, error } = await supabase
      .from("public_campaign_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .returns<CampaignCard[]>();

    if (error) throw error;

    // Map CampaignCard to Campaign shape
    campaigns = (data ?? []).map((c) => ({
      id: c.id,
      business_id: c.business_id,
      title: c.title,
      description: c.description,
      city: c.city,
      status: "published" as const,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  }

  // Fetch offers for each campaign
  const campaignIds = campaigns.map((c) => c.id);
  const offersByCampaign: Record<string, Offer[]> = {};

  if (campaignIds.length > 0) {
    const { data: offers, error: offerErr } = await supabase
      .from("offers")
      .select("*")
      .in("campaign_id", campaignIds)
      .returns<Offer[]>();

    if (!offerErr && offers) {
      for (const offer of offers) {
        if (!offersByCampaign[offer.campaign_id!]) {
          offersByCampaign[offer.campaign_id!] = [];
        }
        offersByCampaign[offer.campaign_id!].push(offer);
      }
    }
  }

  return campaigns.map((c) => ({
    ...c,
    offers: offersByCampaign[c.id] ?? [],
  }));
}

/** Get a single campaign by ID with its offers. */
export async function getCampaign(id: string): Promise<CampaignWithMeta | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data: campaign, error: campErr } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .maybeSingle<Campaign>();

  if (campErr) throw campErr;
  if (!campaign) return null;

  const { data: offers, error: offerErr } = await supabase
    .from("offers")
    .select("*")
    .eq("campaign_id", id)
    .returns<Offer[]>();

  if (offerErr) throw offerErr;

  return {
    ...campaign,
    offers: offers ?? [],
  };
}

/** Create a new campaign (business only, will default to draft). */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to create a campaign.");

  const title = input.title.trim();
  if (title.length < 2) throw new Error("Campaign title must be at least 2 characters.");

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      business_id: user.id,
      title,
      description: input.description?.trim() || null,
      city: input.city?.trim() || null,
      status: "draft",
    })
    .select("*")
    .single<Campaign>();

  if (error) throw error;
  if (!data) throw new Error("Failed to create campaign.");
  return data;
}

/** Create an offer from a business to a creator for a campaign. */
export async function createOffer(input: CreateOfferInput): Promise<Offer> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to create an offer.");

  const { data, error } = await supabase
    .from("offers")
    .insert({
      campaign_id: input.campaignId,
      business_id: user.id,
      creator_id: input.creatorId,
      private_terms: input.privateTerms?.trim() || null,
    })
    .select("*")
    .single<Offer>();

  if (error) throw error;
  if (!data) throw new Error("Failed to create offer.");
  return data;
}

/** Update the status of an offer (accept/reject/complete/cancel). */
export async function updateOfferStatus(
  offerId: string,
  status: Offer["status"],
): Promise<Offer> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("offers")
    .update({ status })
    .eq("id", offerId)
    .select("*")
    .single<Offer>();

  if (error) throw error;
  if (!data) throw new Error("Failed to update offer.");
  return data;
}
