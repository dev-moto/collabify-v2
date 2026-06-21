import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mock supabase module                                                */
/* ------------------------------------------------------------------ */

let resolveValue: { data: unknown; error: unknown } = { data: [], error: null };

function createBuilder() {
  function builder(): Promise<{ data: unknown; error: unknown }> {
    return Promise.resolve(resolveValue);
  }
  builder.then = (
    onfulfilled: (v: { data: unknown; error: unknown }) => unknown,
    onrejected?: (e: unknown) => unknown,
  ) => Promise.resolve(resolveValue).then(onfulfilled, onrejected);
  builder.catch = (onrejected: (e: unknown) => unknown) => Promise.resolve(resolveValue).catch(onrejected);
  builder.finally = (onfinally?: () => void) => Promise.resolve(resolveValue).finally(onfinally);

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => builder);
  builder.single = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.returns = vi.fn(() => builder);
  return builder;
}

const mockBuilder = createBuilder();

const { mockFrom, mockGetUser, mockStorage } = vi.hoisted(() => ({
  mockFrom: vi.fn(() => mockBuilder),
  mockGetUser: vi.fn(),
  mockStorage: {
    from: vi.fn(),
  },
}));

vi.mock("~/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getUser: mockGetUser,
    },
    storage: mockStorage,
  },
}));

/* ------------------------------------------------------------------ */
/*  Import after mocks                                                  */
/* ------------------------------------------------------------------ */

import {
  getBusinessProfile,
  listMyVerificationDocuments,
  submitVerificationDocument,
  markVerificationPending,
  getDocumentUrl,
} from "~/services/verificationService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function resetBuilder() {
  vi.clearAllMocks();
  resolveValue = { data: [], error: null };

  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.order.mockReturnValue(mockBuilder);
  mockBuilder.maybeSingle.mockReturnValue(mockBuilder);
  mockBuilder.single.mockReturnValue(mockBuilder);
  mockBuilder.insert.mockReturnValue(mockBuilder);
  mockBuilder.update.mockReturnValue(mockBuilder);
  mockBuilder.returns.mockReturnValue(mockBuilder);

  // Default storage mock
  mockStorage.from.mockReturnValue({
    upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
    remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.test/doc.pdf" }, error: null }),
  });
}

function resolveWith(data: unknown) {
  resolveValue = { data, error: null };
}

function rejectWith(error: Error) {
  resolveValue = { data: null, error };
}

function mockAuthedUser(userId = "biz-123") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

beforeEach(() => {
  resetBuilder();
  resolveWith([]);
});

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("getBusinessProfile", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(getBusinessProfile()).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, auth: { getUser: mockGetUser }, storage: mockStorage };
    resetBuilder();
    resolveWith([]);
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getBusinessProfile()).rejects.toThrow("You must be logged in");
  });

  it("returns null when no business profile exists", async () => {
    mockAuthedUser();
    resolveWith(null);
    mockBuilder.maybeSingle.mockReturnValue(mockBuilder);
    const result = await getBusinessProfile();
    expect(result).toBeNull();
  });

  it("returns business profile when found", async () => {
    mockAuthedUser("biz-123");
    const fakeProfile = {
      id: "biz-123",
      business_name: "Sunrise Cafe",
      industry: "Food",
      city: "Cebu",
      verification_status: "unsubmitted" as const,
      is_discoverable: true,
    };
    resolveWith(fakeProfile);
    mockBuilder.maybeSingle.mockReturnValue(mockBuilder);
    const result = await getBusinessProfile();
    expect(result).toEqual(fakeProfile);
    expect(mockFrom).toHaveBeenCalledWith("business_profiles");
  });
});

describe("listMyVerificationDocuments", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(listMyVerificationDocuments()).rejects.toThrow("You must be logged in");
  });

  it("returns documents array", async () => {
    mockAuthedUser("biz-123");
    const fakeDocs = [
      { id: "doc-1", business_id: "biz-123", storage_bucket: "verification-documents", storage_path: "biz-123/dti.pdf", document_type: "dti_registration", status: "pending", reviewed_by: null, reviewed_at: null, created_at: "2026-01-01" },
    ];
    resolveWith(fakeDocs);
    const result = await listMyVerificationDocuments();
    expect(result).toEqual(fakeDocs);
    expect(mockFrom).toHaveBeenCalledWith("verification_documents");
  });
});

describe("submitVerificationDocument", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(submitVerificationDocument(new File([], "test.pdf"), "dti_registration")).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, auth: { getUser: mockGetUser }, storage: mockStorage };
    resetBuilder();
    resolveWith([]);
  });

  it("throws on invalid document type", async () => {
    await expect(submitVerificationDocument(new File([], "test.pdf"), "invalid" as any)).rejects.toThrow("Invalid document type");
  });

  it("throws on file too large", async () => {
    const bigFile = new File([new ArrayBuffer(11 * 1024 * 1024)], "big.pdf");
    await expect(submitVerificationDocument(bigFile, "dti_registration")).rejects.toThrow("10 MB");
  });

  it("throws on unsupported file extension", async () => {
    const badFile = new File([], "test.exe");
    await expect(submitVerificationDocument(badFile, "dti_registration")).rejects.toThrow("not supported");
  });

  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(submitVerificationDocument(new File([], "test.pdf"), "dti_registration")).rejects.toThrow("You must be logged in");
  });

  it("uploads file and inserts document record", async () => {
    mockAuthedUser("biz-123");
    const fakeDoc = {
      id: "doc-1",
      business_id: "biz-123",
      storage_bucket: "verification-documents",
      storage_path: "biz-123/dti_registration_1234567890.pdf",
      document_type: "dti_registration",
      status: "pending",
      reviewed_by: null,
      reviewed_at: null,
      created_at: "2026-01-01",
    };

    // Storage mock
    const storageUpload = vi.fn().mockResolvedValue({ data: { path: fakeDoc.storage_path }, error: null });
    mockStorage.from.mockReturnValue({ upload: storageUpload, remove: vi.fn().mockResolvedValue({}), createSignedUrl: vi.fn() });

    // Table insert mock
    resolveWith(fakeDoc);
    mockBuilder.single.mockReturnValue(mockBuilder);

    const file = new File(["test content"], "test.pdf", { type: "application/pdf" });
    const result = await submitVerificationDocument(file, "dti_registration");

    expect(result).toEqual(fakeDoc);
    expect(mockStorage.from).toHaveBeenCalledWith("verification-documents");
    expect(storageUpload).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("verification_documents");
    expect(mockBuilder.insert).toHaveBeenCalled();
  });

  it("cleans up storage on db insert failure", async () => {
    mockAuthedUser("biz-123");

    // Storage succeeds
    const storageRemove = vi.fn().mockResolvedValue({});
    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ data: { path: "biz-123/doc.pdf" }, error: null }),
      remove: storageRemove,
      createSignedUrl: vi.fn(),
    });

    // DB insert fails — make .single() return a builder that rejects
    resolveValue = { data: null, error: new Error("DB error") };

    const file = new File(["test"], "test.pdf", { type: "application/pdf" });
    await expect(submitVerificationDocument(file, "dti_registration")).rejects.toThrow("DB error");
    expect(storageRemove).toHaveBeenCalled();
  });
});

describe("markVerificationPending", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(markVerificationPending()).rejects.toThrow("You must be logged in");
  });

  it("updates verification status to pending", async () => {
    mockAuthedUser("biz-123");
    const fakeProfile = {
      id: "biz-123",
      business_name: "Sunrise Cafe",
      industry: "Food",
      city: "Cebu",
      verification_status: "pending" as const,
      is_discoverable: true,
    };
    resolveWith(fakeProfile);
    mockBuilder.single.mockReturnValue(mockBuilder);
    mockBuilder.eq.mockReturnValue(mockBuilder);

    const result = await markVerificationPending();
    expect(result.verification_status).toBe("pending");
    expect(mockBuilder.update).toHaveBeenCalledWith({ verification_status: "pending" });
  });

  it("throws when update returns no data", async () => {
    mockAuthedUser("biz-123");
    resolveWith(null);
    mockBuilder.single.mockReturnValue(mockBuilder);
    mockBuilder.eq.mockReturnValue(mockBuilder);
    await expect(markVerificationPending()).rejects.toThrow("Could not update");
  });
});

describe("getDocumentUrl", () => {
  it("returns signed URL", async () => {
    const storageSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.test/signed" }, error: null });
    mockStorage.from.mockReturnValue({ createSignedUrl: storageSignedUrl, upload: vi.fn(), remove: vi.fn() });

    const url = await getDocumentUrl("biz-123/doc.pdf");
    expect(url).toBe("https://example.test/signed");
    expect(mockStorage.from).toHaveBeenCalledWith("verification-documents");
  });

  it("returns null on failure", async () => {
    mockStorage.from.mockReturnValue({ createSignedUrl: vi.fn().mockResolvedValue({ data: null, error: null }), upload: vi.fn(), remove: vi.fn() });
    const url = await getDocumentUrl("biz-123/doc.pdf");
    expect(url).toBeNull();
  });
});
