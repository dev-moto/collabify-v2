import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";

import { PublicShell } from "~/components/ui";
import { renderWithProviders } from "~/test/renderWithProviders";

describe("PublicShell", () => {
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
    return renderWithProviders(
      <PublicShell>
        <div>Public Content</div>
      </PublicShell>,
      { sessionState },
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Anonymous user                                                     */
  /* ------------------------------------------------------------------ */

  it("shows discover creators and discover businesses for anonymous users", () => {
    render({ status: "anonymous", profile: null });
    expect(screen.getAllByText("Discover creators").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Discover businesses").length).toBeGreaterThanOrEqual(1);
  });

  it("shows Log in for anonymous users", () => {
    render({ status: "anonymous", profile: null });
    expect(screen.getAllByText("Log in").length).toBeGreaterThanOrEqual(1);
  });

  it("does not show Dashboard or Messages or Campaigns for anonymous users", () => {
    render({ status: "anonymous", profile: null });
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.queryByText("Messages")).not.toBeInTheDocument();
    expect(screen.queryByText("Campaigns")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Authenticated creator                                              */
  /* ------------------------------------------------------------------ */

  it("shows Dashboard, Discover businesses, Messages, Campaigns for authenticated creator", () => {
    render({ status: "authenticated", profile: baseProfile });
    // Dashboard appears in desktop nav + mobile nav → at least 1
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Discover businesses").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Messages").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Campaigns").length).toBeGreaterThanOrEqual(1);
  });

  it("does not show Discover creators for authenticated creator", () => {
    render({ status: "authenticated", profile: baseProfile });
    expect(screen.queryByText("Discover creators")).not.toBeInTheDocument();
  });

  it("does not show Log in for authenticated creator", () => {
    render({ status: "authenticated", profile: baseProfile });
    expect(screen.queryByText("Log in")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Authenticated business                                             */
  /* ------------------------------------------------------------------ */

  it("shows Dashboard, Discover creators, Messages, Campaigns for authenticated business", () => {
    render({
      status: "authenticated",
      profile: { ...baseProfile, role: "business" },
    });
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Discover creators").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Messages").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Campaigns").length).toBeGreaterThanOrEqual(1);
  });

  it("does not show Discover businesses for authenticated business", () => {
    render({
      status: "authenticated",
      profile: { ...baseProfile, role: "business" },
    });
    expect(screen.queryByText("Discover businesses")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Authenticated without profile                                      */
  /* ------------------------------------------------------------------ */

  it("shows Messages and Campaigns but no Dashboard for authed user with null profile", () => {
    render({ status: "authenticated", profile: null });
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getAllByText("Messages").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Campaigns").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText("Discover creators")).not.toBeInTheDocument();
    expect(screen.queryByText("Discover businesses")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Renders children                                                   */
  /* ------------------------------------------------------------------ */

  it("renders its children", () => {
    render({ status: "anonymous", profile: null });
    expect(screen.getByText("Public Content")).toBeInTheDocument();
  });
});
