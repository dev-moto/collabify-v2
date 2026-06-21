import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mock supabase module                                                */
/* ------------------------------------------------------------------ */

let resolveValue: { data: unknown; error: unknown } = { data: [], error: null };

function createBuilder(): any {
  // The builder is a thenable so that `await builder` resolves.
  const builder: any = function builder(): Promise<{ data: unknown; error: unknown }> {
    return Promise.resolve(resolveValue);
  };
  builder.then = (onfulfilled: (v: { data: unknown; error: unknown }) => unknown, onrejected?: (e: unknown) => unknown) =>
    Promise.resolve(resolveValue).then(onfulfilled, onrejected);
  builder.catch = (onrejected: (e: unknown) => unknown) => Promise.resolve(resolveValue).catch(onrejected);
  builder.finally = (onfinally?: () => void) => Promise.resolve(resolveValue).finally(onfinally);

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => builder);
  builder.single = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.returns = vi.fn(() => builder);
  return builder;
}

const mockBuilder = createBuilder();

const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(() => mockBuilder),
  mockGetUser: vi.fn(),
}));

vi.mock("~/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
  },
}));

/* ------------------------------------------------------------------ */
/*  Import after mocks                                                  */
/* ------------------------------------------------------------------ */

import {
  listMyCampaigns,
  getCampaign,
  createCampaign,
  createOffer,
  updateOfferStatus,
} from "~/services/campaignsService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function resetBuilder() {
  vi.clearAllMocks();
  resolveValue = { data: [], error: null };

  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.in.mockReturnValue(mockBuilder);
  mockBuilder.order.mockReturnValue(mockBuilder);
  mockBuilder.maybeSingle.mockReturnValue(mockBuilder);
  mockBuilder.single.mockReturnValue(mockBuilder);
  mockBuilder.insert.mockReturnValue(mockBuilder);
  mockBuilder.update.mockReturnValue(mockBuilder);
  mockBuilder.returns.mockReturnValue(mockBuilder);
}

function resolveWith(data: unknown) {
  resolveValue = { data, error: null };
}

function rejectWith(error: Error) {
  resolveValue = { data: null, error };
}

function mockAuthedUser(userId = "user-123") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

beforeEach(() => {
  resetBuilder();
  resolveWith([]);
});

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("listMyCampaigns", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(listMyCampaigns()).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, auth: { getUser: mockGetUser } };
    resetBuilder();
    resolveWith([]);
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(listMyCampaigns()).rejects.toThrow("You must be logged in");
  });

  it("throws when profile not found", async () => {
    mockAuthedUser();
    resolveWith(null);
    mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    await expect(listMyCampaigns()).rejects.toThrow("Profile not found");
  });

  it("loads campaigns for a business user (own campaigns)", async () => {
    mockAuthedUser("biz-123");
    // Make maybeSingle return the profile data
    mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve({ data: { role: "business" }, error: null }));
    // Set resolveValue for the campaigns query (will also be used by profile if not overridden)
    resolveWith([]);
    // Make maybeSingle return the profile data before campaigns query resolves
    // The builder.then() will resolve to resolveValue for subsequent awaits (campaigns query returns [])
    await listMyCampaigns();
    expect(mockFrom).toHaveBeenCalledWith("profiles");
    expect(mockFrom).toHaveBeenCalledWith("campaigns");
  });

  it("throws on error", async () => {
    mockAuthedUser();
    rejectWith(new Error("DB error"));
    await expect(listMyCampaigns()).rejects.toThrow("DB error");
  });
});

describe("getCampaign", () => {
  it("returns null when not found", async () => {
    resolveWith(null);
    mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    const result = await getCampaign("nonexistent");
    expect(result).toBeNull();
  });

  it("fetches a campaign with offers", async () => {
    const fakeCampaign = { id: "c1", business_id: "biz-1", title: "Test", description: null, city: null, status: "published", created_at: "2026-01-01", updated_at: "2026-01-01" };
    resolveWith(fakeCampaign);
    mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve({ data: fakeCampaign, error: null }));
    mockBuilder.eq.mockReturnValue(mockBuilder);

    const result = await getCampaign("c1");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("c1");
  });
});

describe("createCampaign", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createCampaign({ title: "Test" })).rejects.toThrow("You must be logged in");
  });

  it("throws on short title", async () => {
    mockAuthedUser();
    await expect(createCampaign({ title: "A" })).rejects.toThrow("at least 2 characters");
  });
});

describe("createOffer", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createOffer({ campaignId: "c1", creatorId: "u2" })).rejects.toThrow("You must be logged in");
  });
});

describe("updateOfferStatus", () => {
  it("updates the offer status", async () => {
    const fakeOffer = { id: "o1", campaign_id: "c1", business_id: "b1", creator_id: "u1", status: "accepted", private_terms: null, created_at: "2026-01-01", updated_at: "2026-01-01" };
    resolveWith(fakeOffer);
    mockBuilder.single.mockImplementation(() => Promise.resolve({ data: fakeOffer, error: null }));
    mockBuilder.eq.mockReturnValue(mockBuilder);

    const result = await updateOfferStatus("o1", "accepted");
    expect(result.status).toBe("accepted");
    expect(mockBuilder.update).toHaveBeenCalledWith({ status: "accepted" });
  });

  it("throws on error", async () => {
    rejectWith(new Error("DB error"));
    await expect(updateOfferStatus("o1", "accepted")).rejects.toThrow("DB error");
  });
});
