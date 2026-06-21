import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mock supabase module                                                */
/* ------------------------------------------------------------------ */

let resolveValue: { data: unknown; error: unknown } = { data: [], error: null };

function createBuilder() {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  function chainable() {
    return Promise.resolve(resolveValue);
  }

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => chainable());
  builder.single = vi.fn(() => chainable());
  builder.update = vi.fn(() => builder);
  builder.upsert = vi.fn(() => builder);
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

import { updateProfile } from "~/services/profileService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function resetBuilder() {
  vi.clearAllMocks();
  resolveValue = { data: [], error: null };

  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.maybeSingle.mockImplementation(() => chainable());
  mockBuilder.single.mockImplementation(() => chainable());
  mockBuilder.update.mockReturnValue(mockBuilder);
  mockBuilder.upsert.mockReturnValue(mockBuilder);
}

function chainable() {
  return Promise.resolve(resolveValue);
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

describe("updateProfile", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(updateProfile({ display_name: "Test" })).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, auth: { getUser: mockGetUser } };
    resetBuilder();
    resolveWith([]);
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(updateProfile({ display_name: "Test" })).rejects.toThrow("You must be logged in");
  });

  it("throws on short display name", async () => {
    mockAuthedUser();
    await expect(updateProfile({ display_name: "A" })).rejects.toThrow("at least 2 characters");
  });

  it("throws when no fields provided", async () => {
    mockAuthedUser();
    await expect(updateProfile({})).rejects.toThrow("No fields to update");
  });

  it("updates display_name and returns profile", async () => {
    mockAuthedUser("user-123");
    const fakeProfile = {
      id: "user-123",
      role: "creator" as const,
      display_name: "New Name",
      city: null,
      status: "active" as const,
      onboarding_completed: true,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    resolveWith(fakeProfile);
    mockBuilder.single.mockImplementation(() => Promise.resolve({ data: fakeProfile, error: null }));
    mockBuilder.eq.mockReturnValue(mockBuilder);

    const result = await updateProfile({ display_name: "New Name" });
    expect(result.display_name).toBe("New Name");
    expect(mockBuilder.update).toHaveBeenCalledWith({ display_name: "New Name" });
  });

  it("updates city to null when empty string provided", async () => {
    mockAuthedUser("user-123");
    const fakeProfile = {
      id: "user-123",
      role: "creator" as const,
      display_name: "Test",
      city: null,
      status: "active" as const,
      onboarding_completed: true,
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    };
    resolveWith(fakeProfile);
    mockBuilder.single.mockImplementation(() => Promise.resolve({ data: fakeProfile, error: null }));
    mockBuilder.eq.mockReturnValue(mockBuilder);

    await updateProfile({ city: "" });
    expect(mockBuilder.update).toHaveBeenCalledWith({ city: null });
  });

  it("throws on error", async () => {
    mockAuthedUser();
    rejectWith(new Error("DB error"));
    await expect(updateProfile({ display_name: "Test" })).rejects.toThrow("DB error");
  });
});
