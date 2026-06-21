import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mock supabase module                                                */
/* ------------------------------------------------------------------ */

let resolveValue: { data: unknown; error: unknown } = { data: [], error: null };

function createBuilder() {
  // The builder is a thenable function so that `await builder` resolves.
  function builder(): Promise<{ data: unknown; error: unknown }> {
    return Promise.resolve(resolveValue);
  }
  builder.then = (onfulfilled: (v: { data: unknown; error: unknown }) => unknown, onrejected?: (e: unknown) => unknown) =>
    Promise.resolve(resolveValue).then(onfulfilled, onrejected);
  builder.catch = (onrejected: (e: unknown) => unknown) => Promise.resolve(resolveValue).catch(onrejected);
  builder.finally = (onfinally?: () => void) => Promise.resolve(resolveValue).finally(onfinally);

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
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
  listPendingVerifications,
  updateVerificationStatus,
  listAuditLogs,
  listReports,
  updateReportStatus,
  recordAdminAction,
  listVerificationDocuments,
} from "~/services/adminService";

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
  mockBuilder.limit.mockReturnValue(mockBuilder);
  mockBuilder.insert.mockReturnValue(mockBuilder);
  mockBuilder.update.mockReturnValue(mockBuilder);
  mockBuilder.returns.mockReturnValue(mockBuilder);
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

function mockAuthedUser(userId = "admin-123") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

beforeEach(() => {
  resetBuilder();
  resolveWith([]);
});

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("listPendingVerifications", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(listPendingVerifications()).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, auth: { getUser: mockGetUser } };
    resetBuilder();
    resolveWith([]);
  });

  it("queries business_profiles for unsubmitted and pending", async () => {
    resolveWith([]);
    await listPendingVerifications();
    expect(mockFrom).toHaveBeenCalledWith("business_profiles");
    expect(mockBuilder.in).toHaveBeenCalledWith("verification_status", ["unsubmitted", "pending"]);
  });

  it("returns verification items", async () => {
    const fakeItems = [
      { id: "b1", business_name: "Sunrise Cafe", industry: "Food", city: "Cebu", verification_status: "pending", is_discoverable: true, updated_at: "2026-01-01" },
    ];
    resolveWith(fakeItems);
    const result = await listPendingVerifications();
    expect(result).toEqual(fakeItems);
  });
});

describe("updateVerificationStatus", () => {
  it("updates the verification status", async () => {
    resolveWith(null);
    mockBuilder.eq.mockReturnValue(mockBuilder);
    await updateVerificationStatus("b1", "approved");
    expect(mockBuilder.update).toHaveBeenCalledWith({ verification_status: "approved" });
    expect(mockBuilder.eq).toHaveBeenCalledWith("id", "b1");
  });

  it("throws on error", async () => {
    rejectWith(new Error("DB error"));
    await expect(updateVerificationStatus("b1", "approved")).rejects.toThrow("DB error");
  });
});

describe("listAuditLogs", () => {
  it("queries audit_logs ordered by created_at desc", async () => {
    resolveWith([]);
    await listAuditLogs();
    expect(mockFrom).toHaveBeenCalledWith("audit_logs");
    expect(mockBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(mockBuilder.limit).toHaveBeenCalledWith(100);
  });

  it("returns audit log entries", async () => {
    const fakeLogs = [
      { id: "log1", actor_id: "admin-1", action: "Verified business", target_table: "business_profiles", target_id: "b1", metadata: {}, created_at: "2026-01-01" },
    ];
    resolveWith(fakeLogs);
    const result = await listAuditLogs();
    expect(result).toEqual(fakeLogs);
  });
});

describe("listReports", () => {
  it("queries reports with open and reviewing status", async () => {
    resolveWith([]);
    await listReports("open");
    expect(mockFrom).toHaveBeenCalledWith("reports");
    expect(mockBuilder.in).toHaveBeenCalledWith("status", ["open", "reviewing"]);
  });
});

describe("updateReportStatus", () => {
  it("updates report status", async () => {
    resolveWith(null);
    mockBuilder.eq.mockReturnValue(mockBuilder);
    await updateReportStatus("r1", "resolved");
    expect(mockBuilder.update).toHaveBeenCalledWith({ status: "resolved" });
  });
});

describe("recordAdminAction", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(recordAdminAction("test")).rejects.toThrow("You must be logged in");
  });

  it("inserts admin action", async () => {
    mockAuthedUser("admin-123");
    resolveWith(null);
    await recordAdminAction("Approved verification", { businessId: "b1" });
    expect(mockFrom).toHaveBeenCalledWith("admin_actions");
    expect(mockBuilder.insert).toHaveBeenCalled();
  });
});

describe("listVerificationDocuments", () => {
  it("queries verification_documents for the given business", async () => {
    resolveWith([]);
    await listVerificationDocuments("biz-1");
    expect(mockFrom).toHaveBeenCalledWith("verification_documents");
    expect(mockBuilder.eq).toHaveBeenCalledWith("business_id", "biz-1");
    expect(mockBuilder.order).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("returns documents array", async () => {
    const fakeDocs = [
      { id: "doc-1", business_id: "biz-1", storage_bucket: "verification-documents", storage_path: "biz-1/doc.pdf", document_type: "dti_registration", status: "pending", reviewed_by: null, reviewed_at: null, created_at: "2026-01-01" },
    ];
    resolveWith(fakeDocs);
    const result = await listVerificationDocuments("biz-1");
    expect(result).toEqual(fakeDocs);
  });

  it("returns empty array when data is null", async () => {
    resolveWith(null);
    const result = await listVerificationDocuments("biz-1");
    expect(result).toEqual([]);
  });

  it("throws on error", async () => {
    rejectWith(new Error("DB error"));
    await expect(listVerificationDocuments("biz-1")).rejects.toThrow("DB error");
  });
});
