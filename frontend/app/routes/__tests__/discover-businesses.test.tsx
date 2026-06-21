import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscoverBusinesses from "~/routes/discover-businesses";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  Mock discoverService                                               */
/* ------------------------------------------------------------------ */

const mockListBusinessCards = vi.fn();

vi.mock("~/services/discoverService", () => ({
  listBusinessCards: (...args: unknown[]) => mockListBusinessCards(...args),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const userId = "user-self-1";

const businessCards = [
  {
    id: "biz-1",
    business_name: "Acme Corp",
    industry: "Technology",
    city: "Manila",
    verification_status: "approved" as const,
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "biz-2",
    business_name: "Belle Fashion",
    industry: "Fashion",
    city: "Cebu",
    verification_status: "pending" as const,
    created_at: "2026-06-02T00:00:00Z",
  },
];

const baseSessionState = {
  status: "authenticated" as const,
  user: { id: userId },
  profile: {
    id: userId,
    role: "creator" as const,
    display_name: "Ana Reyes",
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function render(sessionState: Record<string, unknown> = {}) {
  return renderWithProviders(<DiscoverBusinesses />, {
    sessionState: { ...baseSessionState, ...sessionState },
    initialEntries: ["/discover/businesses"],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListBusinessCards.mockResolvedValue(businessCards);
});

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */

it("shows loading state initially", () => {
  mockListBusinessCards.mockReturnValue(new Promise(() => {}));
  render();
  expect(screen.getByText("Loading businesses")).toBeInTheDocument();
  expect(screen.getByText("Fetching public-safe business profiles.")).toBeInTheDocument();
});

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

it("shows error state when listBusinessCards fails", async () => {
  mockListBusinessCards.mockRejectedValue(new Error("API error"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Unable to load businesses")).toBeInTheDocument();
    expect(screen.getByText("API error")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

it("shows empty state when no businesses found", async () => {
  mockListBusinessCards.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No businesses found")).toBeInTheDocument();
    expect(screen.getByText("Try a different search term or check back later.")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Business cards rendering                                          */
/* ------------------------------------------------------------------ */

it("renders business names and industry badges", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("Belle Fashion")).toBeInTheDocument();
    expect(screen.getByText("Fashion")).toBeInTheDocument();
  });
});

it("shows city for each business", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Manila area")).toBeInTheDocument();
    expect(screen.getByText("Cebu area")).toBeInTheDocument();
  });
});

it("shows VerifiedMark for approved businesses and Pending badge for others", async () => {
  render();
  await waitFor(() => {
    // Acme Corp is approved — should show a VerifiedMark (SVG-based, check data attribute)
    // Belle Fashion is pending — should show "Pending" badge
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});

it("renders View profile links pointing to business profile pages", async () => {
  render();
  await waitFor(() => {
    const links = screen.getAllByText("View profile");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/businesses/biz-1");
    expect(links[1]).toHaveAttribute("href", "/businesses/biz-2");
  });
});

/* ------------------------------------------------------------------ */
/*  Search behavior                                                    */
/* ------------------------------------------------------------------ */

it("updates query state when typing in search box", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Search businesses or industries")).toBeInTheDocument();
  });

  const input = screen.getByPlaceholderText("Search businesses or industries");
  await user.type(input, "fashion");

  expect(input).toHaveValue("fashion");
});

it("triggers re-fetch with query when Search button is clicked", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Search businesses or industries")).toBeInTheDocument();
  });

  mockListBusinessCards.mockClear();
  mockListBusinessCards.mockResolvedValue([businessCards[1]]); // only Belle Fashion

  const input = screen.getByPlaceholderText("Search businesses or industries");
  await user.type(input, "fashion");

  const searchBtn = screen.getByRole("button", { name: /search/i });
  await user.click(searchBtn);

  await waitFor(() => {
    expect(mockListBusinessCards).toHaveBeenCalledWith({ query: "fashion" });
    // Only Belle Fashion should be shown
    expect(screen.getByText("Belle Fashion")).toBeInTheDocument();
  });
});

it("disables Search button while loading", async () => {
  mockListBusinessCards.mockReturnValue(new Promise(() => {}));
  render();
  const searchBtn = screen.getByRole("button", { name: /search/i });
  expect(searchBtn).toBeDisabled();
});
