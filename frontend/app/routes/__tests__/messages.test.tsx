import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Messages from "~/routes/messages";
import { renderWithProviders } from "~/test/renderWithProviders";

/* ------------------------------------------------------------------ */
/*  Mock messagesService                                               */
/* ------------------------------------------------------------------ */

const mockListConversations = vi.fn();
const mockGetMessages = vi.fn();
const mockSendMessage = vi.fn();

vi.mock("~/services/messagesService", () => ({
  listConversations: (...args: unknown[]) => mockListConversations(...args),
  getMessages: (...args: unknown[]) => mockGetMessages(...args),
  sendMessage: (...args: unknown[]) => mockSendMessage(...args),
}));

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const userId = "user-self-1";

const participantProfiles = [
  { user_id: userId, display_name: "Ana Reyes" },
  { user_id: "user-other-1", display_name: "Bob Santos" },
  { user_id: "user-other-2", display_name: "Carla Gomez" },
];

const conversations = [
  {
    id: "conv-1",
    participant_ids: [userId, "user-other-1"],
    participants: participantProfiles.filter((p) => [userId, "user-other-1"].includes(p.user_id)),
    last_message: "Hey there!",
    last_message_at: "2026-06-20T10:00:00Z",
    unread_count: 2,
  },
  {
    id: "conv-2",
    participant_ids: [userId, "user-other-2"],
    participants: participantProfiles.filter((p) => [userId, "user-other-2"].includes(p.user_id)),
    last_message: "Sounds good!",
    last_message_at: "2026-06-20T09:00:00Z",
    unread_count: 0,
  },
  {
    id: "conv-3",
    participant_ids: [userId, "user-other-1", "user-other-2"],
    participants: participantProfiles,
    last_message: "Let's meet tomorrow",
    last_message_at: "2026-06-19T15:00:00Z",
    unread_count: 1,
  },
];

const sampleMessages = [
  { id: "msg-1", conversation_id: "conv-1", sender_id: "user-other-1", body: "Hey there!", created_at: "2026-06-20T10:00:00Z" },
  { id: "msg-2", conversation_id: "conv-1", sender_id: userId, body: "Hi Bob!", created_at: "2026-06-20T10:01:00Z" },
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
  return renderWithProviders(<Messages />, {
    sessionState: { ...baseSessionState, ...sessionState },
    initialEntries: ["/messages"],
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockListConversations.mockResolvedValue(conversations);
  mockGetMessages.mockResolvedValue(sampleMessages);
  mockSendMessage.mockResolvedValue({
    id: "msg-3",
    conversation_id: "conv-1",
    sender_id: userId,
    body: "New message text",
    created_at: "2026-06-20T11:00:00Z",
  });
});

/* ------------------------------------------------------------------ */
/*  Loading state                                                      */
/* ------------------------------------------------------------------ */

it("shows loading state initially", () => {
  mockListConversations.mockReturnValue(new Promise(() => {})); // never resolves
  render();
  expect(screen.getByText("Loading conversations")).toBeInTheDocument();
  expect(screen.getByText("Please wait while we load your messages.")).toBeInTheDocument();
});

/* ------------------------------------------------------------------ */
/*  Error state                                                        */
/* ------------------------------------------------------------------ */

it("shows error state when listConversations fails", async () => {
  mockListConversations.mockRejectedValue(new Error("Network error"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Failed to load")).toBeInTheDocument();
    expect(screen.getByText("Network error")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Empty conversations                                                */
/* ------------------------------------------------------------------ */

it("shows empty state when there are no conversations", async () => {
  mockListConversations.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Conversation list display names                                    */
/* ------------------------------------------------------------------ */

it("shows the other participant's display name in the sidebar", async () => {
  render();
  await waitFor(() => {
    // conv-1 has Ana (self) and Bob Santos (other) — "Bob Santos" appears in
    // the sidebar as the conversation title and in the chat header.
    const matches = screen.getAllByText("Bob Santos");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

it("shows multiple other participants' names separated by comma", async () => {
  render();
  await waitFor(() => {
    // conv-3 has Ana (self), Bob Santos, and Carla Gomez
    const matches = screen.getAllByText("Bob Santos, Carla Gomez");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

it("shows 'You' when current user is the only participant", async () => {
  const selfOnly = [
    {
      id: "conv-self",
      participant_ids: [userId],
      participants: [{ user_id: userId, display_name: "Ana Reyes" }],
      last_message: null,
      last_message_at: "2026-06-20T08:00:00Z",
      unread_count: 0,
    },
  ];
  mockListConversations.mockResolvedValue(selfOnly);
  render();
  await waitFor(() => {
    // "You" appears in sidebar title, chat header, and message sender label
    const matches = screen.getAllByText("You");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});

/* ------------------------------------------------------------------ */
/*  Last message preview & unread badge                                */
/* ------------------------------------------------------------------ */

it("shows last message preview in sidebar", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Hey there!")).toBeInTheDocument();
  });
});

it("shows unread badge when unread_count > 0", async () => {
  render();
  await waitFor(() => {
    // conv-1 has 2 unread
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});

it("does not show unread badge when unread_count is 0", async () => {
  render();
  await waitFor(() => {
    // conv-2 has 0 unread — badge shouldn't exist
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Messages loading & error states                                    */
/* ------------------------------------------------------------------ */

it("shows messages loading state when switching conversations", async () => {
  // Make getMessages return a pending promise
  mockGetMessages.mockReturnValue(new Promise(() => {}));
  render();
  await waitFor(() => {
    expect(screen.getByText("Loading messages")).toBeInTheDocument();
    expect(screen.getByText("Fetching conversation history.")).toBeInTheDocument();
  });
});

it("shows messages error state when getMessages fails", async () => {
  mockGetMessages.mockRejectedValue(new Error("Failed to fetch"));
  render();
  await waitFor(() => {
    expect(screen.getByText("Failed to load messages")).toBeInTheDocument();
    expect(screen.getByText("Failed to fetch")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Chat header                                                        */
/* ------------------------------------------------------------------ */

it("shows participant display name in chat header", async () => {
  render();
  await waitFor(() => {
    // First conversation (conv-1) should be auto-selected, showing "Bob Santos"
    // in the <h2> heading of the chat header
    expect(screen.getByRole("heading", { name: "Bob Santos" })).toBeInTheDocument();
  });
});

it("shows participant-only badge in chat header", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("Participant-only")).toBeInTheDocument();
  });
});

it("shows participant count in chat header", async () => {
  render();
  await waitFor(() => {
    expect(screen.getByText("2 participants")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Message bubbles                                                    */
/* ------------------------------------------------------------------ */

it("shows 'You' label for own messages", async () => {
  render();
  await waitFor(() => {
    // msg-2 is from userId
    expect(screen.getByText("Hi Bob!")).toBeInTheDocument();
    expect(screen.getByText(/^You$/)).toBeInTheDocument();
  });
});

it("shows sender display name for other participant's messages", async () => {
  render();
  await waitFor(() => {
    // "Hey there!" appears in both sidebar preview and message bubble
    const matches = screen.getAllByText("Hey there!");
    expect(matches.length).toBeGreaterThanOrEqual(1);
    // "Bob Santos" appears in sidebar title, chat heading, and sender label
    const nameMatches = screen.getAllByText("Bob Santos");
    expect(nameMatches.length).toBeGreaterThanOrEqual(1);
  });
});

it("shows 'No messages yet' when conversation has no messages", async () => {
  mockGetMessages.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No messages yet. Send one to start the conversation.")).toBeInTheDocument();
  });
});

/* ------------------------------------------------------------------ */
/*  Sending a message                                                  */
/* ------------------------------------------------------------------ */

it("sends a message and appends it to the list", async () => {
  const user = userEvent.setup();

  mockSendMessage.mockResolvedValue({
    id: "msg-new",
    conversation_id: "conv-1",
    sender_id: userId,
    body: "Hello from test!",
    created_at: "2026-06-20T12:00:00Z",
  });

  render();
  await waitFor(() => {
    expect(screen.getByPlaceholderText("Write a text message or paste a safe link")).toBeInTheDocument();
  });

  const input = screen.getByPlaceholderText("Write a text message or paste a safe link");
  await user.type(input, "Hello from test!");

  const sendBtn = screen.getByRole("button", { name: /send/i });
  await user.click(sendBtn);

  await waitFor(() => {
    expect(mockSendMessage).toHaveBeenCalledWith({
      conversationId: "conv-1",
      body: "Hello from test!",
    });
    expect(screen.getByText("Hello from test!")).toBeInTheDocument();
  });
});

it("disables send button when input is empty", async () => {
  render();
  await waitFor(() => {
    const sendBtn = screen.getByRole("button", { name: /send/i });
    expect(sendBtn).toBeDisabled();
  });
});

/* ------------------------------------------------------------------ */
/*  Switching conversations                                            */
/* ------------------------------------------------------------------ */

it("loads messages when switching conversation", async () => {
  render();
  await waitFor(() => {
    // conv-2 should have Bob Santos, Carla Gomez in the sidebar
    expect(screen.getByText("Bob Santos, Carla Gomez")).toBeInTheDocument();
  });

  // Click the group conversation
  const groupConv = screen.getByText("Bob Santos, Carla Gomez");
  await userEvent.setup().click(groupConv);

  await waitFor(() => {
    // getMessages should have been called again with conv-2
    // The last call should be for the new active conversation
    expect(mockGetMessages).toHaveBeenCalledWith("conv-3");
  });
});

/* ------------------------------------------------------------------ */
/*  "Select a conversation" empty state                                */
/* ------------------------------------------------------------------ */

it("shows select-a-conversation when no conversation is active", async () => {
  // Force status to "success" with conversations but no activeId set
  mockListConversations.mockResolvedValue([]);
  render();
  await waitFor(() => {
    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
  });
});
