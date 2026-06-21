import { describe, it, expect } from "vitest";
import { Routes, Route } from "react-router";
import { screen } from "@testing-library/react";

import { ProtectedRoute } from "~/components/ui";
import { renderWithProviders } from "~/test/renderWithProviders";
import type { SessionState } from "~/test/renderWithProviders";

const completedCreatorProfile: NonNullable<SessionState["profile"]> = {
  id: "user-1",
  role: "creator",
  display_name: "Ana Reyes",
  city: "Quezon City",
  status: "active",
  onboarding_completed: true,
  created_at: "2026-06-21T00:00:00.000Z",
  updated_at: "2026-06-21T00:00:00.000Z",
};

const completedBusinessProfile: NonNullable<SessionState["profile"]> = {
  ...completedCreatorProfile,
  id: "business-1",
  role: "business",
  display_name: "Sunrise Cafe PH",
};

describe("ProtectedRoute", () => {
  function renderWithStatus(status: string, sessionState: Partial<SessionState> = {}, initialEntries = ["/"]) {
    return renderWithProviders(
      <Routes>
        <Route path="/" element={<ProtectedRoute><div>Secret Content</div></ProtectedRoute>} />
        <Route path="/creator/dashboard" element={<ProtectedRoute allowedRoles={["creator"]}><div>Creator Dashboard</div></ProtectedRoute>} />
        <Route path="/business/dashboard" element={<ProtectedRoute allowedRoles={["business"]}><div>Business Dashboard</div></ProtectedRoute>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/onboarding" element={<ProtectedRoute><div>Onboarding Page</div></ProtectedRoute>} />
      </Routes>,
      { sessionState: { status: status as any, ...sessionState }, initialEntries },
    );
  }

  it("shows loading panel when status is idle", () => {
    renderWithStatus("idle");
    expect(screen.getByText("Checking your session")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("shows loading panel when status is loading", () => {
    renderWithStatus("loading");
    expect(screen.getByText("Checking your session")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("redirects to /login when status is anonymous", () => {
    renderWithStatus("anonymous");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("redirects to /login when status is error", () => {
    renderWithStatus("error");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("shows loading panel while authenticated profile is loading", () => {
    renderWithStatus("authenticated", { profileStatus: "loading" });
    expect(screen.getByText("Loading your profile")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("redirects authenticated users without a profile to onboarding", () => {
    renderWithStatus("authenticated", { profileStatus: "missing" });
    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("allows authenticated users without a profile to access onboarding", () => {
    renderWithStatus("authenticated", { profileStatus: "missing" }, ["/onboarding"]);
    expect(screen.getByText("Onboarding Page")).toBeInTheDocument();
  });

  it("shows an error panel when profile loading fails", () => {
    renderWithStatus("authenticated", { profileStatus: "error" });
    expect(screen.getByText("Profile unavailable")).toBeInTheDocument();
    expect(screen.queryByText("Secret Content")).not.toBeInTheDocument();
  });

  it("renders children when authenticated with a completed profile", () => {
    renderWithStatus("authenticated", { profileStatus: "ready", profile: completedCreatorProfile });
    expect(screen.getByText("Secret Content")).toBeInTheDocument();
    expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
  });

  it("renders a role-gated route for an allowed profile role", () => {
    renderWithStatus("authenticated", { profileStatus: "ready", profile: completedCreatorProfile }, ["/creator/dashboard"]);
    expect(screen.getByText("Creator Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Business Dashboard")).not.toBeInTheDocument();
  });

  it("redirects a mismatched creator route to the user's business dashboard", () => {
    renderWithStatus("authenticated", { profileStatus: "ready", profile: completedBusinessProfile }, ["/creator/dashboard"]);
    expect(screen.getByText("Business Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Creator Dashboard")).not.toBeInTheDocument();
  });

  it("redirects a mismatched business route to the user's creator dashboard", () => {
    renderWithStatus("authenticated", { profileStatus: "ready", profile: completedCreatorProfile }, ["/business/dashboard"]);
    expect(screen.getByText("Creator Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Business Dashboard")).not.toBeInTheDocument();
  });
});
