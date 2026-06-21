import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router";

import { UserMenu } from "~/components/UserMenu";
import { renderWithProviders } from "~/test/renderWithProviders";

// Mock the auth service so we never hit a real Supabase client
const signOutMock = vi.fn();
vi.mock("~/services/authService", () => ({
  signOut: (...args: unknown[]) => signOutMock(...args),
}));

describe("UserMenu", () => {
  beforeEach(() => {
    signOutMock.mockReset();
  });

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
      <Routes>
        <Route path="/" element={<div>Home Page</div>} />
        <Route path="/app" element={<UserMenu />} />
        <Route path="/billing" element={<div>Billing Page</div>} />
        <Route path="/settings" element={<div>Settings Page</div>} />
      </Routes>,
      { sessionState, initialEntries: ["/app"] },
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Initials                                                           */
  /* ------------------------------------------------------------------ */

  it("shows initials derived from display_name", () => {
    render({ status: "authenticated", profile: baseProfile });
    expect(screen.getByText("AR")).toBeInTheDocument();
  });

  it("shows fallback initial U when profile is null", () => {
    render({ status: "authenticated", profile: null });
    expect(screen.getByText("U")).toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Menu open / close                                                  */
  /* ------------------------------------------------------------------ */

  it("opens the menu when clicked and shows options", () => {
    render({ status: "authenticated", profile: baseProfile });
    const menuButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.getByText("Billing")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("closes the menu on outside click", () => {
    render({ status: "authenticated", profile: baseProfile });
    const menuButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu on Escape key", () => {
    render({ status: "authenticated", profile: baseProfile });
    const menuButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Billing link                                                       */
  /* ------------------------------------------------------------------ */

  it("billing link points to /billing for creators", () => {
    render({ status: "authenticated", profile: baseProfile });
    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
    const billingLink = screen.getByText("Billing").closest("a");
    expect(billingLink).toHaveAttribute("href", "/billing");
  });

  it("billing link points to /billing for businesses", () => {
    render({
      status: "authenticated",
      profile: { ...baseProfile, role: "business" },
    });
    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
    const billingLink = screen.getByText("Billing").closest("a");
    expect(billingLink).toHaveAttribute("href", "/billing");
  });

  it("does not show Billing for admin users", () => {
    render({
      status: "authenticated",
      profile: { ...baseProfile, role: "admin" },
    });
    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
    expect(screen.queryByText("Billing")).not.toBeInTheDocument();
  });

  it("does not show Billing when profile is null", () => {
    render({ status: "authenticated", profile: null });
    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
    expect(screen.queryByText("Billing")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Successful sign-out                                                */
  /* ------------------------------------------------------------------ */

  it("calls signOut and navigates to home on successful sign-out", async () => {
    signOutMock.mockResolvedValue(undefined);
    render({ status: "authenticated", profile: baseProfile });
    fireEvent.click(screen.getByRole("button", { name: /user menu/i }));
    fireEvent.click(screen.getByText("Sign out"));
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalledOnce();
    });
    expect(screen.getByText("Home Page")).toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Failed sign-out                                                    */
  /* ------------------------------------------------------------------ */

  it("closes menu and keeps button visible after failed sign-out", async () => {
    signOutMock.mockRejectedValue(new Error("Network error"));
    render({ status: "authenticated", profile: baseProfile });
    // Open menu
    const menuButton = screen.getByRole("button", { name: /user menu/i });
    fireEvent.click(menuButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    // Click Sign out
    fireEvent.click(screen.getByText("Sign out"));
    // Menu should close on failure
    await waitFor(() => {
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    });
    // signOut was called
    expect(signOutMock).toHaveBeenCalledOnce();
    // User can still open the menu
    fireEvent.click(menuButton);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });
});
