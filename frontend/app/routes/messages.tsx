import { useEffect, useMemo, useRef, useState } from "react";
import { MessageSquarePlus, Paperclip, Send } from "lucide-react";
import { AppShell, Badge, Button, Card, Field, ProtectedRoute, StatusPanel } from "~/components/ui";
import { useAppSelector } from "~/store/hooks";
import { supabase } from "~/lib/supabase";
import {
  listConversations,
  getMessages,
  sendMessage,
  createConversation,
  type ConversationWithMeta,
  type Message,
  type ParticipantProfile,
} from "~/services/messagesService";

export function meta() { return [{ title: "Messages | Collabify" }]; }

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function otherParticipants(participants: ParticipantProfile[], currentUserId?: string): string {
  const others = participants.filter((p) => p.user_id !== currentUserId);
  if (others.length === 0) return "You";
  return others.map((p) => p.display_name).join(", ");
}

function participantName(participants: ParticipantProfile[], userId: string): string {
  return participants.find((p) => p.user_id === userId)?.display_name ?? "Unknown";
}

/** Render text with clickable links. */
function LinkedText({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  const parts = text.split(urlRegex);
  return (
    <>
      {parts.map((part, i) =>
        urlRegex.test(part)
          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-cyan-300">{part}</a>
          : part,
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

export default function Messages() {
  const currentUserId = useAppSelector((state) => state.session.user?.id);
  const profile = useAppSelector((s) => s.session.profile);
  const role = profile?.role ?? "creator";

  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newBody, setNewBody] = useState("");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");
  const [messagesStatus, setMessagesStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [messagesError, setMessagesError] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New conversation dialog state
  const [showNewConv, setShowNewConv] = useState(false);
  const [newConvUserId, setNewConvUserId] = useState("");
  const [newConvMessage, setNewConvMessage] = useState("");
  const [creating, setCreating] = useState(false);

  /* ---- Load initial data ---- */

  useEffect(() => {
    listConversations()
      .then((data) => {
        setConversations(data);
        setStatus("success");
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load conversations.");
        setStatus("error");
      });
  }, []);

  /* ---- Load messages for active conversation ---- */

  useEffect(() => {
    if (!activeId) return;
    setMessagesStatus("loading");
    setMessagesError("");
    getMessages(activeId)
      .then((data) => {
        setMessages(data);
        setMessagesStatus("success");
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setMessagesError(err instanceof Error ? err.message : "Failed to load messages.");
        setMessagesStatus("error");
      });
  }, [activeId]);

  /* ---- Realtime subscription for new messages ---- */

  useEffect(() => {
    if (!activeId) return;
    const client = supabase;
    if (!client) {
      console.warn("Supabase not configured — realtime subscriptions disabled.");
      return;
    }

    const channel = client
      .channel(`messages:${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [activeId]);

  /* ---- Auto-scroll to bottom when new messages arrive ---- */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ---- Send message ---- */

  async function handleSend() {
    if (!activeId || !newBody.trim()) return;
    setSending(true);
    try {
      const msg = await sendMessage({ conversationId: activeId, body: newBody.trim() });
      setMessages((prev) => [...prev, msg]);
      setNewBody("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  }

  /* ---- Create conversation ---- */

  async function handleCreateConversation() {
    if (!newConvUserId.trim()) return;
    setCreating(true);
    try {
      const conv = await createConversation({
        participantId: newConvUserId.trim(),
        initialMessage: newConvMessage.trim() || undefined,
      });
      // Refresh conversation list and select the new one
      const updated = await listConversations();
      setConversations(updated);
      setActiveId(conv.id);
      setShowNewConv(false);
      setNewConvUserId("");
      setNewConvMessage("");
    } catch (err) {
      console.error("Failed to create conversation:", err);
    } finally {
      setCreating(false);
    }
  }

  /* ---- Derived data ---- */

  const activeConversation = conversations.find((c) => c.id === activeId);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort(
      (a, b) => new Date(b.last_message_at ?? b.id).getTime() - new Date(a.last_message_at ?? a.id).getTime(),
    );
  }, [conversations]);

  /* ---- Render ---- */

  return (
    <ProtectedRoute>
      <AppShell role={role} title="Messages" description="Participant-only conversations with realtime message delivery.">
        {status === "loading" && <StatusPanel type="loading" title="Loading conversations" message="Please wait while we load your messages." />}
        {status === "error" && <StatusPanel type="error" title="Failed to load" message={error} />}
        {status === "success" && conversations.length === 0 && (
          <div className="mt-6">
            <StatusPanel type="empty" title="No conversations yet" message="Start a conversation with a creator or business." />
            <div className="mt-4 flex justify-center">
              <Button type="button" onClick={() => setShowNewConv(true)}>
                <MessageSquarePlus className="h-4 w-4" /> New conversation
              </Button>
            </div>
          </div>
        )}
        {status === "success" && conversations.length > 0 && (
          <div className="mt-6 grid min-h-[620px] gap-6 lg:grid-cols-[340px_1fr]">
            {/* Conversation sidebar */}
            <Card>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">Conversations</h2>
                <Button type="button" onClick={() => setShowNewConv(true)} className="!p-2" aria-label="New conversation">
                  <MessageSquarePlus className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-4 grid gap-2">
                {sortedConversations.map((c) => {
                  const title = otherParticipants(c.participants, currentUserId);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`rounded-2xl p-3 text-left hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-cyan-400 dark:hover:bg-white/10 ${activeId === c.id ? "bg-slate-100 dark:bg-white/15" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                          {title.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2">
                            <b className="truncate text-sm">{title}</b>
                            {c.unread_count > 0 && <Badge tone="cyan">{c.unread_count}</Badge>}
                          </div>
                          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                            {c.last_message ?? "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Active conversation */}
            <Card className="flex flex-col">
              {activeConversation ? (
                <>
                  <div className="border-b border-slate-200 pb-4 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                        {otherParticipants(activeConversation.participants, currentUserId).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-lg font-black">
                          {otherParticipants(activeConversation.participants, currentUserId)}
                        </h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Badge tone="green">Participant-only</Badge>
                          <span>{activeConversation.participants.length} participant{activeConversation.participants.length !== 1 ? "s" : ""}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 space-y-4 py-5">
                    {messagesStatus === "loading" && (
                      <StatusPanel type="loading" title="Loading messages" message="Fetching conversation history." />
                    )}
                    {messagesStatus === "error" && (
                      <StatusPanel type="error" title="Failed to load messages" message={messagesError} />
                    )}
                    {messagesStatus === "success" && messages.length === 0 && (
                      <p className="text-center text-sm text-slate-500">No messages yet. Send one to start the conversation.</p>
                    )}
                    {messagesStatus === "success" && messages.map((msg) => {
                      const isMine = msg.sender_id === currentUserId;
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          <span className="mb-1 px-1 text-xs text-slate-400">
                            {isMine ? "You" : participantName(activeConversation.participants, msg.sender_id)}
                          </span>
                          <p
                            className={`max-w-md rounded-2xl p-4 text-sm break-words ${
                              isMine
                                ? "bg-cyan-600 text-white"
                                : "bg-slate-100 dark:bg-white/10"
                            }`}
                          >
                            <LinkedText text={msg.body} />
                          </p>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  <form
                    className="flex gap-2"
                    noValidate
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Attach file"
                      className="rounded-full p-3 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>
                    <input
                      aria-label="Message"
                      className="min-w-0 flex-1 rounded-full border border-slate-200 px-4 py-3 dark:border-white/10 dark:bg-white/10"
                      placeholder="Write a text message or paste a safe link"
                      value={newBody}
                      onChange={(e) => setNewBody(e.currentTarget.value ?? "")}
                    />
                    <Button type="submit" disabled={sending || !newBody.trim()}>
                      <Send className="h-4 w-4" /> {sending ? "Sending..." : "Send"}
                    </Button>
                  </form>
                  <p className="mt-2 text-xs text-slate-500">
                    Attachments are UI-ready and must pass storage policy restrictions before upload.
                  </p>
                </>
              ) : (
                <StatusPanel type="empty" title="Select a conversation" message="Choose a conversation from the list to view messages." />
              )}
            </Card>
          </div>
        )}

        {/* ---- New conversation dialog ---- */}
        {showNewConv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowNewConv(false)}>
            <div className="mx-4 w-full max-w-md rounded-3xl bg-white p-6 dark:bg-slate-900" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-black">New conversation</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Enter the user ID of the creator or business you want to message.
              </p>
              <div className="mt-4 grid gap-4">
                <Field label="User ID">
                  <input
                    className="w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={newConvUserId}
                    onChange={(e) => setNewConvUserId(e.currentTarget.value ?? "")}
                    placeholder="Paste the user's UUID"
                    required
                  />
                </Field>
                <Field label="Initial message (optional)">
                  <textarea
                    className="min-h-24 w-full rounded-2xl border p-3 dark:border-white/10 dark:bg-white/10"
                    value={newConvMessage}
                    onChange={(e) => setNewConvMessage(e.currentTarget.value ?? "")}
                    placeholder="Say hello..."
                  />
                </Field>
                <div className="flex gap-3">
                  <Button type="button" variant="secondary" onClick={() => setShowNewConv(false)}>
                    Cancel
                  </Button>
                  <Button type="button" disabled={creating || !newConvUserId.trim()} onClick={handleCreateConversation}>
                    {creating ? "Starting..." : "Start conversation"}
                  </Button>
                </div>
                {role === "business" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Only verified businesses can initiate outreach. Make sure your business verification is approved.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
