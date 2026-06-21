import { describe, it, expect } from "vitest";
import { screen, within } from "@testing-library/react";

import { AppShell } from "~/components/ui";
import { renderWithProviders } from "~/test/renderWithProviders";

describe("AppShell", () => {
  function render(props: Partial<React.ComponentProps<typeof AppShell>> = {}) {
    return renderWithProviders(
      <AppShell title="Test Title" description="Test description." {...props}>
        <div>Child Content</div>
      </AppShell>,
      // Provide an authenticated session so UserMenu/NotificationBell render
      { sessionState: { status: "authenticated" } },
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Common elements                                                    */
  /* ------------------------------------------------------------------ */

  it("renders title and description", () => {
    render({ title: "Dashboard", description: "Manage your workspace." });
    // "Dashboard" appears in both nav links (×2) and the h1 title — assert at least one exists
    const dashboardMatches = screen.getAllByText("Dashboard");
    expect(dashboardMatches.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Manage your workspace.")).toBeInTheDocument();
  });

  it("renders children", () => {
    render();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("renders the Collabify logo link", () => {
    render();
    const logo = screen.getByText("Collabify");
    expect(logo).toBeInTheDocument();
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  it("renders role badge", () => {
    render({ role: "business" });
    expect(screen.getByText("business workspace")).toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Creator nav                                                        */
  /* ------------------------------------------------------------------ */

  describe("creator role", () => {
    it("shows Dashboard linked to /creator/dashboard", () => {
      render({ role: "creator" });
      const links = screen.getAllByText("Dashboard");
      expect(links.length).toBeGreaterThanOrEqual(1);
      const dashboardLinks = links.filter((l) => l.closest("a")?.getAttribute("href") === "/creator/dashboard");
      expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("shows Discover businesses linked to /discover/businesses", () => {
      render({ role: "creator" });
      const links = screen.getAllByText("Discover businesses");
      expect(links.length).toBeGreaterThanOrEqual(1);
      const discoverLinks = links.filter((l) => l.closest("a")?.getAttribute("href") === "/discover/businesses");
      expect(discoverLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("shows Campaigns, Appointments, Messages", () => {
      render({ role: "creator" });
      for (const label of ["Campaigns", "Appointments", "Messages"]) {
        const links = screen.getAllByText(label);
        expect(links.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("has correct hrefs for standard nav items", () => {
      render({ role: "creator" });
      const hrefs = [
        ["Campaigns", "/campaigns"],
        ["Appointments", "/appointments"],
        ["Messages", "/messages"],
      ] as const;
      for (const [label, href] of hrefs) {
        const links = screen.getAllByText(label);
        const matching = links.filter((l) => l.closest("a")?.getAttribute("href") === href);
        expect(matching.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("renders desktop nav with creator label", () => {
      render({ role: "creator" });
      const desktopNav = screen.getByLabelText("creator navigation");
      expect(desktopNav).toBeInTheDocument();
    });

    it("renders mobile nav with creator label", () => {
      render({ role: "creator" });
      const mobileNav = screen.getByLabelText("creator mobile navigation");
      expect(mobileNav).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Business nav                                                       */
  /* ------------------------------------------------------------------ */

  describe("business role", () => {
    it("shows Dashboard linked to /business/dashboard", () => {
      render({ role: "business" });
      const links = screen.getAllByText("Dashboard");
      const dashboardLinks = links.filter((l) => l.closest("a")?.getAttribute("href") === "/business/dashboard");
      expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("shows Discover creators linked to /discover/creators", () => {
      render({ role: "business" });
      const links = screen.getAllByText("Discover creators");
      expect(links.length).toBeGreaterThanOrEqual(1);
      const discoverLinks = links.filter((l) => l.closest("a")?.getAttribute("href") === "/discover/creators");
      expect(discoverLinks.length).toBeGreaterThanOrEqual(1);
    });

    it("does not show Discover businesses for business role", () => {
      render({ role: "business" });
      expect(screen.queryByText("Discover businesses")).not.toBeInTheDocument();
    });

    it("renders desktop nav with business label", () => {
      render({ role: "business" });
      expect(screen.getByLabelText("business navigation")).toBeInTheDocument();
    });
  });

  /* ------------------------------------------------------------------ */
  /*  Admin nav                                                          */
  /* ------------------------------------------------------------------ */

  describe("admin role", () => {
    it("shows Admin, Reports, Audit logs links", () => {
      render({ role: "admin" });
      for (const label of ["Admin", "Reports", "Audit logs"]) {
        const links = screen.getAllByText(label);
        expect(links.length).toBeGreaterThanOrEqual(1);
      }
    });

    it("does not show Dashboard, Campaigns, Appointments, Messages, Billing for admin", () => {
      render({ role: "admin" });
      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
      expect(screen.queryByText("Campaigns")).not.toBeInTheDocument();
      expect(screen.queryByText("Appointments")).not.toBeInTheDocument();
      expect(screen.queryByText("Messages")).not.toBeInTheDocument();
      expect(screen.queryByText("Billing")).not.toBeInTheDocument();
    });

    it("Admin link points to /admin", () => {
      render({ role: "admin" });
      const links = screen.getAllByText("Admin");
      const matching = links.filter((l) => l.closest("a")?.getAttribute("href") === "/admin");
      expect(matching.length).toBeGreaterThanOrEqual(1);
    });
  });
});
