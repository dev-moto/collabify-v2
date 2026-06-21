import { supabase } from "~/lib/supabase";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type Conversation = {
  id: string;
  campaign_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type ConversationParticipant = {
  conversation_id: string;
  user_id: string;
  created_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ParticipantProfile = {
  user_id: string;
  display_name: string;
};

/** Extended conversation for display: includes latest message preview
 *  and participant info. Display names are resolved via the
 *  security-definer function get_participant_profiles, which bypasses
 *  profiles RLS (self/admin-only) to return id + display_name for
 *  pre-vetted user_ids from conversation_participants. */
export type ConversationWithMeta = {
  id: string;
  participant_ids: string[];
  /** Resolved participant profiles (id + display_name). */
  participants: ParticipantProfile[];
  /** The most recent message body (raw text). */
  last_message: string | null;
  /** The most recent message timestamp. */
  last_message_at: string | null;
  /** Count of unread messages (placeholder — requires schema support). */
  unread_count: number;
};

export type SendMessageInput = {
  conversationId: string;
  body: string;
};

export type CreateConversationInput = {
  participantId: string;
  campaignId?: string;
  initialMessage?: string;
};

/* ------------------------------------------------------------------ */
/*  Services                                                           */
/* ------------------------------------------------------------------ */

/** List conversations the current user participates in, with
 *  last-message preview and participant IDs. */
export async function listConversations(): Promise<ConversationWithMeta[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  // 1. Get conversation IDs the user belongs to
  const { data: memberships, error: memErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .returns<{ conversation_id: string }[]>();

  if (memErr) throw memErr;
  if (!memberships || memberships.length === 0) return [];

  const convIds = memberships.map((m) => m.conversation_id);

  // 2. Fetch conversations
  const { data: conversations, error: convErr } = await supabase
    .from("conversations")
    .select("*")
    .in("id", convIds)
    .order("updated_at", { ascending: false })
    .returns<Conversation[]>();

  if (convErr) throw convErr;
  if (!conversations) return [];

  // 3. Fetch participants for these conversations
  const { data: participants, error: partErr } = await supabase
    .from("conversation_participants")
    .select("*")
    .in("conversation_id", convIds)
    .returns<ConversationParticipant[]>();

  if (partErr) throw partErr;

  // 4. Fetch latest message per conversation (get last 1 message each)
  //    We'll fetch messages for all conversations and deduplicate
  const { data: messages, error: msgErr } = await supabase
    .from("messages")
    .select("*")
    .in("conversation_id", convIds)
    .order("created_at", { ascending: false });

  if (msgErr) throw msgErr;

  // Group participants by conversation
  const participantsByConv: Record<string, string[]> = {};
  const allUserIds = new Set<string>();
  for (const p of participants ?? []) {
    if (!participantsByConv[p.conversation_id]) participantsByConv[p.conversation_id] = [];
    participantsByConv[p.conversation_id].push(p.user_id);
    allUserIds.add(p.user_id);
  }

  // Resolve display names via security-definer RPC
  let profileLookup: Record<string, string> = {};
  if (allUserIds.size > 0) {
    const { data: profiles, error: profileErr } = await supabase
      .rpc("get_participant_profiles", { user_ids: [...allUserIds] })
      .returns<ParticipantProfile[]>();

    if (!profileErr && Array.isArray(profiles)) {
      for (const p of profiles) {
        profileLookup[p.user_id] = p.display_name;
      }
    }
    // If the RPC fails, we silently fall back to participant_ids only
  }

  // Get latest message per conversation
  const latestMessageByConv: Record<string, Message> = {};
  for (const msg of messages ?? []) {
    if (!latestMessageByConv[msg.conversation_id]) {
      latestMessageByConv[msg.conversation_id] = msg;
    }
  }

  return conversations.map((conv) => {
    const pids = participantsByConv[conv.id] ?? [];
    return {
      id: conv.id,
      participant_ids: pids,
      participants: pids.map((uid) => ({
        user_id: uid,
        display_name: profileLookup[uid] ?? "Unknown",
      })),
      last_message: latestMessageByConv[conv.id]?.body ?? null,
      last_message_at: latestMessageByConv[conv.id]?.created_at ?? conv.updated_at,
      unread_count: 0, // TODO: requires read-receipt tracking
    };
  });
}

/** Fetch all messages for a given conversation. */
export async function getMessages(conversationId: string): Promise<Message[]> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .returns<Message[]>();

  if (error) throw error;
  return data ?? [];
}

/** Send a text message in an existing conversation. */
export async function sendMessage(input: SendMessageInput): Promise<Message> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to send a message.");

  const body = input.body.trim();
  if (body.length < 1) throw new Error("Message body must not be empty.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: input.conversationId,
      sender_id: user.id,
      body,
    })
    .select("*")
    .single<Message>();

  if (error) throw error;
  if (!data) throw new Error("Failed to send message.");

  // Touch the conversation's updated_at so it surfaces in lists
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.conversationId);

  return data;
}

/** Create a new conversation with another user, optionally with
 *  a campaign association and an initial message. */
export async function createConversation(input: CreateConversationInput): Promise<Conversation> {
  if (!supabase) throw new Error("Supabase is not configured for this environment.");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) throw userError;
  if (!user) throw new Error("You must be logged in to start a conversation.");

  // 1. Create the conversation
  const { data: conversation, error: convErr } = await supabase
    .from("conversations")
    .insert({
      campaign_id: input.campaignId ?? null,
      created_by: user.id,
    })
    .select("*")
    .single<Conversation>();

  if (convErr) throw convErr;
  if (!conversation) throw new Error("Failed to create conversation.");

  // 2. Add participants (creator + target)
  const participants = [
    { conversation_id: conversation.id, user_id: user.id },
    { conversation_id: conversation.id, user_id: input.participantId },
  ];

  const { error: partErr } = await supabase
    .from("conversation_participants")
    .insert(participants);

  if (partErr) {
    // Clean up conversation if participant insert failed
    await supabase.from("conversations").delete().eq("id", conversation.id);
    throw partErr;
  }

  // 3. Send initial message if provided
  if (input.initialMessage?.trim()) {
    await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      body: input.initialMessage.trim(),
    });
  }

  return conversation;
}
