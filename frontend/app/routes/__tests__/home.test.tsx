import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";

import Home from "~/routes/home";
import { renderWithProviders } from "~/test/renderWithProviders";

// MarketingShell loads images and links; we just need the route component to render
describe("Home", () => {
  const baseProfile = {
    id: "1",
    role: "creator" as const,
    display_name: "Ana Reyes",
    city: "Cebu",
    status: "active" as const,
    onboarding_completed: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  function render(sessionState: Record<string, unknown> = {}) {
    return renderWithProviders(<Home />, { sessionState });
  }

  /* ------------------------------------------------------------------ */
  /*  Anonymous                                                          */
  /* ------------------------------------------------------------------ */

  it("renders Start collaborating for anonymous users", () => {
    render({ status: "anonymous", profile: null });
    // The "Start collaborating" link is in the hero section
    const startBtn = screen.getByText("Start collaborating");
    expect(startBtn).toBeInTheDocument();
    expect(startBtn.closest("a")).toHaveAttribute("href", "/signup");
  });

  it("renders I already have an account link for anonymous users", () => {
    render({ status: "anonymous", profile: null });
    const loginBtn = screen.getByText("I already have an account");
    expect(loginBtn).toBeInTheDocument();
    expect(loginBtn.closest("a")).toHaveAttribute("href", "/login");
  });

  it("renders Join Collabify in bottom CTA for anonymous users", () => {
    render({ status: "anonymous", profile: null });
    const joinBtn = screen.getByText("Join Collabify");
    expect(joinBtn).toBeInTheDocument();
    expect(joinBtn.closest("a")).toHaveAttribute("href", "/signup");
  });

  /* ------------------------------------------------------------------ */
  /*  Authenticated creator                                              */
  /* ------------------------------------------------------------------ */

  it("renders Go to Creator dashboard for authenticated creator", () => {
    render({ status: "authenticated", profile: baseProfile });
    const links = screen.getAllByText("Go to Creator dashboard");
    // Should appear in both hero CTA and bottom CTA
    expect(links.length).toBeGreaterThanOrEqual(1);
    // Check that at least one points to the creator dashboard
    const creatorLinks = links.filter((l) => l.closest("a")?.getAttribute("href") === "/creator/dashboard");
    expect(creatorLinks.length).toBeGreaterThanOrEqual(1);
  });

  /* ------------------------------------------------------------------ */
  /*  Authenticated business                                             */
  /* ------------------------------------------------------------------ */

  it("renders Go to Business dashboard for authenticated business", () => {
    render({
      status: "authenticated",
      profile: { ...baseProfile, role: "business" },
    });
    const links = screen.getAllByText("Go to Business dashboard");
    expect(links.length).toBeGreaterThanOrEqual(1);
    const bizLinks = links.filter((l) => l.closest("a")?.getAttribute("href") === "/business/dashboard");
    expect(bizLinks.length).toBeGreaterThanOrEqual(1);
  });

  /* ------------------------------------------------------------------ */
  /*  Authenticated without profile (needs onboarding)                   */
  /* ------------------------------------------------------------------ */

  it("renders Complete onboarding for authenticated user with no profile", () => {
    render({ status: "authenticated", profile: null });
    const links = screen.getAllByText("Complete onboarding");
    expect(links.length).toBeGreaterThanOrEqual(1);
    const onboardingLinks = links.filter((l) => l.closest("a")?.getAttribute("href") === "/onboarding");
    expect(onboardingLinks.length).toBeGreaterThanOrEqual(1);
  });

  it("does not show Go to Creator/Business dashboard when profile is null", () => {
    render({ status: "authenticated", profile: null });
    expect(screen.queryByText("Go to Creator dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Go to Business dashboard")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Static content exists                                              */
  /* ------------------------------------------------------------------ */

  it("renders the page title content", () => {
    render({ status: "anonymous", profile: null });
    expect(screen.getByText("Trusted creator collaborations, from discovery to deal done.")).toBeInTheDocument();
  });
});
