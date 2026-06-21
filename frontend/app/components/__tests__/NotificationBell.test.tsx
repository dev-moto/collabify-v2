import { describe, it, expect } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";

import { NotificationBell } from "~/components/NotificationBell";
import { renderWithProviders } from "~/test/renderWithProviders";

describe("NotificationBell", () => {
  function render() {
    return renderWithProviders(<NotificationBell />);
  }

  /* ------------------------------------------------------------------ */
  /*  Button & badge                                                     */
  /* ------------------------------------------------------------------ */

  it("renders bell button with unread count in aria-label", () => {
    render();
    const btn = screen.getByRole("button", { name: /notifications.*2 unread/i });
    expect(btn).toBeInTheDocument();
  });

  it("shows unread badge count", () => {
    render();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Dropdown open / close                                              */
  /* ------------------------------------------------------------------ */

  it("opens dropdown on click", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("menu", { name: "Notifications" })).toBeInTheDocument();
  });

  it("shows notification items when dropdown is open", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByText("Welcome to Collabify")).toBeInTheDocument();
    expect(screen.getByText("Verification update")).toBeInTheDocument();
    expect(screen.getByText("Discovery is live")).toBeInTheDocument();
  });

  it("shows notification messages and timestamps", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByText("Complete your profile to get discovered.")).toBeInTheDocument();
    expect(screen.getByText("Just now")).toBeInTheDocument();
    expect(screen.getByText("2h ago")).toBeInTheDocument();
    expect(screen.getByText("1d ago")).toBeInTheDocument();
  });

  it("shows unread dot indicator for unread notifications", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    // Two unread items → two dots with aria-label "Unread"
    const dots = screen.getAllByLabelText("Unread");
    expect(dots).toHaveLength(2);
  });

  it("closes dropdown on close button click", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Close notifications"));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes dropdown on outside click", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Placeholder footer                                                 */
  /* ------------------------------------------------------------------ */

  it("shows placeholder footer text when open", () => {
    render();
    fireEvent.click(screen.getByRole("button", { name: /notifications/i }));
    expect(
      screen.getByText("Notifications are placeholder content until the system is built."),
    ).toBeInTheDocument();
  });

  /* ------------------------------------------------------------------ */
  /*  Toggle behavior                                                    */
  /* ------------------------------------------------------------------ */

  it("toggles dropdown on repeated button clicks", () => {
    render();
    const btn = screen.getByRole("button", { name: /notifications/i });
    // First click opens
    fireEvent.click(btn);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    // Second click closes
    fireEvent.click(btn);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
