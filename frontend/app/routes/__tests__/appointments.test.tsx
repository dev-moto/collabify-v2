import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Appointments from "~/routes/appointments";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  Mock appointmentsService                                           */
/* ------------------------------------------------------------------ */

const mockListAppointments = vi.fn();
const mockCreateAppointment = vi.fn();

vi.mock("~/services/appointmentsService", () => ({
  listAppointments: (...args: unknown[]) => mockListAppointments(...args),
  createAppointment: (...args: unknown[]) => mockCreateAppointment(...args),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const userId = "user-self-1";

const appointments = [
  {
    id: "appt-1",
    business_id: "biz-1",
    creator_id: userId,
    scheduled_for: "2026-07-01T10:00:00Z",
    status: "accepted" as const,
    notes: "Discuss collaboration terms",
    created_by: userId,
    created_at: "2026-06-15T00:00:00Z",
    updated_at: "2026-06-15T00:00:00Z",
  },
  {
    id: "appt-2",
    business_id: "biz-1",
    creator_id: userId,
    scheduled_for: null,
    status: "requested" as const,
    notes: null,
    created_by: "biz-1",
    created_at: "2026-06-18T00:00:00Z",
    updated_at: "2026-06-18T00:00:00Z",
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
  return renderWithProviders(<Appointments />, {
    sessionState: { ...baseSessionState, ...sessionState },
    initialEntries: ["/appointments"],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListAppointments.mockResolvedValue(appointments);
  mockCreateAppointment.mockResolvedValue({
    id: "appt-new",
    business_id: "biz-2",
    creator_id: "creator-2",
    scheduled_for: "2026-07-15T14:00:00Z",
    status: "requested",
    notes: "Initial meeting",
    created_by: userId,
    created_at: "2026-06-20T00:00:00Z",
    updated_at: "2026-06-20T00:00:00Z",
  });
});

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */

it("shows loading state initially", () => {
  mockListAppointments.mockReturnValue(new Promise(() => {}));
  render();
  expect(screen.getByText("Loading appointments")).toBeInTheDocument();
  expect(screen.getByText("Please wait while we load your appointments.")).toBeInTheDocument();
});

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

it("shows error state when listAppointments fails", async () => {
  mockListAppointments.mockRejectedValue(new Error("Network error"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Empty state                                                        */
/* ------------------------------------------------------------------ */

it("shows empty state when no appointments exist", async () => {
  mockListAppointments.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No appointments yet")).toBeInTheDocument();
    expect(screen.getByText("Request a meeting with a creator or business to get started.")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Appointment list rendering                                         */
/* ------------------------------------------------------------------ */

it("renders appointment IDs and status badges", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText(/Appointment appt-1/)).toBeInTheDocument();
    expect(screen.getByText(/Appointment appt-2/)).toBeInTheDocument();
    expect(screen.getByText("Accepted")).toBeInTheDocument();
    expect(screen.getByText("Requested")).toBeInTheDocument();
  });
});

it("shows scheduled date and notes for appointments", async () => {
  render();
  // appt-1 has a scheduled_for date and notes
  expect(await screen.findByText(/Discuss collaboration terms/)).toBeInTheDocument();
  // appt-2 has no scheduled_for date — shows "No date set" (followed by " · " with empty notes)
  expect(await screen.findByText(/No date set/)).toBeInTheDocument();
});

/* ------------------------------------------------------------------ */
/*  Create appointment form                                            */
/* ------------------------------------------------------------------ */

it("shows the request meeting form", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Request meeting")).toBeInTheDocument();
    expect(screen.getByLabelText("Business ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Creator ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Preferred date")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });
});

it("creates an appointment and appends it to the list", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Business ID")).toBeInTheDocument();
  });

  const businessInput = screen.getByLabelText("Business ID");
  await user.type(businessInput, "biz-2");

  const creatorInput = screen.getByLabelText("Creator ID");
  await user.type(creatorInput, "creator-2");

  const dateInput = screen.getByLabelText("Preferred date");
  await user.type(dateInput, "2026-07-15");

  const notesInput = screen.getByLabelText("Notes");
  await user.type(notesInput, "Initial meeting");

  const sendBtn = screen.getByRole("button", { name: /send request/i });
  await user.click(sendBtn);

  await waitFor(() => {
    expect(mockCreateAppointment).toHaveBeenCalledWith({
      businessId: "biz-2",
      creatorId: "creator-2",
      scheduledFor: "2026-07-15",
      notes: "Initial meeting",
    });
    expect(screen.getByText("Meeting request sent.")).toBeInTheDocument();
  });
});

it("shows validation error when business ID or creator ID is empty", async () => {
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Business ID")).toBeInTheDocument();
  });

  const sendBtn = screen.getByRole("button", { name: /send request/i });
  await user.click(sendBtn);

  await waitFor(() => {
    expect(screen.getByText("Both participant IDs are required.")).toBeInTheDocument();
    expect(mockCreateAppointment).not.toHaveBeenCalled();
  });
});

it("shows error StatusPanel when createAppointment fails", async () => {
  mockCreateAppointment.mockRejectedValue(new Error("Creation failed"));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Business ID")).toBeInTheDocument();
  });

  await user.type(screen.getByLabelText("Business ID"), "biz-1");
  await user.type(screen.getByLabelText("Creator ID"), "creator-1");

  const sendBtn = screen.getByRole("button", { name: /send request/i });
  await user.click(sendBtn);

  await waitFor(() => {
    expect(screen.getByText("Creation failed")).toBeInTheDocument();
  });
});

it("disables Send request button while creating", async () => {
  mockCreateAppointment.mockReturnValue(new Promise(() => {}));
  const user = userEvent.setup();
  render();
  await waitFor(() => {
    expect(screen.getByLabelText("Business ID")).toBeInTheDocument();
  });

  await user.type(screen.getByLabelText("Business ID"), "biz-1");
  await user.type(screen.getByLabelText("Creator ID"), "creator-1");

  const sendBtn = screen.getByRole("button", { name: /send request/i });
  await user.click(sendBtn);

  await waitFor(() => {
    expect(sendBtn).toBeDisabled();
    expect(sendBtn).toHaveTextContent(/sending/i);
  });
});
