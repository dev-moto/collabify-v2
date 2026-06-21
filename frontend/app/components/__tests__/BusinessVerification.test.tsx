import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { BusinessVerification } from "~/components/BusinessVerification";
import { renderWithProviders } from "~/test/renderWithProviders";
import type { BusinessProfileExtended } from "~/services/verificationService";

/* ------------------------------------------------------------------ */
/*  Mocks                                                              */
/* ------------------------------------------------------------------ */

const mockGetBusinessProfile = vi.fn();
const mockListDocuments = vi.fn();
const mockSubmitDocument = vi.fn();
const mockMarkPending = vi.fn();

vi.mock("~/services/verificationService", () => ({
  getBusinessProfile: (...args: unknown[]) => mockGetBusinessProfile(...args),
  listMyVerificationDocuments: (...args: unknown[]) => mockListDocuments(...args),
  submitVerificationDocument: (...args: unknown[]) => mockSubmitDocument(...args),
  markVerificationPending: (...args: unknown[]) => mockMarkPending(...args),
}));

/* ------------------------------------------------------------------ */
/*  Test data                                                          */
/* ------------------------------------------------------------------ */

const baseProfile: BusinessProfileExtended = {
  id: "biz-1",
  business_name: "Sunrise Cafe PH",
  industry: "Food & Beverage",
  city: "Cebu",
  verification_status: "unsubmitted" as const,
  is_discoverable: false,
};

const sampleDocuments = [
  {
    id: "doc-1",
    business_id: "biz-1",
    storage_bucket: "verification-documents",
    storage_path: "biz-1/dti_123.pdf",
    document_type: "dti_registration",
    status: "pending" as const,
    reviewed_by: null,
    reviewed_at: null,
    created_at: "2024-06-01T00:00:00Z",
  },
  {
    id: "doc-2",
    business_id: "biz-1",
    storage_bucket: "verification-documents",
    storage_path: "biz-1/permit_456.pdf",
    document_type: "business_permit",
    status: "approved" as const,
    reviewed_by: "admin-1",
    reviewed_at: "2024-06-02T00:00:00Z",
    created_at: "2024-06-01T01:00:00Z",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function render(profile = baseProfile, docs: typeof sampleDocuments = []) {
  mockGetBusinessProfile.mockResolvedValue(profile);
  mockListDocuments.mockResolvedValue(docs);
  return renderWithProviders(
    <BusinessVerification />,
    { sessionState: { status: "authenticated" } },
  );
}

describe("BusinessVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /* ------------------------------------------------------------------ */
  /*  Loading / error / no-profile                                       */
  /* ------------------------------------------------------------------ */

  it("shows loading state initially", () => {
    // Never resolve — stay in loading
    mockGetBusinessProfile.mockReturnValue(new Promise(() => {}));
    // Don't use render() helper since it overwrites mock
    renderWithProviders(<BusinessVerification />, {
      sessionState: { status: "authenticated" },
    });
    expect(screen.getByText("Loading verification status")).toBeInTheDocument();
  });

  it("shows error state when loading fails", async () => {
    mockGetBusinessProfile.mockRejectedValue(new Error("Network error"));
    mockListDocuments.mockResolvedValue([]);
    renderWithProviders(<BusinessVerification />, {
      sessionState: { status: "authenticated" },
    });
    await waitFor(() => {
      expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });

  it("shows empty state when no business profile exists", async () => {
    mockGetBusinessProfile.mockResolvedValue(null);
    mockListDocuments.mockResolvedValue([]);
    renderWithProviders(<BusinessVerification />, {
      sessionState: { status: "authenticated" },
    });
    await waitFor(() => {
      expect(screen.getByText("No business profile")).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Status card — badge                                                */
  /* ------------------------------------------------------------------ */

  it("shows 'Not submitted' badge for unsubmitted status", async () => {
    render({ ...baseProfile, verification_status: "unsubmitted" });
    await waitFor(() => {
      expect(screen.getByText("Not submitted")).toBeInTheDocument();
    });
  });

  it("shows 'Under review' badge for pending status", async () => {
    render({ ...baseProfile, verification_status: "pending" });
    await waitFor(() => {
      expect(screen.getByText("Under review")).toBeInTheDocument();
    });
  });

  it("shows 'Approved' badge for approved status", async () => {
    render({ ...baseProfile, verification_status: "approved" });
    await waitFor(() => {
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });
  });

  it("shows 'Rejected' badge for rejected status", async () => {
    render({ ...baseProfile, verification_status: "rejected" });
    await waitFor(() => {
      expect(screen.getByText("Rejected")).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Status card — per-status message                                   */
  /* ------------------------------------------------------------------ */

  it("shows verified message for approved status", async () => {
    render({ ...baseProfile, verification_status: "approved" });
    await waitFor(() => {
      expect(
        screen.getByText(/Your business is verified/i),
      ).toBeInTheDocument();
    });
  });

  it("shows rejection message for rejected status", async () => {
    render({ ...baseProfile, verification_status: "rejected" });
    await waitFor(() => {
      expect(
        screen.getByText(/Your verification was rejected/i),
      ).toBeInTheDocument();
    });
  });

  it("shows pending under-review message for pending status", async () => {
    render({ ...baseProfile, verification_status: "pending" });
    await waitFor(() => {
      expect(
        screen.getByText(/Your documents are under review/i),
      ).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Document list                                                      */
  /* ------------------------------------------------------------------ */

  it("shows submitted documents section when documents exist", async () => {
    render(baseProfile, sampleDocuments);
    await waitFor(() => {
      expect(screen.getByText("Submitted documents")).toBeInTheDocument();
    });
    expect(screen.getByText("Dti Registration")).toBeInTheDocument();
    // "Business Permit" appears both in document list and select dropdown
    const businessPermit = screen.getAllByText("Business Permit");
    expect(businessPermit.length).toBeGreaterThanOrEqual(1);
  });

  it("shows status badges for each document", async () => {
    render(baseProfile, sampleDocuments);
    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Approved")).toBeInTheDocument();
    });
  });

  it("hides document section when no documents exist", async () => {
    render(baseProfile, []);
    await waitFor(() => {
      expect(screen.queryByText("Submitted documents")).not.toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Upload form visibility                                             */
  /* ------------------------------------------------------------------ */

  it("shows upload form for unsubmitted status", async () => {
    render({ ...baseProfile, verification_status: "unsubmitted" });
    await waitFor(() => {
      expect(screen.getByText("Submit verification documents")).toBeInTheDocument();
    });
  });

  it("shows upload form for rejected status with resubmit heading", async () => {
    render({ ...baseProfile, verification_status: "rejected" });
    await waitFor(() => {
      expect(screen.getByText("Resubmit documents")).toBeInTheDocument();
    });
  });

  it("hides upload form for pending status", async () => {
    render({ ...baseProfile, verification_status: "pending" });
    await waitFor(() => {
      expect(screen.queryByText("Submit verification documents")).not.toBeInTheDocument();
      expect(screen.queryByText("Resubmit documents")).not.toBeInTheDocument();
    });
  });

  it("hides upload form for approved status", async () => {
    render({ ...baseProfile, verification_status: "approved" });
    await waitFor(() => {
      expect(screen.queryByText("Submit verification documents")).not.toBeInTheDocument();
      expect(screen.queryByText("Resubmit documents")).not.toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Upload form — submit button is disabled when no file selected      */
  /* ------------------------------------------------------------------ */

  it("submit button is disabled when no file is selected", async () => {
    render({ ...baseProfile, verification_status: "unsubmitted" });
    await waitFor(() => {
      expect(screen.getByText("Submit verification documents")).toBeInTheDocument();
    });
    const btn = screen.getByText("Submit document").closest("button");
    expect(btn).toBeDisabled();
  });

  /* ------------------------------------------------------------------ */
  /*  Upload form — successful submit                                    */
  /* ------------------------------------------------------------------ */

  it("calls submitVerificationDocument and refreshes on successful upload", async () => {
    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    mockSubmitDocument.mockResolvedValue(sampleDocuments[0]);

    // After upload, listMyVerificationDocuments returns updated docs
    const updatedDocs = [
      { ...sampleDocuments[0], status: "pending" as const },
      ...sampleDocuments,
    ];
    mockListDocuments
      .mockResolvedValueOnce([])  // initial load
      .mockResolvedValueOnce(updatedDocs);  // after upload refresh

    render({ ...baseProfile, verification_status: "unsubmitted" }, []);

    await waitFor(() => {
      expect(screen.getByText("Submit verification documents")).toBeInTheDocument();
    });

    // Select a file
    const fileInput = screen.getByLabelText(/file/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit
    fireEvent.click(screen.getByText("Submit document"));

    await waitFor(() => {
      expect(mockSubmitDocument).toHaveBeenCalledOnce();
      expect(mockSubmitDocument).toHaveBeenCalledWith(file, "dti_registration");
    });

    // markVerificationPending was called (was unsubmitted)
    expect(mockMarkPending).toHaveBeenCalledOnce();
  });

  /* ------------------------------------------------------------------ */
  /*  Upload form — error state                                          */
  /* ------------------------------------------------------------------ */

  it("shows upload failure message when submit fails", async () => {
    const file = new File(["dummy"], "test.pdf", { type: "application/pdf" });
    mockSubmitDocument.mockRejectedValue(new Error("Upload failed. File too large."));

    render({ ...baseProfile, verification_status: "unsubmitted" }, []);

    await waitFor(() => {
      expect(screen.getByText("Submit verification documents")).toBeInTheDocument();
    });

    // Select a file
    const fileInput = screen.getByLabelText(/file/i);
    fireEvent.change(fileInput, { target: { files: [file] } });

    // Submit
    fireEvent.click(screen.getByText("Submit document"));

    await waitFor(() => {
      expect(screen.getByText("Upload failed")).toBeInTheDocument();
      expect(screen.getByText("Upload failed. File too large.")).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Business name display                                              */
  /* ------------------------------------------------------------------ */

  it("shows the business name", async () => {
    render();
    await waitFor(() => {
      expect(screen.getByText("Sunrise Cafe PH")).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  onStatusChange callback                                            */
  /* ------------------------------------------------------------------ */

  it("calls onStatusChange with verification status on load", async () => {
    const onStatusChange = vi.fn();
    mockGetBusinessProfile.mockResolvedValue(baseProfile);
    mockListDocuments.mockResolvedValue([]);

    renderWithProviders(
      <BusinessVerification onStatusChange={onStatusChange} />,
      { sessionState: { status: "authenticated" } },
    );

    await waitFor(() => {
      expect(onStatusChange).toHaveBeenCalledWith("unsubmitted");
    });
  });
});
