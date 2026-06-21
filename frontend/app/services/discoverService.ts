import { supabase } from "~/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CreatorCard = {
  id: string;
  display_name: string;
  city: string | null;
  bio: string | null;
  niches: string[];
  is_discoverable: boolean;
  updated_at: string;
};

export type BusinessCard = {
  id: string;
  business_name: string;
  industry: string | null;
  city: string | null;
  verification_status: "unsubmitted" | "pending" | "approved" | "rejected";
  is_discoverable: boolean;
  updated_at: string;
};

/* ------------------------------------------------------------------ */
/*  Filters                                                            */
/* ------------------------------------------------------------------ */

export type DiscoverCreatorsFilter = {
  city?: string;
  niche?: string;
  query?: string;
};

export type DiscoverBusinessesFilter = {
  city?: string;
  industry?: string;
  query?: string;
};

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

export async function listCreatorCards(filter?: DiscoverCreatorsFilter): Promise<CreatorCard[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  let query = supabase
    .from("public_creator_cards")
    .select<"*", CreatorCard>("*");

  if (filter?.city) {
    query = query.eq("city", filter.city);
  }

  if (filter?.niche) {
    query = query.contains("niches", [filter.niche]);
  }

  if (filter?.query) {
    const q = `%${filter.query}%`;
    query = query.or(`display_name.ilike.${q},city.ilike.${q},bio.ilike.${q}`);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCreatorCard(id: string): Promise<CreatorCard | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("public_creator_cards")
    .select<"*", CreatorCard>("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listBusinessCards(filter?: DiscoverBusinessesFilter): Promise<BusinessCard[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  let query = supabase
    .from("public_business_cards")
    .select<"*", BusinessCard>("*");

  if (filter?.city) {
    query = query.eq("city", filter.city);
  }

  if (filter?.industry) {
    query = query.eq("industry", filter.industry);
  }

  if (filter?.query) {
    const q = `%${filter.query}%`;
    query = query.or(`business_name.ilike.${q},city.ilike.${q},industry.ilike.${q}`);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getBusinessCard(id: string): Promise<BusinessCard | null> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("public_business_cards")
    .select<"*", BusinessCard>("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listCities(): Promise<string[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("public_creator_cards")
    .select("city")
    .not("city", "is", null)
    .order("city", { ascending: true });

  if (error) throw error;

  const cities = new Set((data ?? []).map((r) => r.city).filter((c): c is string => c !== null));
  return Array.from(cities).sort();
}

/** List distinct cities from the public_business_cards view. */
export async function listBusinessCities(): Promise<string[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("public_business_cards")
    .select("city")
    .not("city", "is", null)
    .order("city", { ascending: true });

  if (error) throw error;

  const cities = new Set((data ?? []).map((r) => r.city).filter((c): c is string => c !== null));
  return Array.from(cities).sort();
}
