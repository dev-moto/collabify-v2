import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import { MarketingShell, MarketingHeader, MarketingFooter } from "~/components/MarketingShell";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  MarketingFooter                                                    */
/* ------------------------------------------------------------------ */

describe("MarketingFooter", () => {
  it("renders the copyright with current year", () => {
    renderWithProviders(<MarketingFooter />);
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(year)))).toBeInTheDocument();
  });

  it("mentions Philippines", () => {
    renderWithProviders(<MarketingFooter />);
    expect(screen.getByText(/Philippines/i)).toBeInTheDocument();
  });

  it("includes RLS mention", () => {
    renderWithProviders(<MarketingFooter />);
    expect(screen.getByText(/Supabase RLS/i)).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  MarketingHeader                                                    */
/* ------------------------------------------------------------------ */

describe("MarketingHeader", () => {
  it("rendes BrandLogo", () => {
    const { container } = renderWithProviders(<MarketingHeader />);
    // BrandLogo renders an <img> with alt="Collabify"
    const img = container.querySelector('img[alt="Collabify"]');
    expect(img).toBeInTheDocument();
  });

  it("renders all 4 nav items (Creators, Businesses, Features, Trust) in both navs", () => {
    renderWithProviders(<MarketingHeader />);
    // Each nav item appears in both desktop and mobile nav, so getAllByText
    expect(screen.getAllByText("Creators").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Businesses").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Features").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Trust").length).toBeGreaterThanOrEqual(1);
  });

  it("renders Log in link", () => {
    renderWithProviders(<MarketingHeader />);
    const link = screen.getByText("Log in");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/login");
  });

  it("renders Get started link", () => {
    renderWithProviders(<MarketingHeader />);
    const link = screen.getByText("Get started");
    expect(link).toBeInTheDocument();
    expect(link.closest("a")).toHaveAttribute("href", "/signup");
  });

  it("has a main navigation landmark", () => {
    renderWithProviders(<MarketingHeader />);
    expect(screen.getByLabelText("Main navigation")).toBeInTheDocument();
  });

  it("has a mobile navigation landmark", () => {
    renderWithProviders(<MarketingHeader />);
    expect(screen.getByLabelText("Landing page sections")).toBeInTheDocument();
  });

  it("nav items link to section anchors", () => {
    renderWithProviders(<MarketingHeader />);
    // Scope check to the desktop nav (the first set of creator/trust links)
    const creatorLinks = screen.getAllByText("Creators");
    expect(creatorLinks[0].closest("a")).toHaveAttribute("href", "/#for-creators");

    const trustLinks = screen.getAllByText("Trust");
    expect(trustLinks[0].closest("a")).toHaveAttribute("href", "/#trust");
  });
});

/* ------------------------------------------------------------------ */
/*  MarketingShell                                                     */
/* ------------------------------------------------------------------ */

describe("MarketingShell", () => {
  it("renders children", () => {
    renderWithProviders(
      <MarketingShell>
        <main data-testid="content">Landing Content</main>
      </MarketingShell>,
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
    expect(screen.getByText("Landing Content")).toBeInTheDocument();
  });

  it("renders the header with nav items", () => {
    renderWithProviders(
      <MarketingShell>
        <div />
      </MarketingShell>,
    );
    // Nav items appear in both desktop + mobile nav
    expect(screen.getAllByText("Creators").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Log in")).toBeInTheDocument();
    expect(screen.getByText("Get started")).toBeInTheDocument();
  });

  it("renders the footer with copyright", () => {
    renderWithProviders(
      <MarketingShell>
        <div />
      </MarketingShell>,
    );
    const year = new Date().getFullYear();
    expect(screen.getByText(new RegExp(String(year)))).toBeInTheDocument();
  });
});
