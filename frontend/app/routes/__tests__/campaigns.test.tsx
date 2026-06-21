import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Campaigns from "~/routes/campaigns";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  Mock campaignsService                                              */
/* ------------------------------------------------------------------ */

const mockListMyCampaigns = vi.fn();
const mockCreateCampaign = vi.fn();

vi.mock("~/services/campaignsService", () => ({
  listMyCampaigns: (...args: unknown[]) => mockListMyCampaigns(...args),
  createCampaign: (...args: unknown[]) => mockCreateCampaign(...args),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const userId = "user-self-1";

const campaigns = [
  {
    id: "camp-1",
    business_id: userId,
    title: "Summer Campaign",
    description: "Promote summer products",
    city: "Manila",
    status: "published" as const,
    offers: [
      { id: "offer-1", status: "pending" as const, campaign_id: "camp-1", creator_id: "creator-1", private_terms: null, created_at: "2026-06-01T00:00:00Z", updated_at: "2026-06-01T00:00:00Z" },
      { id: "offer-2", status: "accepted" as const, campaign_id: "camp-1", creator_id: "creator-2", private_terms: null, created_at: "2026-06-02T00:00:00Z", updated_at: "2026-06-02T00:00:00Z" },
    ],
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "camp-2",
    business_id: userId,
    title: "Draft Campaign",
    description: null,
    city: null,
    status: "draft" as const,
    offers: [],
    created_at: "2026-06-03T00:00:00Z",
    updated_at: "2026-06-03T00:00:00Z",
  },
];

const baseSessionState = {
  status: "authenticated" as const,
  user: { id: userId },
  profile: {
    id: userId,
    role: "business" as const,
    display_name: "Acme Corp",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function render(sessionState: Record<string, unknown> = {}) {
  return renderWithProviders(<Campaigns />, {
    sessionState: { ...baseSessionState, ...sessionState },
    initialEntries: ["/campaigns"],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListMyCampaigns.mockResolvedValue(campaigns);
  mockCreateCampaign.mockResolvedValue({
    id: "camp-new",
    business_id: userId,
    title: "New Campaign",
    description: "A brand new campaign",
    city: "Cebu",
    status: "draft",
    offers: [],
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  });
});

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */

it("shows loading state initially", () => {
  mockListMyCampaigns.mockReturnValue(new Promise(() => {}));
  render();
  expect(screen.getByText("Loading campaigns")).toBeInTheDocument();
  expect(screen.getByText("Please wait while we load your campaigns.")).toBeInTheDocument();
});

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

it("shows error state when listMyCampaigns fails", async () => {
  mockListMyCampaigns.mockRejectedValue(new Error("Database error"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Database error")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

it("shows empty state when no campaigns exist", async () => {
  mockListMyCampaigns.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No campaigns yet")).toBeInTheDocument();
    expect(screen.getByText("Create your first campaign draft to get started.")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Campaign cards rendering                                           */
/* ------------------------------------------------------------------ */

it("renders campaign titles and status badges", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Summer Campaign")).toBeInTheDocument();
    expect(screen.getByText("Draft Campaign")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });
});

it("shows description, city, and offer count for campaigns", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText(/Promote summer products/)).toBeInTheDocument();
    expect(screen.getByText(/Manila/)).toBeInTheDocument();
    expect(screen.getByText(/2 offers/)).toBeInTheDocument();
    expect(screen.getByText(/No description/)).toBeInTheDocument();
  });
});

it("renders offer status badges", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("accepted")).toBeInTheDocument();
  });
});

it("renders progress bar for campaign offers", async () => {
  render();
  await waitFor(() => {
    const progressBars = screen.getAllByRole("progressbar", { name: /campaign progress/i });
    expect(progressBars).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/*  Campaign creation                                                  */
/* ------------------------------------------------------------------ */

it("shows the create campaign form", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Create offer draft")).toBeInTheDocument();
    expect(screen.getByLabelText("Campaign title")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("City (optional)")).toBeInTheDocument();
  });
});

it("creates a campaign and prepends it to the list", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Campaign title")).toBeInTheDocument();
  });

  const titleInput = screen.getByLabelText("Campaign title");
  await user.type(titleInput, "New Campaign");

  const descInput = screen.getByLabelText("Description");
  await user.type(descInput, "A brand new campaign");

  const cityInput = screen.getByLabelText("City (optional)");
  await user.type(cityInput, "Cebu");

  const saveBtn = screen.getByRole("button", { name: /save draft/i });
  await user.click(saveBtn);

  await waitFor(() => {
    expect(mockCreateCampaign).toHaveBeenCalledWith({
      title: "New Campaign",
      description: "A brand new campaign",
      city: "Cebu",
    });
    expect(screen.getByText("New Campaign")).toBeInTheDocument();
    expect(screen.getByText("Campaign draft saved.")).toBeInTheDocument();
  });
});

it("shows validation error when title is too short", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Campaign title")).toBeInTheDocument();
  });

  const titleInput = screen.getByLabelText("Campaign title");
  await user.type(titleInput, "A");

  const saveBtn = screen.getByRole("button", { name: /save draft/i });
  await user.click(saveBtn);

  await waitFor(() => {
    expect(screen.getByText("Campaign title must be at least 2 characters.")).toBeInTheDocument();
    expect(mockCreateCampaign).not.toHaveBeenCalled();
  });
});

it("shows error StatusPanel when createCampaign fails", async () => {
  mockCreateCampaign.mockRejectedValue(new Error("Creation failed"));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Campaign title")).toBeInTheDocument();
  });

  const titleInput = screen.getByLabelText("Campaign title");
  await user.type(titleInput, "Valid Campaign");

  const saveBtn = screen.getByRole("button", { name: /save draft/i });
  await user.click(saveBtn);

  await waitFor(() => {
    expect(screen.getByText("Creation failed")).toBeInTheDocument();
  });
});

it("disables Save draft button while creating", async () => {
  mockCreateCampaign.mockReturnValue(new Promise(() => {}));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Campaign title")).toBeInTheDocument();
  });

  const titleInput = screen.getByLabelText("Campaign title");
  await user.type(titleInput, "Valid Campaign");

  const saveBtn = screen.getByRole("button", { name: /save draft/i });
  await user.click(saveBtn);

  await waitFor(() => {
    expect(saveBtn).toBeDisabled();
    expect(saveBtn).toHaveTextContent(/saving/i);
  });
});
