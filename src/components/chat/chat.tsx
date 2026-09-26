"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import { supabase } from "@/lib/supabase/client";
import type { ChatMessage, ChatSession } from "@/types/chat";

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content: "Hi! I’m Aperonix AI. How can I help you today?"
};

function createLocalSession(): ChatSession {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
    isPinned: false
  };
}

function makeTitle(content: string) {
  const cleaned = content.replace(/\s+/g, " ").trim();
  return cleaned.length > 38 ? `${cleaned.slice(0, 38)}…` : cleaned || "New chat";
}

async function ensureAuthenticatedUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || data.user.is_anonymous) {
    throw error ?? new Error("Please sign in to use Aperonix AI.");
  }

  return data.user;
}

export default function Chat({ onSignOut }: { onSignOut: () => Promise<void> }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteSession, setDeleteSession] = useState<ChatSession | null>(null);
  const [renameSession, setRenameSession] = useState<ChatSession | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileEditOpen, setProfileEditOpen] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    phoneCountryCode: "+91",
    phoneNumber: ""
  });
  const [profileDraft, setProfileDraft] = useState(profile);
  const [accountDeleteOpen, setAccountDeleteOpen] = useState(false);
  const [accountDeleting, setAccountDeleting] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    async function loadHistory() {
      try {
        const user = await ensureAuthenticatedUser();

        await supabase.from("profiles").upsert(
          { id: user.id },
          { onConflict: "id" }
        );

        const { data: profileRow } = await supabase
          .from("profiles")
          .select("first_name,last_name,email,date_of_birth,gender,phone_country_code,phone_number")
          .eq("id", user.id)
          .maybeSingle();

        if (profileRow && mounted) {
          setProfile({
            firstName: profileRow.first_name ?? "",
            lastName: profileRow.last_name ?? "",
            email: profileRow.email ?? user.email ?? "",
            dateOfBirth: profileRow.date_of_birth ?? "",
            gender: profileRow.gender ?? "",
            phoneCountryCode: profileRow.phone_country_code ?? "+91",
            phoneNumber: profileRow.phone_number ?? ""
          });
        }

        const { data: chats, error: chatsError } = await supabase
          .from("chat_sessions")
          .select("id,title,created_at,updated_at,is_pinned")
          .eq("user_id", user.id)
          .order("is_pinned", { ascending: false })
          .order("updated_at", { ascending: false });

        if (chatsError) throw chatsError;

        const chatIds = (chats ?? []).map((chat) => chat.id);
        let messageRows: Array<{
          chat_id: string;
          role: ChatMessage["role"];
          content: string;
          created_at: string;
        }> = [];

        if (chatIds.length > 0) {
          const { data: rows, error: messagesError } = await supabase
            .from("chat_messages")
            .select("chat_id,role,content,created_at")
            .in("chat_id", chatIds)
            .order("created_at", { ascending: true });

          if (messagesError) throw messagesError;
          messageRows = rows ?? [];
        }

        const loaded: ChatSession[] = (chats ?? []).map((chat) => ({
          id: chat.id,
          title: chat.title,
          messages: messageRows
            .filter((message) => message.chat_id === chat.id)
            .map(({ role, content }) => ({ role, content })),
          createdAt: new Date(chat.created_at).getTime(),
          updatedAt: new Date(chat.updated_at).getTime(),
          isPinned: Boolean(chat.is_pinned)
        }));

        if (!mounted) return;

        if (loaded.length > 0) {
          setSessions(loaded);
          setActiveSessionId(loaded[0].id);
        } else {
          const { data: created, error: createError } = await supabase
            .from("chat_sessions")
            .insert({ user_id: user.id, title: "New chat" })
            .select("id,title,created_at,updated_at,is_pinned")
            .single();

          if (createError) throw createError;

          const initial: ChatSession = {
            id: created.id,
            title: created.title,
            messages: [],
            createdAt: new Date(created.created_at).getTime(),
            updatedAt: new Date(created.updated_at).getTime(),
            isPinned: Boolean(created.is_pinned)
          };

          setSessions([initial]);
          setActiveSessionId(initial.id);
        }
      } catch (error) {
        console.error("Aperonix history load error:", error);

        if (!mounted) return;
        const fallback = createLocalSession();
        setSessions([fallback]);
        setActiveSessionId(fallback.id);
      }
    }

    void loadHistory();

    return () => {
      mounted = false;
    };
  }, []);

  const activeSession =
    sessions.find((session) => session.id === activeSessionId) ?? sessions[0];

  const messages = activeSession?.messages.length
    ? activeSession.messages
    : [welcomeMessage];

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading && Boolean(activeSession),
    [input, isLoading, activeSession]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const element = document.querySelector<HTMLTextAreaElement>(
      ".composer textarea"
    );
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 180)}px`;
  }, [input]);

  function selectSession(id: string) {
    if (isLoading) return;
    setActiveSessionId(id);
    setOpenMenuId(null);
    setIsSidebarOpen(false);
  }

  async function handleNewChat() {
    if (isLoading) return;

    try {
      const user = await ensureAuthenticatedUser();
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({ user_id: user.id, title: "New chat" })
        .select("id,title,created_at,updated_at,is_pinned")
        .single();

      if (error) throw error;

      const next: ChatSession = {
        id: data.id,
        title: data.title,
        messages: [],
        createdAt: new Date(data.created_at).getTime(),
        updatedAt: new Date(data.updated_at).getTime(),
        isPinned: Boolean(data.is_pinned)
      };

      setSessions((current) => [next, ...current]);
      setActiveSessionId(next.id);
    } catch (error) {
      console.error("New chat error:", error);
    }

    setInput("");
    setOpenMenuId(null);
    setIsSidebarOpen(false);
  }

  function handleDelete(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);
    setDeleteSession(session);
  }

  async function confirmDelete() {
    if (!deleteSession || isLoading) return;

    const session = deleteSession;
    setDeleteSession(null);

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", session.id);

    if (error) {
      console.error("Delete chat error:", error);
      return;
    }

    const remaining = sessions.filter((item) => item.id !== session.id);
    setSessions(remaining);

    if (session.id === activeSessionId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
      } else {
        await handleNewChat();
      }
    }
  }

  function handleRename(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);
    setRenameSession(session);
    setRenameValue(session.title);
  }

  async function confirmRename() {
    if (!renameSession || isLoading) return;

    const nextTitle = renameValue.trim();
    if (!nextTitle || nextTitle === renameSession.title) {
      setRenameSession(null);
      return;
    }

    const session = renameSession;
    const { error } = await supabase
      .from("chat_sessions")
      .update({ title: nextTitle, updated_at: new Date().toISOString() })
      .eq("id", session.id);

    if (error) {
      console.error("Rename chat error:", error);
      return;
    }

    setSessions((current) =>
      current.map((item) =>
        item.id === session.id
          ? { ...item, title: nextTitle, updatedAt: Date.now() }
          : item
      )
    );
    setRenameSession(null);
  }

  async function handlePin(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);

    const nextPinned = !session.isPinned;
    const { error } = await supabase
      .from("chat_sessions")
      .update({
        is_pinned: nextPinned,
        updated_at: new Date().toISOString()
      })
      .eq("id", session.id);

    if (error) {
      console.error("Pin chat error:", error);
      return;
    }

    setSessions((current) =>
      [...current.map((item) =>
        item.id === session.id
          ? { ...item, isPinned: nextPinned, updatedAt: Date.now() }
          : item
      )].sort(
        (a, b) =>
          Number(b.isPinned) - Number(a.isPinned) ||
          b.updatedAt - a.updatedAt
      )
    );
  }

  async function handleDuplicate(session: ChatSession) {
    if (isLoading) return;
    setOpenMenuId(null);

    try {
      const user = await ensureAuthenticatedUser();
      const title = `${session.title} (copy)`;

      const { data: copy, error: chatError } = await supabase
        .from("chat_sessions")
        .insert({
          user_id: user.id,
          title,
          is_pinned: false
        })
        .select("id,title,created_at,updated_at,is_pinned")
        .single();

      if (chatError) throw chatError;

      const messagesToCopy = session.messages
        .filter((message) => message.role !== "system")
        .map((message) => ({
          chat_id: copy.id,
          user_id: user.id,
          role: message.role,
          content: message.content
        }));

      if (messagesToCopy.length > 0) {
        const { error: messageError } = await supabase
          .from("chat_messages")
          .insert(messagesToCopy);

        if (messageError) throw messageError;
      }

      const duplicate: ChatSession = {
        id: copy.id,
        title: copy.title,
        messages: session.messages,
        createdAt: new Date(copy.created_at).getTime(),
        updatedAt: new Date(copy.updated_at).getTime(),
        isPinned: false
      };

      setSessions((current) => [duplicate, ...current]);
      setActiveSessionId(duplicate.id);
    } catch (error) {
      console.error("Duplicate chat error:", error);
    }
  }

  async function saveProfile() {
    if (profileSaving) return;

    setProfileSaving(true);
    const { data: userData } = await supabase.auth.getUser();

    if (!userData.user) {
      setProfileSaving(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        first_name: profileDraft.firstName.trim(),
        last_name: profileDraft.lastName.trim(),
        date_of_birth: profileDraft.dateOfBirth || null,
        gender: profileDraft.gender || null,
        phone_country_code: profileDraft.phoneCountryCode || "+91",
        phone_number: profileDraft.phoneNumber.replace(/\D/g, "")
      })
      .eq("id", userData.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
      setProfileSaving(false);
      return;
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        first_name: profileDraft.firstName.trim(),
        last_name: profileDraft.lastName.trim(),
        date_of_birth: profileDraft.dateOfBirth || null,
        gender: profileDraft.gender || null,
        phone_country_code: profileDraft.phoneCountryCode || "+91",
        phone_number: profileDraft.phoneNumber.replace(/\D/g, "")
      }
    });

    if (metadataError) {
      console.error("Profile metadata update error:", metadataError);
    }

    setProfile({
      ...profileDraft,
      firstName: profileDraft.firstName.trim(),
      lastName: profileDraft.lastName.trim(),
      phoneNumber: profileDraft.phoneNumber.replace(/\D/g, "")
    });
    setProfileSaving(false);
    setProfileEditOpen(false);
  }

  async function deleteAccount() {
    if (accountDeleting) return;

    setAccountDeleting(true);

    try {
      let { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const refreshed = await supabase.auth.refreshSession();
        sessionData = refreshed.data;
      }

      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error("Your session has expired.");

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete the account.");
      }

      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Account deletion error:", error);
      setAccountDeleting(false);
    }
  }

  function openProfileEditor() {
    setProfileDraft(profile);
    setProfileEditOpen(true);
    setProfileOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();
    if (!content || isLoading || !activeSession) return;

    setInput("");
    setIsLoading(true);

    try {
      const user = await ensureAuthenticatedUser();
      const nextMessages: ChatMessage[] = [
        ...activeSession.messages,
        { role: "user", content }
      ];

      const newTitle =
        activeSession.title === "New chat"
          ? makeTitle(content)
          : activeSession.title;

      const { error: messageError } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: activeSession.id,
          user_id: user.id,
          role: "user",
          content
        });

      if (messageError) throw messageError;

      await supabase
        .from("chat_sessions")
        .update({
          title: newTitle,
          updated_at: new Date().toISOString()
        })
        .eq("id", activeSession.id);

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                title: newTitle,
                messages: nextMessages,
                updatedAt: Date.now()
              }
            : session
        )
      );

      let { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        const refreshed = await supabase.auth.refreshSession();
        sessionData = refreshed.data;
      }

      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ messages: nextMessages })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.message?.content || "I could not generate a response."
      };

      const { error: assistantSaveError } = await supabase
        .from("chat_messages")
        .insert({
          chat_id: activeSession.id,
          user_id: user.id,
          role: "assistant",
          content: assistantMessage.content
        });

      if (assistantSaveError) throw assistantSaveError;

      await supabase
        .from("chat_sessions")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeSession.id);

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                messages: [...session.messages, assistantMessage],
                updatedAt: Date.now()
              }
            : session
        )
      );
    } catch (error) {
      console.error("Aperonix chat error:", error);

      setSessions((current) =>
        current.map((session) =>
          session.id === activeSession.id
            ? {
                ...session,
                messages: [
                  ...session.messages,
                  {
                    role: "assistant",
                    content: "Sorry, something went wrong. Please try again."
                  }
                ],
                updatedAt: Date.now()
              }
            : session
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="chat-shell" onClick={() => openMenuId && setOpenMenuId(null)}>
      <aside className={`sidebar ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <img src="/aperonix-logo.png" alt="Aperonix AI logo" />
            <div>
              <strong>Aperonix AI</strong>
              <span>AI assistant</span>
            </div>
          </div>

          <button
            className="new-chat-sidebar"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void handleNewChat();
            }}
            disabled={isLoading}
          >
            <span className="new-chat-icon">＋</span>
            <span>New chat</span>
          </button>
        </div>

        <div className="history">
          <div className="history-heading">Chat history</div>

          <div className="history-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`history-item-wrap ${session.id === activeSession?.id ? "active" : ""}`}
              >
                <button
                  type="button"
                  className="history-item"
                  onClick={() => selectSession(session.id)}
                  title={session.title}
                >
                  <span className="history-icon">{session.isPinned ? "📌" : "◌"}</span>
                  <span>{session.title}</span>
                </button>

                <button
                  type="button"
                  className="history-menu-button"
                  aria-label={`Options for ${session.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setOpenMenuId((current) =>
                      current === session.id ? null : session.id
                    );
                  }}
                >
                  ⋯
                </button>

                {openMenuId === session.id && (
                  <div
                    className="history-menu"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <button type="button" onClick={() => void handleDuplicate(session)}>
                      Duplicate
                    </button>
                    <button type="button" onClick={() => void handleRename(session)}>
                      Rename
                    </button>
                    <button type="button" onClick={() => void handlePin(session)}>
                      {session.isPinned ? "Unpin chat" : "Pin chat"}
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => void handleDelete(session)}
                    >
                      Delete chat
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="profile-trigger"
          onClick={() => setProfileOpen((current) => !current)}
          aria-expanded={profileOpen}
        >
          <span className="profile-avatar">
            {(profile.firstName || profile.lastName || profile.email || "A").charAt(0).toUpperCase()}
          </span>
          <span className="profile-summary">
            <strong>{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your profile"}</strong>
            <small>{profile.email || "Account"}</small>
          </span>
          <span className="profile-chevron">›</span>
        </button>

        {profileOpen && (
          <div className="profile-popover" role="dialog" aria-label="Profile">
            <div className="profile-popover-head">
              <span className="profile-avatar large">
                {(profile.firstName || profile.lastName || profile.email || "A").charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>{[profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Your profile"}</strong>
                <small>{profile.email}</small>
              </div>
            </div>
            <button type="button" onClick={() => setProfileOpen(false)}>Profile details</button>
            <button type="button" onClick={openProfileEditor}>Edit profile</button>
            <button type="button" onClick={() => void onSignOut()} disabled={isLoading}>Sign out</button>
            <button
              type="button"
              className="danger"
              onClick={() => {
                setProfileOpen(false);
                setAccountDeleteOpen(true);
              }}
            >
              Delete account
            </button>
          </div>
        )}
      </aside>

      {isSidebarOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Close sidebar"
          type="button"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <section className="chat-main">
        <header className="topbar">
          <button
            className="menu-button"
            type="button"
            aria-label="Open chat history"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>

          <div className="mobile-title">
            <span>{activeSession?.title || "Aperonix AI"}</span>
          </div>
        </header>

        <section className="messages" aria-live="polite">
          <div className="messages-inner">
            {messages.map((message, index) => (
              <article
                key={`${activeSession?.id}-${message.role}-${index}`}
                className={`message-row ${message.role}`}
              >
                {message.role === "assistant" && (
                  <img src="/aperonix-logo.png" alt="" className="avatar" />
                )}

                {message.role === "assistant" ? (
                  <div className="assistant-content">
                    <div className="message-label">Aperonix</div>
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="user-bubble">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </article>
            ))}

            {isLoading && (
              <article className="message-row assistant">
                <img src="/aperonix-logo.png" alt="" className="avatar" />
                <div className="assistant-content">
                  <div className="message-label">Aperonix</div>
                  <div className="typing" aria-label="Aperonix is typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </article>
            )}

            <div ref={messagesEndRef} />
          </div>
        </section>

        <div className="composer-wrap">
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Message Aperonix AI..."
              rows={1}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              aria-label="Message Aperonix AI"
            />

            <button
              type="submit"
              className="send-button"
              disabled={!canSend}
              aria-label="Send message"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.4 3.7 4.1 10.2c-.7.3-.7 1.3 0 1.6l6.2 2.3 2.3 6.2c.3.7 1.3.7 1.6 0l6.5-16.3c.3-.8-.1-1.1-.3-1.1Z" />
              </svg>
            </button>
          </form>

          <p className="composer-note">
            Aperonix AI can make mistakes. Check important information.
          </p>
        </div>
      </section>

      {profileOpen && (
        <button
          className="profile-screen-backdrop"
          type="button"
          aria-label="Close profile menu"
          onClick={() => setProfileOpen(false)}
        />
      )}

      {profileEditOpen && (
        <div className="account-modal-backdrop" role="presentation">
          <div className="account-modal profile-detail-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title">
            <div className="account-modal-head">
              <div>
                <span className="hero-kicker">Your account</span>
                <h2 id="profile-title">Profile details</h2>
              </div>
              <button type="button" className="modal-close" onClick={() => setProfileEditOpen(false)}>×</button>
            </div>

            <div className="profile-details-grid">
              <label>
                First name
                <input value={profileDraft.firstName} onChange={(event) => setProfileDraft({ ...profileDraft, firstName: event.target.value })} />
              </label>
              <label>
                Last name
                <input value={profileDraft.lastName} onChange={(event) => setProfileDraft({ ...profileDraft, lastName: event.target.value })} />
              </label>
              <label className="full">
                Email
                <input value={profile.email} readOnly />
                <small>Account email cannot be edited here.</small>
              </label>
              <label>
                Date of birth
                <input type="date" value={profileDraft.dateOfBirth} onChange={(event) => setProfileDraft({ ...profileDraft, dateOfBirth: event.target.value })} />
              </label>
              <label>
                Gender
                <select value={profileDraft.gender} onChange={(event) => setProfileDraft({ ...profileDraft, gender: event.target.value })}>
                  <option value="">Not set</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Non-binary</option>
                  <option>Other</option>
                  <option>Prefer not to say</option>
                </select>
              </label>
              <label className="full">
                Phone
                <div className="profile-phone-row">
                  <input value={profileDraft.phoneCountryCode} onChange={(event) => setProfileDraft({ ...profileDraft, phoneCountryCode: event.target.value })} placeholder="+91" />
                  <input inputMode="numeric" value={profileDraft.phoneNumber} onChange={(event) => setProfileDraft({ ...profileDraft, phoneNumber: event.target.value.replace(/\D/g, "").slice(0, 15) })} placeholder="Phone number" />
                </div>
              </label>
            </div>

            <div className="account-modal-actions">
              <button type="button" className="modal-secondary" onClick={() => setProfileEditOpen(false)}>Cancel</button>
              <button type="button" className="modal-primary" onClick={() => void saveProfile()} disabled={profileSaving}>
                {profileSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {accountDeleteOpen && (
        <div className="account-modal-backdrop" role="presentation">
          <div className="account-modal danger-modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title">
            <div className="danger-icon">!</div>
            <h2 id="delete-account-title">Delete your account?</h2>
            <p>This permanently removes your Aperonix account, chats, profile data and access. This action cannot be undone.</p>
            <div className="account-modal-actions">
              <button type="button" className="modal-secondary" onClick={() => setAccountDeleteOpen(false)} disabled={accountDeleting}>Cancel</button>
              <button type="button" className="modal-danger" onClick={() => void deleteAccount()} disabled={accountDeleting}>
                {accountDeleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteSession && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setDeleteSession(null)}>
          <div className="chat-modal" role="dialog" aria-modal="true" aria-labelledby="delete-chat-title" onClick={(event) => event.stopPropagation()}>
            <div className="chat-modal-title" id="delete-chat-title">Delete chat?</div>
            <p>This will also delete all messages in this chat.</p>
            <div className="chat-modal-actions">
              <button type="button" onClick={() => setDeleteSession(null)}>Cancel</button>
              <button type="button" className="danger" onClick={() => void confirmDelete()}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {renameSession && (
        <div className="chat-modal-backdrop" role="presentation" onClick={() => setRenameSession(null)}>
          <div className="chat-modal" role="dialog" aria-modal="true" aria-labelledby="rename-chat-title" onClick={(event) => event.stopPropagation()}>
            <div className="chat-modal-title" id="rename-chat-title">Rename chat</div>
            <input
              className="chat-modal-input"
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void confirmRename();
                }
                if (event.key === "Escape") setRenameSession(null);
              }}
              autoFocus
              maxLength={80}
            />
            <div className="chat-modal-actions">
              <button type="button" onClick={() => setRenameSession(null)}>Cancel</button>
              <button type="button" className="primary" onClick={() => void confirmRename()}>Save</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
