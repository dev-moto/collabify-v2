import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router";
import { screen } from "@testing-library/react";

import Billing from "~/routes/billing";
import { renderWithProviders } from "~/test/renderWithProviders";

const userId = "user-billing-1";

const creatorSessionState = {
  status: "authenticated" as const,
  user: { id: userId },
  profile: {
    id: userId,
    role: "creator" as const,
    display_name: "Ana Reyes",
  },
};

const businessSessionState = {
  status: "authenticated" as const,
  user: { id: userId },
  profile: {
    id: userId,
    role: "business" as const,
    display_name: "Acme Corp",
  },
};

function render(sessionState: Record<string, unknown> = creatorSessionState) {
  return renderWithProviders(
    <Routes>
      <Route path="/billing" element={<Billing />} />
      <Route path="/login" element={<div>Login Page</div>} />
    </Routes>,
    { sessionState, initialEntries: ["/billing"] },
  );
}

describe("Billing route", () => {
  it("redirects anonymous users to login", () => {
    render({ status: "anonymous" });

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Billing" })).not.toBeInTheDocument();
  });

  it("renders billing page content for authenticated creators", () => {
    render(creatorSessionState);

    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
    expect(screen.getByText("Subscription and campaign-fee placeholders for future monetization experiments.")).toBeInTheDocument();
    expect(screen.getByText("creator workspace")).toBeInTheDocument();
  });

  it("renders billing page content for authenticated businesses", () => {
    render(businessSessionState);

    expect(screen.getByRole("heading", { name: "Billing" })).toBeInTheDocument();
    expect(screen.getByText("business workspace")).toBeInTheDocument();
  });

  it("renders the current starter plan card", () => {
    render();

    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Starter" })).toBeInTheDocument();
    expect(screen.getByText("Free MVP access while Collabify validates pricing.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /manage plan/i })).toBeInTheDocument();
  });

  it("renders the empty invoice state", () => {
    render();

    expect(screen.getByText("No invoices yet")).toBeInTheDocument();
    expect(screen.getByText("Payment records and receipts will appear after billing is enabled.")).toBeInTheDocument();
  });
});
