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
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => chainable());
  builder.single = vi.fn(() => chainable());
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.returns = vi.fn(() => chainable());
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
  listAppointments,
  getAppointment,
  createAppointment,
  updateAppointmentStatus,
} from "~/services/appointmentsService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function resetBuilder() {
  vi.clearAllMocks();
  resolveValue = { data: [], error: null };

  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.or.mockReturnValue(mockBuilder);
  mockBuilder.order.mockReturnValue(mockBuilder);
  mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve(resolveValue));
  mockBuilder.single.mockImplementation(() => Promise.resolve(resolveValue));
  mockBuilder.insert.mockReturnValue(mockBuilder);
  mockBuilder.update.mockReturnValue(mockBuilder);
  mockBuilder.returns.mockImplementation(() => Promise.resolve(resolveValue));
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

describe("listAppointments", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(listAppointments()).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, auth: { getUser: mockGetUser } };
    resetBuilder();
    resolveWith([]);
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(listAppointments()).rejects.toThrow("You must be logged in");
  });

  it("fetches appointments for the current user", async () => {
    mockAuthedUser("user-123");
    const fakeAppts = [
      { id: "a1", business_id: "b1", creator_id: "u2", scheduled_for: "2026-06-25T10:00:00Z", status: "requested", notes: null, created_by: "u1", created_at: "2026-01-01", updated_at: "2026-01-01" },
    ];
    resolveWith(fakeAppts);
    mockBuilder.or.mockReturnValue(mockBuilder);

    const result = await listAppointments();
    expect(mockFrom).toHaveBeenCalledWith("appointments");
    expect(mockBuilder.or).toHaveBeenCalled();
    expect(result).toEqual(fakeAppts);
  });

  it("throws on error", async () => {
    mockAuthedUser();
    rejectWith(new Error("DB error"));
    await expect(listAppointments()).rejects.toThrow("DB error");
  });
});

describe("getAppointment", () => {
  it("returns null when not found", async () => {
    resolveWith(null);
    mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve({ data: null, error: null }));
    const result = await getAppointment("nonexistent");
    expect(result).toBeNull();
  });

  it("returns appointment when found", async () => {
    const fakeAppt = { id: "a1", business_id: "b1", creator_id: "u2", scheduled_for: null, status: "requested", notes: null, created_by: "u1", created_at: "2026-01-01", updated_at: "2026-01-01" };
    resolveWith(fakeAppt);
    mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve({ data: fakeAppt, error: null }));
    const result = await getAppointment("a1");
    expect(result).toEqual(fakeAppt);
  });
});

describe("createAppointment", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createAppointment({ businessId: "b1", creatorId: "u2" })).rejects.toThrow("You must be logged in");
  });

  it("creates and returns an appointment", async () => {
    mockAuthedUser("user-123");
    const fakeAppt = { id: "a1", business_id: "b1", creator_id: "u2", scheduled_for: null, notes: "Test", created_by: "user-123", status: "requested", created_at: "2026-01-01", updated_at: "2026-01-01" };
    resolveWith(fakeAppt);
    mockBuilder.single.mockImplementation(() => Promise.resolve({ data: fakeAppt, error: null }));

    const result = await createAppointment({ businessId: "b1", creatorId: "u2", notes: "Test" });
    expect(result).toEqual(fakeAppt);
    expect(mockBuilder.insert).toHaveBeenCalled();
  });
});

describe("updateAppointmentStatus", () => {
  it("updates and returns the appointment", async () => {
    const fakeAppt = { id: "a1", business_id: "b1", creator_id: "u2", scheduled_for: null, status: "accepted", notes: null, created_by: "u1", created_at: "2026-01-01", updated_at: "2026-01-01" };
    resolveWith(fakeAppt);
    mockBuilder.single.mockImplementation(() => Promise.resolve({ data: fakeAppt, error: null }));
    mockBuilder.eq.mockReturnValue(mockBuilder);

    const result = await updateAppointmentStatus("a1", "accepted");
    expect(result.status).toBe("accepted");
    expect(mockBuilder.update).toHaveBeenCalledWith({ status: "accepted" });
  });
});
