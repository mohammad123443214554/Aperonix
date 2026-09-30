import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SharedMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type SharedItem =
  | {
      kind: "message";
      id: string;
      content: string;
      content_type: "response" | "prompt";
      created_at: string;
    }
  | {
      kind: "chat";
      id: string;
      title: string;
      messages: SharedMessage[];
      created_at: string;
      updated_at: string;
    };

async function getSharedItem(shareId: string): Promise<SharedItem | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  const { data: sharedMessage, error: messageError } = await supabase
    .from("shared_responses")
    .select("id,content,content_type,created_at")
    .eq("id", shareId)
    .maybeSingle();

  if (!messageError && sharedMessage) {
    return {
      kind: "message",
      id: sharedMessage.id,
      content: sharedMessage.content,
      content_type: sharedMessage.content_type as "response" | "prompt",
      created_at: sharedMessage.created_at
    };
  }

  const { data: sharedChat, error: chatError } = await supabase
    .from("shared_chats")
    .select("id,title,messages,created_at,updated_at")
    .eq("id", shareId)
    .maybeSingle();

  if (chatError || !sharedChat) return null;

  const rawMessages = Array.isArray(sharedChat.messages) ? sharedChat.messages : [];
  const messages: SharedMessage[] = rawMessages
    .filter(
      (message): message is {
        id: string;
        role: "user" | "assistant";
        content: string;
        created_at: string;
      } =>
        Boolean(message) &&
        typeof message === "object" &&
        typeof message.id === "string" &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        typeof message.created_at === "string"
    )
    .map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      created_at: message.created_at
    }));

  return {
    kind: "chat",
    id: sharedChat.id,
    title: sharedChat.title,
    messages,
    created_at: sharedChat.created_at,
    updated_at: sharedChat.updated_at
  };
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const shared = await getSharedItem(shareId);

  if (!shared) {
    return {
      title: "Aperonix AI",
      robots: { index: false, follow: false }
    };
  }

  if (shared.kind === "chat") {
    const title = shared.title.trim() || "Shared chat";
    const description = `A complete chat shared from Aperonix AI: ${title}.`;

    return {
      title: "Aperonix AI",
      description,
      robots: { index: false, follow: false },
      openGraph: {
        title: "Aperonix AI",
        description,
        type: "article"
      }
    };
  }

  const description = shared.content
    .replaceAll("#", "")
    .replaceAll("*", "")
    .replaceAll("`", "")
    .replaceAll("\n", " ")
    .slice(0, 155);

  const fallback =
    shared.content_type === "prompt"
      ? "A prompt shared from Aperonix AI."
      : "A response shared from Aperonix AI.";

  return {
    title: "Aperonix AI",
    description: description || fallback,
    robots: { index: false, follow: false },
    openGraph: {
      title: "Aperonix AI",
      description: description || fallback,
      type: "article"
    }
  };
}

export default async function SharedResponsePage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const shared = await getSharedItem(shareId);

  if (!shared) notFound();

  return (
    <main className="shared-response-page">
      <div className="shared-response-orb shared-response-orb-one" aria-hidden="true" />
      <div className="shared-response-orb shared-response-orb-two" aria-hidden="true" />

      <div className="shared-response-shell">
        <header className="shared-response-brand" aria-label="Aperonix AI">
          <img src="/aperonix-logo.png" alt="" />
          <span>Aperonix AI</span>
        </header>

        <section className="shared-response-card" aria-labelledby="shared-response-title">
          <div className="shared-response-heading">
            <span className="shared-response-kicker">APERONIX AI</span>
            <h1 id="shared-response-title">
              {shared.kind === "chat"
                ? "Shared chat"
                : shared.content_type === "prompt"
                  ? "Shared prompt"
                  : "Shared response"}
            </h1>
            <p>
              {shared.kind === "chat"
                ? "A complete conversation shared from Aperonix AI."
                : shared.content_type === "prompt"
                  ? "A prompt shared from Aperonix AI."
                  : "A response shared from Aperonix AI."}
            </p>
          </div>

          {shared.kind === "chat" ? (
            <article className="shared-response-content shared-chat-content">
              <div className="shared-chat-title">{shared.title}</div>

              <div className="shared-chat-transcript">
                {shared.messages.map((message) => (
                  <section
                    key={message.id}
                    className={`shared-chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`}
                  >
                    <div className="shared-chat-role">
                      {message.role === "user" ? "User" : "Aperonix AI"}
                    </div>
                    <div className="shared-chat-message-content">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  </section>
                ))}
              </div>
            </article>
          ) : (
            <article className="shared-response-content">
              <ReactMarkdown>{shared.content}</ReactMarkdown>
            </article>
          )}

          <div className="shared-response-footer">
            <a className="shared-response-open" href="/">
              Open Aperonix AI
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <p className="shared-response-note">
          {shared.kind === "chat"
            ? "Only this complete conversation was shared. Other private chats are not included."
            : shared.content_type === "prompt"
              ? "Only this prompt was shared. Private chat history is not included."
              : "Only this response was shared. Private chat history is not included."}
        </p>
      </div>
    </main>
  );
}
