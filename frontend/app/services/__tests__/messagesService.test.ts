import { describe, it, expect, vi, beforeEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mock supabase module                                                */
/* ------------------------------------------------------------------ */

let resolveValue: { data: unknown; error: unknown } = { data: [], error: null };

function createBuilder() {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};

  function chainable() {
    return Promise.resolve(resolveValue);
  }

  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.maybeSingle = vi.fn(() => chainable());
  builder.single = vi.fn(() => chainable());
  builder.insert = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.returns = vi.fn(() => chainable());
  return builder;
}

const mockBuilder = createBuilder();
const rpcBuilder = createBuilder();

const { mockFrom, mockGetUser, mockRpc } = vi.hoisted(() => ({
  mockFrom: vi.fn(() => mockBuilder),
  mockGetUser: vi.fn(),
  mockRpc: vi.fn(() => rpcBuilder),
}));

vi.mock("~/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    rpc: mockRpc,
    auth: {
      getUser: mockGetUser,
    },
  },
}));

/* ------------------------------------------------------------------ */
/*  Import after mocks                                                  */
/* ------------------------------------------------------------------ */

import {
  listConversations,
  getMessages,
  sendMessage,
  createConversation,
} from "~/services/messagesService";

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function resetBuilder() {
  vi.clearAllMocks();
  resolveValue = { data: [], error: null };

  mockBuilder.select.mockReturnValue(mockBuilder);
  mockBuilder.eq.mockReturnValue(mockBuilder);
  mockBuilder.in.mockReturnValue(mockBuilder);
  mockBuilder.order.mockReturnValue(mockBuilder);
  mockBuilder.maybeSingle.mockImplementation(() => Promise.resolve(resolveValue));
  mockBuilder.single.mockImplementation(() => Promise.resolve(resolveValue));
  mockBuilder.insert.mockReturnValue(mockBuilder);
  mockBuilder.update.mockReturnValue(mockBuilder);
  mockBuilder.delete.mockReturnValue(mockBuilder);
  mockBuilder.or.mockReturnValue(mockBuilder);
  mockBuilder.returns.mockImplementation(() => Promise.resolve(resolveValue));

  rpcBuilder.select.mockReturnValue(rpcBuilder);
  rpcBuilder.eq.mockReturnValue(rpcBuilder);
  rpcBuilder.in.mockReturnValue(rpcBuilder);
  rpcBuilder.order.mockReturnValue(rpcBuilder);
  rpcBuilder.maybeSingle.mockImplementation(() => Promise.resolve(resolveValue));
  rpcBuilder.single.mockImplementation(() => Promise.resolve(resolveValue));
  rpcBuilder.insert.mockReturnValue(rpcBuilder);
  rpcBuilder.update.mockReturnValue(rpcBuilder);
  rpcBuilder.delete.mockReturnValue(rpcBuilder);
  rpcBuilder.or.mockReturnValue(rpcBuilder);
  rpcBuilder.returns.mockImplementation(() => Promise.resolve(resolveValue));
  mockRpc.mockReturnValue(rpcBuilder);
}

function resolveWith(data: unknown) {
  resolveValue = { data, error: null };
}

function rejectWith(error: Error) {
  resolveValue = { data: null, error };
}

function mockAuthedUser(userId = "user-123") {
  mockGetUser.mockResolvedValue({ data: { user: { id: userId } }, error: null });
}

beforeEach(() => {
  resetBuilder();
  resolveWith([]);
});

/* ------------------------------------------------------------------ */
/*  Tests                                                               */
/* ------------------------------------------------------------------ */

describe("listConversations", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(listConversations()).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, rpc: mockRpc, auth: { getUser: mockGetUser } };
    resetBuilder();
    resolveWith([]);
  });

  it("returns empty array when user belongs to no conversations", async () => {
    resolveWith([]);
    const result = await listConversations();
    expect(result).toEqual([]);
  });

  it("fetches conversations the user participates in", async () => {
    mockAuthedUser();
    // Return participant data with user_id so the flow works cleanly
    resolveWith([
      { conversation_id: "conv-1", user_id: "user-a", created_at: "2026-01-01" },
    ]);
    // Mock the rpc to return empty (no display name resolution needed for this test)
    rpcBuilder.returns.mockResolvedValue({ data: [], error: null });

    await listConversations();
    expect(mockFrom).toHaveBeenCalledWith("conversation_participants");
    expect(mockBuilder.select).toHaveBeenCalledWith("conversation_id");
  });

  it("throws on error", async () => {
    rejectWith(new Error("DB error"));
    await expect(listConversations()).rejects.toThrow("DB error");
  });

  it("resolves display names via get_participant_profiles rpc", async () => {
    // Use sequential returns for the builder chain:
    // 1. memberships: .returns<{ conversation_id: string }[]>()
    // 2. conversations: .returns<Conversation[]>()
    // 3. participants: .returns<ConversationParticipant[]>()
    // 4. rpc: .returns<ParticipantProfile[]>()  (via rpcBuilder)
    const convId = "conv-1";
    mockBuilder.returns
      .mockResolvedValueOnce({ data: [{ conversation_id: convId }], error: null })
      .mockResolvedValueOnce({
        data: [{ id: convId, campaign_id: null, created_by: "user-a", created_at: "2026-01-01", updated_at: "2026-01-01" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [
          { conversation_id: convId, user_id: "user-a", created_at: "2026-01-01" },
          { conversation_id: convId, user_id: "user-b", created_at: "2026-01-01" },
        ],
        error: null,
      });

    // Mock rpc to return profile data
    const profileData = [
      { user_id: "user-a", display_name: "Alice" },
      { user_id: "user-b", display_name: "Bob" },
    ];
    rpcBuilder.returns.mockResolvedValue({ data: profileData, error: null });

    const result = await listConversations();

    expect(mockRpc).toHaveBeenCalledWith("get_participant_profiles", {
      user_ids: ["user-a", "user-b"],
    });
    expect(result[0].participants).toEqual([
      { user_id: "user-a", display_name: "Alice" },
      { user_id: "user-b", display_name: "Bob" },
    ]);
  });

  it("falls back to Unknown when rpc returns no matching profile", async () => {
    const convId = "conv-1";
    mockBuilder.returns
      .mockResolvedValueOnce({ data: [{ conversation_id: convId }], error: null })
      .mockResolvedValueOnce({
        data: [{ id: convId, campaign_id: null, created_by: "user-a", created_at: "2026-01-01", updated_at: "2026-01-01" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ conversation_id: convId, user_id: "user-x", created_at: "2026-01-01" }],
        error: null,
      });

    // rpc returns empty array
    rpcBuilder.returns.mockResolvedValue({ data: [], error: null });

    const result = await listConversations();
    expect(result[0].participants).toEqual([
      { user_id: "user-x", display_name: "Unknown" },
    ]);
  });

  it("falls back to participant_ids only when rpc fails", async () => {
    const convId = "conv-1";
    mockBuilder.returns
      .mockResolvedValueOnce({ data: [{ conversation_id: convId }], error: null })
      .mockResolvedValueOnce({
        data: [{ id: convId, campaign_id: null, created_by: "user-a", created_at: "2026-01-01", updated_at: "2026-01-01" }],
        error: null,
      })
      .mockResolvedValueOnce({
        data: [{ conversation_id: convId, user_id: "user-a", created_at: "2026-01-01" }],
        error: null,
      });

    // rpc fails
    rpcBuilder.returns.mockResolvedValue({ data: null, error: new Error("RPC error") });

    const result = await listConversations();
    expect(result[0].participants).toEqual([
      { user_id: "user-a", display_name: "Unknown" },
    ]);
  });
});

describe("getMessages", () => {
  it("throws when supabase is not configured", async () => {
    const mod = await import("~/lib/supabase");
    (mod as any).supabase = null;
    await expect(getMessages("conv-1")).rejects.toThrow("Supabase is not configured");
    (mod as any).supabase = { from: mockFrom, rpc: mockRpc, auth: { getUser: mockGetUser } };
    resetBuilder();
    resolveWith([]);
  });

  it("calls from with messages table filtered by conversation_id", async () => {
    resolveWith([]);
    await getMessages("conv-1");
    expect(mockFrom).toHaveBeenCalledWith("messages");
    expect(mockBuilder.eq).toHaveBeenCalledWith("conversation_id", "conv-1");
    expect(mockBuilder.order).toHaveBeenCalledWith("created_at", { ascending: true });
  });

  it("returns messages array", async () => {
    const fakeMsgs = [
      { id: "m1", conversation_id: "conv-1", sender_id: "u1", body: "Hello", created_at: "2026-01-01" },
    ];
    resolveWith(fakeMsgs);
    const result = await getMessages("conv-1");
    expect(result).toEqual(fakeMsgs);
  });
});

describe("sendMessage", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(sendMessage({ conversationId: "c1", body: "Hi" })).rejects.toThrow("You must be logged in");
  });

  it("throws on empty body", async () => {
    mockAuthedUser();
    await expect(sendMessage({ conversationId: "c1", body: "   " })).rejects.toThrow("Message body must not be empty");
  });

  it("inserts a message and returns it", async () => {
    mockAuthedUser("user-123");
    const fakeMsg = { id: "m1", conversation_id: "c1", sender_id: "user-123", body: "Hi", created_at: "2026-01-01" };
    resolveWith(fakeMsg);
    mockBuilder.single.mockImplementation(() => Promise.resolve({ data: fakeMsg, error: null }));
    mockBuilder.update.mockReturnValue(mockBuilder);
    mockBuilder.eq.mockReturnValue(mockBuilder);

    const result = await sendMessage({ conversationId: "c1", body: "Hi" });
    expect(result).toEqual(fakeMsg);
    expect(mockBuilder.insert).toHaveBeenCalled();
  });
});

describe("createConversation", () => {
  it("throws when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(createConversation({ participantId: "u2" })).rejects.toThrow("You must be logged in");
  });

  it("creates conversation and participants", async () => {
    mockAuthedUser("user-123");
    const fakeConv = { id: "conv-1", campaign_id: null, created_by: "user-123", created_at: "2026-01-01", updated_at: "2026-01-01" };
    resolveWith(fakeConv);
    mockBuilder.single.mockImplementation(() => Promise.resolve({ data: fakeConv, error: null }));
    mockBuilder.insert.mockReturnValue(mockBuilder);

    const result = await createConversation({ participantId: "u2" });
    expect(result).toEqual(fakeConv);
    expect(mockFrom).toHaveBeenCalledWith("conversations");
    expect(mockFrom).toHaveBeenCalledWith("conversation_participants");
  });
});
