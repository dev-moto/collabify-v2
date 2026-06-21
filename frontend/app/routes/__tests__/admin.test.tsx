import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Admin from "~/routes/admin";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  Mock definitions — vi.hoisted is evaluated before vi.mock factory  */
/* ------------------------------------------------------------------ */

const {
  mockListPendingVerifications,
  mockListAuditLogs,
  mockListReports,
  mockUpdateVerificationStatus,
  mockListVerificationDocuments,
  mockUpdateReportStatus,
  mockRecordAdminAction,
  mockGetDashboardStats,
  mockListUsers,
  mockSuspendUser,
  mockActivateUser,
  mockGetDocumentUrl,
  verifications,
  documents,
  auditLogs,
  reports,
  mockUsers,
  dashboardStats,
} = vi.hoisted(() => {
  const dashboardStats = {
    total_users: 10,
    total_creators: 4,
    total_businesses: 6,
    total_suspended: 1,
    pending_verifications: 2,
    open_reports: 2,
  };

  const verifications = [
    { id: "biz-1", business_name: "Acme Corp", industry: "Technology", city: "Manila", verification_status: "pending" as const, is_discoverable: false, updated_at: "2026-06-18T00:00:00Z" },
    { id: "biz-2", business_name: "Belle Fashion", industry: "Fashion", city: "Cebu", verification_status: "pending" as const, is_discoverable: false, updated_at: "2026-06-19T00:00:00Z" },
  ];

  const documents = [
    { id: "doc-1", business_id: "biz-1", document_type: "dti_registration", storage_path: "biz-1/dti.pdf", status: "pending" as const, uploaded_at: "2026-06-18T00:00:00Z" },
    { id: "doc-2", business_id: "biz-1", document_type: "business_permit", storage_path: "biz-1/permit.pdf", status: "pending" as const, uploaded_at: "2026-06-18T00:00:00Z" },
  ];

  const auditLogs = [
    { id: "log-1", actor_id: "admin-1", action: "Approved verification for Acme Corp", target_table: "verification_documents", target_id: "biz-1", metadata: {}, created_at: "2026-06-19T00:00:00Z" },
    { id: "log-2", actor_id: "admin-1", action: "Resolved report report-1", target_table: "reports", target_id: "report-1", metadata: {}, created_at: "2026-06-19T01:00:00Z" },
  ];

  const reports = [
    { id: "report-1", reporter_id: "user-1", reported_user_id: "user-2", reason: "Spam", details: "Sending spam messages", status: "open" as const, created_at: "2026-06-18T00:00:00Z", updated_at: "2026-06-18T00:00:00Z" },
    { id: "report-2", reporter_id: "user-3", reported_user_id: "user-4", reason: "Inappropriate content", details: null, status: "reviewing" as const, created_at: "2026-06-17T00:00:00Z", updated_at: "2026-06-18T00:00:00Z" },
  ];

  const mockUsers = [
    { id: "u-1", display_name: "Alice", role: "creator" as const, city: "Manila", status: "active" as const, is_admin: false, created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" },
    { id: "u-2", display_name: "Bob", role: "business" as const, city: "Cebu", status: "suspended" as const, is_admin: false, created_at: "2026-06-02T00:00:00Z", updated_at: "2026-06-02T00:00:00Z" },
    { id: "u-3", display_name: "Carol", role: "creator" as const, city: null, status: "active" as const, is_admin: true, created_at: "2026-06-03T00:00:00Z", updated_at: "2026-06-03T00:00:00Z" },
  ];

  return {
    mockListPendingVerifications:   vi.fn(() => Promise.resolve(verifications)),
    mockListAuditLogs:              vi.fn(() => Promise.resolve(auditLogs)),
    mockListReports:                vi.fn(() => Promise.resolve(reports)),
    mockUpdateVerificationStatus:   vi.fn(() => Promise.resolve(undefined)),
    mockListVerificationDocuments:  vi.fn(() => Promise.resolve(documents)),
    mockUpdateReportStatus:         vi.fn(() => Promise.resolve(undefined)),
    mockRecordAdminAction:          vi.fn(() => Promise.resolve(undefined)),
    mockGetDashboardStats:          vi.fn(() => Promise.resolve(dashboardStats)),
    mockListUsers:                  vi.fn(() => Promise.resolve(mockUsers)),
    mockSuspendUser:                vi.fn(() => Promise.resolve(undefined)),
    mockActivateUser:               vi.fn(() => Promise.resolve(undefined)),
    mockGetDocumentUrl:             vi.fn(() => Promise.resolve("https://example.com/doc.pdf")),
    verifications,
    documents,
    auditLogs,
    reports,
    mockUsers,
    dashboardStats,
  };
});

vi.mock("~/services/adminService", () => ({
  listPendingVerifications:   mockListPendingVerifications,
  listAuditLogs:              mockListAuditLogs,
  listReports:                mockListReports,
  updateVerificationStatus:   mockUpdateVerificationStatus,
  listVerificationDocuments:  mockListVerificationDocuments,
  updateReportStatus:         mockUpdateReportStatus,
  recordAdminAction:          mockRecordAdminAction,
  getDashboardStats:          mockGetDashboardStats,
  listUsers:                  mockListUsers,
  suspendUser:                mockSuspendUser,
  activateUser:               mockActivateUser,
}));

vi.mock("~/services/verificationService", () => ({
  getDocumentUrl:             mockGetDocumentUrl,
}));

/* Reset all mocks before each test (clear call history + restore default impl) */
beforeEach(() => {
  for (const mock of [
    mockListPendingVerifications,
    mockListAuditLogs,
    mockListReports,
    mockUpdateVerificationStatus,
    mockListVerificationDocuments,
    mockUpdateReportStatus,
    mockRecordAdminAction,
    mockGetDashboardStats,
    mockListUsers,
    mockSuspendUser,
    mockActivateUser,
    mockGetDocumentUrl,
  ]) {
    mock.mockReset();
  }
  mockListPendingVerifications.mockImplementation(() => Promise.resolve(verifications));
  mockListAuditLogs.mockImplementation(() => Promise.resolve(auditLogs));
  mockListReports.mockImplementation(() => Promise.resolve(reports));
  mockUpdateVerificationStatus.mockImplementation(() => Promise.resolve(undefined));
  mockListVerificationDocuments.mockImplementation(() => Promise.resolve(documents));
  mockUpdateReportStatus.mockImplementation(() => Promise.resolve(undefined));
  mockRecordAdminAction.mockImplementation(() => Promise.resolve(undefined));
  mockGetDashboardStats.mockImplementation(() => Promise.resolve(dashboardStats));
  mockListUsers.mockImplementation(() => Promise.resolve(mockUsers));
  mockSuspendUser.mockImplementation(() => Promise.resolve(undefined));
  mockActivateUser.mockImplementation(() => Promise.resolve(undefined));
  mockGetDocumentUrl.mockImplementation(() => Promise.resolve("https://example.com/doc.pdf"));
});

/* ------------------------------------------------------------------ */
/*  Fixtures (outside vi.hoisted — not needed by vi.mock factory)     */
/* ------------------------------------------------------------------ */

const baseSessionState = {
  status: "authenticated" as const,
  profileStatus: "ready" as const,
  user: { id: "admin-1" },
  profile: {
    id: "admin-1",
    role: "admin" as const,
    display_name: "Admin User",
    onboarding_completed: true,
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

/** Click a tab button to navigate to a section. */
async function clickTab(tabName: string) {
  const user = userEvent.setup();
  const tab = await screen.findByRole("button", { name: tabName });
  await user.click(tab);
}

/* ------------------------------------------------------------------ */
/*  Happy-path tests — run BEFORE loading/error tests                   */
/*  (Reordering avoids test-interaction pollution from mockRejectedValue) */
/* ------------------------------------------------------------------ */

it("mock verification test", async () => {
  const result = await mockGetDashboardStats();
  expect(result).toEqual(dashboardStats);
});

it("shows dashboard tab by default", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Total users")).toBeInTheDocument();
  });
});

it("renders all tab buttons", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Verifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reports" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Audit Logs" })).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Dashboard tab                                                      */
/* ------------------------------------------------------------------ */

it("renders dashboard stat cards with counts", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Total users")).toBeInTheDocument();
    expect(screen.getByText("Creators")).toBeInTheDocument();
    expect(screen.getByText("Businesses")).toBeInTheDocument();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.getByText("Pending verifications")).toBeInTheDocument();
    expect(screen.getByText("Open reports")).toBeInTheDocument();
    // Check values — "2" appears 3× (nav badge + Pending verifications + Open reports)
    expect(screen.getAllByText("10")).toBeDefined();
    expect(screen.getAllByText("4")).toBeDefined();
    expect(screen.getAllByText("6")).toBeDefined();
    expect(screen.getAllByText("1")).toBeDefined();
    expect(screen.getAllByText("2")).toHaveLength(3);
  });
});

/* ------------------------------------------------------------------ */
/*  Verifications tab                                                  */
/* ------------------------------------------------------------------ */

describe("Verifications tab", () => {
  it("renders verification review cards with business names", async () => {

    render();
    await clickTab("Verifications");
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
    await clickTab("Verifications");
    await waitFor(() => {
      const badges = screen.getAllByText("Needs review");
      expect(badges).toHaveLength(2);
    });
  });

  it("shows all clear when no verifications", async () => {
    mockListPendingVerifications.mockResolvedValue([]);
    render();
    await clickTab("Verifications");
    await waitFor(() => {
      expect(screen.getByText("All clear")).toBeInTheDocument();
      expect(screen.getByText("No pending verification requests.")).toBeInTheDocument();
    });
  });

  it("expands to show documents when clicking a business card", async () => {
    render();
    await clickTab("Verifications");
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Acme Corp"));

    await waitFor(() => {
      expect(mockListVerificationDocuments).toHaveBeenCalledWith("biz-1");
      expect(screen.getByText("dti registration")).toBeInTheDocument();
      expect(screen.getByText("business permit")).toBeInTheDocument();
    });
  });

  it("approves a verification and refreshes data", async () => {
    render();
    await clickTab("Verifications");
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Acme Corp"));
    await waitFor(() => {
      expect(screen.getByText("dti registration")).toBeInTheDocument();
    });

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
    render();
    await clickTab("Verifications");
    await waitFor(() => {
      expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(screen.getByText("Acme Corp"));
    await waitFor(() => {
      expect(screen.getByText("dti registration")).toBeInTheDocument();
    });

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
});

/* ------------------------------------------------------------------ */
/*  Reports tab                                                        */
/* ------------------------------------------------------------------ */

describe("Reports tab", () => {
  it("renders report cards with reason and status", async () => {
    render();
    await clickTab("Reports");
    await waitFor(() => {
      expect(screen.getByText("Spam")).toBeInTheDocument();
      expect(screen.getByText("Inappropriate content")).toBeInTheDocument();
      // "Open" appears on both the filter button and the status badge
      expect(screen.getAllByText("Open").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("Reviewing")).toBeInTheDocument();
      expect(screen.getByText("Sending spam messages")).toBeInTheDocument();
    });
  });

  it("shows no reports message when reports are empty", async () => {
    mockListReports.mockResolvedValue([]);
    render();
    await clickTab("Reports");
    await waitFor(() => {
      expect(screen.getByText("No reports")).toBeInTheDocument();
    });
  });

  it("resolves a report", async () => {
    render();
    await clickTab("Reports");
    await waitFor(() => {
      expect(screen.getByText("Spam")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const resolveBtns = screen.getAllByRole("button", { name: /^resolve$/i });
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
    render();
    await clickTab("Reports");
    await waitFor(() => {
      expect(screen.getByText("Spam")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const dismissBtns = screen.getAllByRole("button", { name: /^dismiss$/i });
    await user.click(dismissBtns[0]);

    await waitFor(() => {
      expect(mockUpdateReportStatus).toHaveBeenCalledWith("report-1", "dismissed");
      expect(mockRecordAdminAction).toHaveBeenCalledWith(
        "Dismissed report report-1",
        expect.objectContaining({ report_id: "report-1" }),
      );
    });
  });

  it("filters reports by status", async () => {
    render();
    await clickTab("Reports");
    await waitFor(() => {
      expect(screen.getByText("Spam")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    // Click "All" filter
    await user.click(screen.getByRole("button", { name: "All" }));

    await waitFor(() => {
      // The listReports should have been called with "" (no filter)
      expect(mockListReports).toHaveBeenCalledWith("");
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Users tab                                                          */
/* ------------------------------------------------------------------ */

describe("Users tab", () => {
  it("renders user table with user data", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      expect(screen.getByText("User management")).toBeInTheDocument();
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Carol")).toBeInTheDocument();
    });
  });

  it("shows role badges for each user", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      // "creator" appears on both Alice and Carol
      const creatorBadges = screen.getAllByText("creator");
      expect(creatorBadges).toHaveLength(2);
      expect(screen.getByText("business")).toBeInTheDocument();
    });
  });

  it("shows status badges", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      const activeBadges = screen.getAllByText("active");
      expect(activeBadges.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("suspended")).toBeInTheDocument();
    });
  });

  it("shows admin badge for admin users", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      // "Admin" appears both as a nav link and a badge on Carol's row
      const adminElements = screen.getAllByText("Admin");
      expect(adminElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("shows Suspend button for active users", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const suspendBtns = screen.getAllByRole("button", { name: /suspend/i });
    expect(suspendBtns.length).toBeGreaterThanOrEqual(2); // Alice + Carol
  });

  it("shows Activate button for suspended users", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /activate/i })).toBeInTheDocument();
  });

  it("calls suspendUser when Suspend is clicked", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const suspendBtns = screen.getAllByRole("button", { name: /suspend/i });
    await user.click(suspendBtns[0]);

    await waitFor(() => {
      expect(mockSuspendUser).toHaveBeenCalledWith("u-1");
      expect(mockRecordAdminAction).toHaveBeenCalledWith(
        "Suspended user Alice",
        expect.objectContaining({ user_id: "u-1" }),
        "u-1",
      );
    });
  });

  it("calls activateUser when Activate is clicked", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const activateBtn = screen.getByRole("button", { name: /activate/i });
    await user.click(activateBtn);

    await waitFor(() => {
      expect(mockActivateUser).toHaveBeenCalledWith("u-2");
      expect(mockRecordAdminAction).toHaveBeenCalledWith(
        "Activated user Bob",
        expect.objectContaining({ user_id: "u-2" }),
        "u-2",
      );
    });
  });

  it("searches users when typing in search box", async () => {
    render();
    await clickTab("Users");
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText("Search users by name...");
    await user.type(searchInput, "Bob");

    // Wait for debounce
    await waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith("Bob");
    });
  });

  it("shows empty state when no users match search", async () => {
    mockListUsers.mockResolvedValue([]);
    render();
    await clickTab("Users");
    await waitFor(() => {
      expect(screen.getByText("No users")).toBeInTheDocument();
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Audit logs tab                                                     */
/* ------------------------------------------------------------------ */

describe("Audit logs tab", () => {
  it("renders audit log entries", async () => {
    render();
    await clickTab("Audit Logs");
    expect(await screen.findByText(/Approved verification for Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Resolved report report-1/)).toBeInTheDocument();
  });

  it("shows no logs message when audit logs are empty", async () => {
    mockListAuditLogs.mockResolvedValue([]);
    render();
    await clickTab("Audit Logs");
    await waitFor(() => {
      expect(screen.getByText("No logs")).toBeInTheDocument();
      expect(screen.getByText("No audit log entries yet.")).toBeInTheDocument();
    });
  });
});

/* ------------------------------------------------------------------ */
/*  Edge-case states – run LAST so they can't pollute sibling tests     */
/* ------------------------------------------------------------------ */

it("shows loading state initially", () => {
  mockGetDashboardStats.mockReturnValue(new Promise(() => {}));
  render();
  expect(screen.getByText("Loading admin panel")).toBeInTheDocument();
  expect(screen.getByText("Please wait while we load data.")).toBeInTheDocument();
});

it("shows error state when loading fails", async () => {
  mockGetDashboardStats.mockRejectedValue(new Error("Admin API error"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Admin API error")).toBeInTheDocument();
  });
});

