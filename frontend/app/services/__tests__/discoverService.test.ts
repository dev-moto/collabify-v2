import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mock supabase module with chainable builder                         */
/* ------------------------------------------------------------------ */

type QueryBuilder = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  contains: ReturnType<typeof vi.fn>;
  or: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  not: ReturnType<typeof vi.fn>;
};

let resolveValue: { data: unknown; error: unknown } = { data: [], error: null };

function createBuilder(): QueryBuilder {
  const builder: Partial<QueryBuilder> = {};

  // Chainable methods return a Promise that resolves to the current resolveValue.
  // This mimics Supabase's thenable query builder.
  function chainable() {
    return Promise.resolve(resolveValue);
  }

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.contains = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => chainable());
  builder.maybeSingle = vi.fn(() => chainable());
  builder.not = vi.fn(() => builder);
  return builder as QueryBuilder;
}

const mockBuilder = createBuilder();

const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(() => mockBuilder),
}));

vi.mock("~/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

/* ------------------------------------------------------------------ */
/*  Import after mocks                                                  */
/* ------------------------------------------------------------------ */

import {
  listCreatorCards,
  getCreatorCard,
  listBusinessCards,
  getBusinessCard,
  listCities,
} from "~/services/discoverService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function resetBuilder() {
  vi.clearAllMocks();
  resolveValue = { data: [], error: null };
  // Re-connect builder methods so they return self / chainable
  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.contains.mockReturnValue(mockBuilder);
  mockBuilder.or.mockReturnValue(mockBuilder);
  mockBuilder.order.mockImplementation(() => Promise.resolve(resolveValue));
  mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve(resolveValue));
  mockBuilder.not.mockReturnValue(mockBuilder);
}

/** Helper: make the chain resolve with given data */
function resolveWith(data: unknown) {
  resolveValue = { data, error: null };
}

/** Helper: make the chain reject with an error */
function rejectWith(error: Error) {
  resolveValue = { data: null, error };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

beforeEach(() => {
  resetBuilder();
  resolveWith([]);
});

describe("listCreatorCards", () => {
  it("calls from with public_creator_cards view", async () => {
    await listCreatorCards();
    expect(mockFrom).toHaveBeenCalledWith("public_creator_cards");
  });

  it("returns an empty array when no data", async () => {
    const result = await listCreatorCards();
    expect(result).toEqual([]);
  });

  it("returns creator cards when data exists", async () => {
    const fakeCards = [
      { id: "1", display_name: "Ana", city: "Cebu", bio: null, niches: ["Food"], is_discoverable: true, updated_at: "2026-01-01" },
    ];
    resolveWith(fakeCards);

    const result = await listCreatorCards();
    expect(result).toEqual(fakeCards);
  });

  it("filters by city when provided", async () => {
    await listCreatorCards({ city: "Cebu" });
    expect(mockBuilder.eq).toHaveBeenCalledWith("city", "Cebu");
  });

  it("filters by niche when provided", async () => {
    await listCreatorCards({ niche: "Food" });
    expect(mockBuilder.contains).toHaveBeenCalledWith("niches", ["Food"]);
  });

  it("filters by query when provided", async () => {
    await listCreatorCards({ query: "Ana" });
    expect(mockBuilder.or).toHaveBeenCalledWith("display_name.ilike.%Ana%,city.ilike.%Ana%,bio.ilike.%Ana%");
  });

  it("orders by updated_at descending", async () => {
    await listCreatorCards();
    expect(mockBuilder.order).toHaveBeenCalledWith("updated_at", { ascending: false });
  });

  it("throws when supabase errors", async () => {
    rejectWith(new Error("DB error"));
    await expect(listCreatorCards()).rejects.toThrow("DB error");
  });

  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(listCreatorCards()).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom };
    resetBuilder();
    resolveWith([]);
  });
});

describe("getCreatorCard", () => {
  it("calls from with public_creator_cards view and eq id", async () => {
    resolveWith({ id: "user-123", display_name: "Test" });
    await getCreatorCard("user-123");
    expect(mockFrom).toHaveBeenCalledWith("public_creator_cards");
    expect(mockBuilder.eq).toHaveBeenCalledWith("id", "user-123");
    expect(mockBuilder.maybeSingle).toHaveBeenCalled();
  });

  it("returns the card when found", async () => {
    const fakeCard = { id: "1", display_name: "Ana", city: "Cebu", bio: null, niches: ["Food"], is_discoverable: true, updated_at: "2026-01-01" };
    resolveWith(fakeCard);
    const result = await getCreatorCard("1");
    expect(result).toEqual(fakeCard);
  });

  it("returns null when not found", async () => {
    resolveWith(null);
    const result = await getCreatorCard("nonexistent");
    expect(result).toBeNull();
  });
});

describe("listBusinessCards", () => {
  it("calls from with public_business_cards view", async () => {
    await listBusinessCards();
    expect(mockFrom).toHaveBeenCalledWith("public_business_cards");
  });

  it("filters by city when provided", async () => {
    await listBusinessCards({ city: "Cebu" });
    expect(mockBuilder.eq).toHaveBeenCalledWith("city", "Cebu");
  });

  it("filters by industry when provided", async () => {
    await listBusinessCards({ industry: "Food & Beverage" });
    expect(mockBuilder.eq).toHaveBeenCalledWith("industry", "Food & Beverage");
  });

  it("filters by query when provided", async () => {
    await listBusinessCards({ query: "Cafe" });
    expect(mockBuilder.or).toHaveBeenCalledWith("business_name.ilike.%Cafe%,city.ilike.%Cafe%,industry.ilike.%Cafe%");
  });
});

describe("getBusinessCard", () => {
  it("calls from with public_business_cards view and eq id", async () => {
    resolveWith({ id: "biz-123", business_name: "Test" });
    await getBusinessCard("biz-123");
    expect(mockFrom).toHaveBeenCalledWith("public_business_cards");
    expect(mockBuilder.eq).toHaveBeenCalledWith("id", "biz-123");
    expect(mockBuilder.maybeSingle).toHaveBeenCalled();
  });

  it("returns the card when found", async () => {
    const fakeCard = { id: "biz-1", business_name: "Sunrise Cafe", city: "Cebu", industry: "Food", verification_status: "approved", is_discoverable: true, updated_at: "2026-01-01" };
    resolveWith(fakeCard);
    const result = await getBusinessCard("biz-1");
    expect(result).toEqual(fakeCard);
  });
});

describe("listCities", () => {
  it("calls from with public_creator_cards view and returns sorted unique cities", async () => {
    resolveWith([{ city: "Cebu" }, { city: "Makati" }]);
    const result = await listCities();
    expect(mockFrom).toHaveBeenCalledWith("public_creator_cards");
    expect(result).toEqual(["Cebu", "Makati"]);
  });

  it("deduplicates cities", async () => {
    resolveWith([{ city: "Makati" }, { city: "Cebu" }, { city: "Makati" }]);
    const result = await listCities();
    expect(result).toEqual(["Cebu", "Makati"]);
  });

  it("filters out null cities", async () => {
    resolveWith([{ city: "Cebu" }, { city: null }, { city: "Makati" }]);
    const result = await listCities();
    expect(result).toEqual(["Cebu", "Makati"]);
  });
});
