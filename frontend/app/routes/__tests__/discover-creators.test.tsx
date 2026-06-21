import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DiscoverCreators from "~/routes/discover-creators";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  Mock discoverService                                               */
/* ------------------------------------------------------------------ */

const mockListCreatorCards = vi.fn();
const mockListCities = vi.fn();

vi.mock("~/services/discoverService", () => ({
  listCreatorCards: (...args: unknown[]) => mockListCreatorCards(...args),
  listCities: (...args: unknown[]) => mockListCities(...args),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const userId = "user-self-1";

const creatorCards = [
  {
    id: "creator-1",
    display_name: "Maria Lopez",
    city: "Manila",
    niches: ["Lifestyle", "Food"],
    bio: "Manila-based lifestyle and food content creator.",
    created_at: "2026-06-01T00:00:00Z",
  },
  {
    id: "creator-2",
    display_name: "Juan Dela Cruz",
    city: "Cebu",
    niches: ["Tech"],
    bio: "Tech reviewer and gadget unboxer.",
    created_at: "2026-06-02T00:00:00Z",
  },
];

const cities = ["Manila", "Cebu", "Davao"];

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
  return renderWithProviders(<DiscoverCreators />, {
    sessionState: { ...baseSessionState, ...sessionState },
    initialEntries: ["/discover/creators"],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListCreatorCards.mockResolvedValue(creatorCards);
  mockListCities.mockResolvedValue(cities);
});

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */

it("shows loading state initially", () => {
  mockListCreatorCards.mockReturnValue(new Promise(() => {}));
  render();
  expect(screen.getByText("Loading creators")).toBeInTheDocument();
  expect(screen.getByText("Fetching public-safe profiles from discover view.")).toBeInTheDocument();
});

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

it("shows error state when listCreatorCards fails", async () => {
  mockListCreatorCards.mockRejectedValue(new Error("Network error"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Unable to load creators")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

it("shows empty state when no creators found", async () => {
  mockListCreatorCards.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No creators found")).toBeInTheDocument();
    expect(screen.getByText("Try fewer filters or a nearby city.")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Creator cards rendering                                            */
/* ------------------------------------------------------------------ */

it("renders creator names and niche badges", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Maria Lopez")).toBeInTheDocument();
    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
    expect(screen.getByText("Lifestyle")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Tech")).toBeInTheDocument();
  });
});

it("shows city for each creator", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Manila area")).toBeInTheDocument();
    expect(screen.getByText("Cebu area")).toBeInTheDocument();
  });
});

it("shows bio text with line-clamp for each creator", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Manila-based lifestyle and food content creator.")).toBeInTheDocument();
    expect(screen.getByText("Tech reviewer and gadget unboxer.")).toBeInTheDocument();
  });
});

it("renders View showcase links pointing to creator profile pages", async () => {
  render();
  await waitFor(() => {
    const links = screen.getAllByText("View showcase");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/creators/creator-1");
    expect(links[1]).toHaveAttribute("href", "/creators/creator-2");
  });
});

it("shows Public fields only badge on each card", async () => {
  render();
  await waitFor(() => {
    const badges = screen.getAllByText("Public fields only");
    expect(badges).toHaveLength(2);
  });
});

/* ------------------------------------------------------------------ */
/*  Filters behavior                                                   */
/* ------------------------------------------------------------------ */

it("updates query and city filter states when typing and selecting", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Search creators, niches, or city")).toBeInTheDocument();
  });

  const input = screen.getByPlaceholderText("Search creators, niches, or city");
  await user.type(input, "tech");

  const citySelect = screen.getByLabelText("Filter by city");
  await user.selectOptions(citySelect, "Cebu");

  expect(input).toHaveValue("tech");
  expect(citySelect).toHaveValue("Cebu");
});

it("triggers re-fetch with filters when Apply filters button is clicked", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Search creators, niches, or city")).toBeInTheDocument();
  });

  mockListCreatorCards.mockClear();
  mockListCreatorCards.mockResolvedValue([creatorCards[1]]); // only Juan Dela Cruz

  const input = screen.getByPlaceholderText("Search creators, niches, or city");
  await user.type(input, "tech");

  const citySelect = screen.getByLabelText("Filter by city");
  await user.selectOptions(citySelect, "Cebu");

  const applyBtn = screen.getByRole("button", { name: /apply filters/i });
  await user.click(applyBtn);

  await waitFor(() => {
    expect(mockListCreatorCards).toHaveBeenCalledWith({ query: "tech", city: "Cebu" });
    expect(screen.getByText("Juan Dela Cruz")).toBeInTheDocument();
  });
});

it("disables Apply filters button while loading", async () => {
  mockListCreatorCards.mockReturnValue(new Promise(() => {}));
  render();
  const applyBtn = screen.getByRole("button", { name: /apply filters/i });
  expect(applyBtn).toBeDisabled();
});

/* ------------------------------------------------------------------ */
/*  Cities dropdown                                                    */
/* ------------------------------------------------------------------ */

it("populates city filter dropdown from listCities", async () => {
  render();
  await waitFor(() => {
    const options = screen.getAllByRole("option");
    const optionTexts = options.map((o) => (o as HTMLOptionElement).value);
    expect(optionTexts).toContain("Manila");
    expect(optionTexts).toContain("Cebu");
    expect(optionTexts).toContain("Davao");
    // "All cities" is the default empty value
    expect(optionTexts).toContain("");
  });
});
