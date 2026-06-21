import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Admin from "~/routes/admin";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  Mock services                                                      */
/* ------------------------------------------------------------------ */

const {
  mockListPendingVerifications,
  mockListAuditLogs,
  mockListReports,
  mockUpdateVerificationStatus,
  mockListVerificationDocuments,
  mockUpdateReportStatus,
  mockRecordAdminAction,
  mockGetDocumentUrl,
} = vi.hoisted(() => ({
  mockListPendingVerifications: vi.fn(),
  mockListAuditLogs: vi.fn(),
  mockListReports: vi.fn(),
  mockUpdateVerificationStatus: vi.fn(),
  mockListVerificationDocuments: vi.fn(),
  mockUpdateReportStatus: vi.fn(),
  mockRecordAdminAction: vi.fn(),
  mockGetDocumentUrl: vi.fn(),
}));

vi.mock("~/services/adminService", () => ({
  listPendingVerifications: (...args: unknown[]) => mockListPendingVerifications(...args),
  listAuditLogs: (...args: unknown[]) => mockListAuditLogs(...args),
  listReports: (...args: unknown[]) => mockListReports(...args),
  updateVerificationStatus: (...args: unknown[]) => mockUpdateVerificationStatus(...args),
  listVerificationDocuments: (...args: unknown[]) => mockListVerificationDocuments(...args),
  updateReportStatus: (...args: unknown[]) => mockUpdateReportStatus(...args),
  recordAdminAction: (...args: unknown[]) => mockRecordAdminAction(...args),
}));

vi.mock("~/services/verificationService", () => ({
  getDocumentUrl: (...args: unknown[]) => mockGetDocumentUrl(...args),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const userId = "admin-1";

const verifications = [
  {
    id: "biz-1",
    business_name: "Acme Corp",
    industry: "Technology",
    city: "Manila",
    verification_status: "pending" as const,
    is_discoverable: false,
    updated_at: "2026-06-18T00:00:00Z",
  },
  {
    id: "biz-2",
    business_name: "Belle Fashion",
    industry: "Fashion",
    city: "Cebu",
    verification_status: "pending" as const,
    is_discoverable: false,
    updated_at: "2026-06-19T00:00:00Z",
  },
];

const documents = [
  { id: "doc-1", business_id: "biz-1", document_type: "dti_registration", storage_path: "biz-1/dti.pdf", status: "pending" as const, uploaded_at: "2026-06-18T00:00:00Z" },
  { id: "doc-2", business_id: "biz-1", document_type: "business_permit", storage_path: "biz-1/permit.pdf", status: "pending" as const, uploaded_at: "2026-06-18T00:00:00Z" },
];

const auditLogs = [
  { id: "log-1", actor_id: userId, action: "Approved verification for Acme Corp", target_table: "verification_documents", target_id: "biz-1", metadata: {}, created_at: "2026-06-19T00:00:00Z" },
  { id: "log-2", actor_id: userId, action: "Resolved report report-1", target_table: "reports", target_id: "report-1", metadata: {}, created_at: "2026-06-19T01:00:00Z" },
];

const reports = [
  { id: "report-1", reporter_id: "user-1", reported_user_id: "user-2", reason: "Spam", details: "Sending spam messages", status: "open" as const, created_at: "2026-06-18T00:00:00Z", updated_at: "2026-06-18T00:00:00Z" },
  { id: "report-2", reporter_id: "user-3", reported_user_id: "user-4", reason: "Inappropriate content", details: null, status: "reviewing" as const, created_at: "2026-06-17T00:00:00Z", updated_at: "2026-06-18T00:00:00Z" },
];

const baseSessionState = {
  status: "authenticated" as const,
  user: { id: userId },
  profile: {
    id: userId,
    role: "admin" as const,
    display_name: "Admin User",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function render(sessionState: Record<string, unknown> = {}) {
  return renderWithProviders(<Admin />, {
    sessionState: { ...baseSessionState, ...sessionState },
    initialEntries: ["/admin"],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListPendingVerifications.mockResolvedValue(verifications);
  mockListAuditLogs.mockResolvedValue(auditLogs);
  mockListReports.mockResolvedValue(reports);
  mockUpdateVerificationStatus.mockResolvedValue(undefined);
  mockListVerificationDocuments.mockResolvedValue(documents);
  mockUpdateReportStatus.mockResolvedValue(undefined);
  mockRecordAdminAction.mockResolvedValue(undefined);
  mockGetDocumentUrl.mockResolvedValue("https://example.com/doc.pdf");
});

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */

it("shows loading state initially", () => {
  mockListPendingVerifications.mockReturnValue(new Promise(() => {}));
  render();
  expect(screen.getByText("Loading admin panel")).toBeInTheDocument();
  expect(screen.getByText("Please wait while we load data.")).toBeInTheDocument();
});

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

it("shows error state when loading fails", async () => {
  mockListPendingVerifications.mockRejectedValue(new Error("Admin API error"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Admin API error")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Stat bar                                                           */
/* ------------------------------------------------------------------ */

it("renders stat cards with counts", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Pending verifications")).toBeInTheDocument();
    expect(screen.getByText("Open reports")).toBeInTheDocument();
    expect(screen.getByText("Moderation queue")).toBeInTheDocument();
    expect(screen.getByText("Audit events")).toBeInTheDocument();
    // All 4 stats show "2" (2 verifications, 2 reports, 2 moderation, 2 audit events)
    const twos = screen.getAllByText("2");
    expect(twos.length).toBeGreaterThanOrEqual(4);
  });
});

/* ------------------------------------------------------------------ */
/*  Verification review section                                        */
/* ------------------------------------------------------------------ */

it("renders verification review cards with business names", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Verification review")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Belle Fashion")).toBeInTheDocument();
    expect(screen.getByText("Technology · Manila")).toBeInTheDocument();
    expect(screen.getByText("Fashion · Cebu")).toBeInTheDocument();
  });
});

it("shows Needs review badge for pending verifications", async () => {
  render();
  await waitFor(() => {
    const badges = screen.getAllByText("Needs review");
    expect(badges).toHaveLength(2);
  });
});

it("shows all clear when no verifications", async () => {
  mockListPendingVerifications.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("All clear")).toBeInTheDocument();
    expect(screen.getByText("No pending verification requests.")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Document expansion                                                 */
/* ------------------------------------------------------------------ */

it("expands to show documents when clicking a business card", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  const acmeCard = screen.getByText("Acme Corp");
  await user.click(acmeCard);

  await waitFor(() => {
    expect(mockListVerificationDocuments).toHaveBeenCalledWith("biz-1");
    expect(screen.getByText("dti registration")).toBeInTheDocument();
    expect(screen.getByText("business permit")).toBeInTheDocument();
  });
});

it("shows document status badges", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Acme Corp"));

  await waitFor(() => {
    const pendingBadges = screen.getAllByText("Pending");
    expect(pendingBadges.length).toBeGreaterThanOrEqual(2);
  });
});

it("shows View link for documents with signed URLs", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Acme Corp"));

  await waitFor(() => {
    const viewLinks = screen.getAllByText("View");
    expect(viewLinks.length).toBeGreaterThanOrEqual(1);
    expect(viewLinks[0]).toHaveAttribute("href", "https://example.com/doc.pdf");
  });
});

it("shows No preview when document URL is empty", async () => {
  mockGetDocumentUrl.mockResolvedValue("");
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Acme Corp"));

  await waitFor(() => {
    expect(screen.getAllByText("No preview").length).toBeGreaterThanOrEqual(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Approve / Reject actions                                           */
/* ------------------------------------------------------------------ */

it("approves a verification and refreshes data", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  // Expand first
  await user.click(screen.getByText("Acme Corp"));
  await waitFor(() => {
    expect(screen.getByText("dti registration")).toBeInTheDocument();
  });

  // Click Approve
  const approveBtn = screen.getByRole("button", { name: /approve/i });
  await user.click(approveBtn);

  await waitFor(() => {
    expect(mockUpdateVerificationStatus).toHaveBeenCalledWith("biz-1", "approved");
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      "Approved verification for Acme Corp",
      expect.objectContaining({ business_id: "biz-1", new_status: "approved" }),
    );
  });
});

it("rejects a verification and refreshes data", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  // Expand first
  await user.click(screen.getByText("Acme Corp"));
  await waitFor(() => {
    expect(screen.getByText("dti registration")).toBeInTheDocument();
  });

  // Click Reject
  const rejectBtn = screen.getByRole("button", { name: /reject/i });
  await user.click(rejectBtn);

  await waitFor(() => {
    expect(mockUpdateVerificationStatus).toHaveBeenCalledWith("biz-1", "rejected");
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      "Rejected verification for Acme Corp",
      expect.objectContaining({ business_id: "biz-1", new_status: "rejected" }),
    );
  });
});

it("disables approve/reject buttons while action is loading", async () => {
  mockUpdateVerificationStatus.mockReturnValue(new Promise(() => {}));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Acme Corp"));
  await waitFor(() => {
    expect(screen.getByText("dti registration")).toBeInTheDocument();
  });

  const approveBtn = screen.getByRole("button", { name: /approve/i });
  await user.click(approveBtn);

  await waitFor(() => {
    expect(approveBtn).toBeDisabled();
  });
});

it("shows action error when approve fails", async () => {
  mockUpdateVerificationStatus.mockRejectedValue(new Error("Approve failed"));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
  });

  await user.click(screen.getByText("Acme Corp"));
  await waitFor(() => {
    expect(screen.getByText("dti registration")).toBeInTheDocument();
  });

  const approveBtn = screen.getByRole("button", { name: /approve/i });
  await user.click(approveBtn);

  await waitFor(() => {
    expect(screen.getByText("Approve failed")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Reports section                                                    */
/* ------------------------------------------------------------------ */

it("renders report cards with reason and status", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Spam")).toBeInTheDocument();
    expect(screen.getByText("Inappropriate content")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getByText("Reviewing")).toBeInTheDocument();
    expect(screen.getByText("Sending spam messages")).toBeInTheDocument();
    expect(screen.getByText("No details")).toBeInTheDocument();
  });
});

it("shows no reports message when reports are empty", async () => {
  mockListReports.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No reports")).toBeInTheDocument();
    expect(screen.getByText("No open reports at this time.")).toBeInTheDocument();
  });
});

it("resolves a report", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Spam")).toBeInTheDocument();
  });

  // Both reports have Resolve buttons; click the first one
  const resolveBtns = screen.getAllByRole("button", { name: /resolve/i });
  await user.click(resolveBtns[0]);

  await waitFor(() => {
    expect(mockUpdateReportStatus).toHaveBeenCalledWith("report-1", "resolved");
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      "Resolved report report-1",
      expect.objectContaining({ report_id: "report-1" }),
    );
  });
});

it("dismisses a report", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Spam")).toBeInTheDocument();
  });

  // Get the Dismiss button for the first report
  const dismissBtns = screen.getAllByRole("button", { name: /dismiss/i });
  await user.click(dismissBtns[0]);

  await waitFor(() => {
    expect(mockUpdateReportStatus).toHaveBeenCalledWith("report-1", "dismissed");
    expect(mockRecordAdminAction).toHaveBeenCalledWith(
      "Dismissed report report-1",
      expect.objectContaining({ report_id: "report-1" }),
    );
  });
});

it("disables resolve/dismiss buttons while action is loading", async () => {
  mockUpdateReportStatus.mockReturnValue(new Promise(() => {}));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Spam")).toBeInTheDocument();
  });

  const resolveBtns = screen.getAllByRole("button", { name: /resolve/i });
  await user.click(resolveBtns[0]);

  await waitFor(() => {
    expect(resolveBtns[0]).toBeDisabled();
  });
});

it("shows action error when resolve fails", async () => {
  mockUpdateReportStatus.mockRejectedValue(new Error("Resolve failed"));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByText("Spam")).toBeInTheDocument();
  });

  const resolveBtns = screen.getAllByRole("button", { name: /resolve/i });
  await user.click(resolveBtns[0]);

  await waitFor(() => {
    expect(screen.getByText("Resolve failed")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Audit logs section                                                 */
/* ------------------------------------------------------------------ */

it("renders audit log entries with actions", async () => {
  render();
  // Audit log items have " · verification_documents" appended — use regex for partial match
  expect(await screen.findByText(/Approved verification for Acme Corp/)).toBeInTheDocument();
  expect(screen.getByText(/Resolved report report-1/)).toBeInTheDocument();
});

it("shows no logs message when audit logs are empty", async () => {
  mockListAuditLogs.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No logs")).toBeInTheDocument();
    expect(screen.getByText("No audit log entries yet.")).toBeInTheDocument();
  });
});
