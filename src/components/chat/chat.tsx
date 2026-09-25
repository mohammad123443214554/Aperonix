"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import type { ChatMessage } from "@/types/chat";

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content: "Hi! I’m Aperonix AI. How can I help you today?"
};

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isLoading,
    [input, isLoading]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const content = input.trim();
    if (!content || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: data.message?.content || "I could not generate a response."
        }
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? "Sorry, something went wrong. Please try again."
              : "Sorry, something went wrong."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewChat() {
    setMessages([welcomeMessage]);
    setInput("");
  }

  return (
    <main className="chat-shell">
      <header className="topbar">
        <div className="brand">
          <img
            src="/aperonix-logo.png"
            alt="Aperonix AI logo"
            className="brand-logo"
          />
          <div>
            <h1>Aperonix AI</h1>
            <p>AI assistant</p>
          </div>
        </div>

        <button className="new-chat-button" type="button" onClick={handleNewChat}>
          New chat
        </button>
      </header>

      <section className="messages" aria-live="polite">
        <div className="messages-inner">
          {messages.map((message, index) => (
            <article
              key={`${message.role}-${index}`}
              className={`message-row ${message.role}`}
            >
              {message.role === "assistant" && (
                <img src="/aperonix-logo.png" alt="" className="avatar" />
              )}

              <div className="message-bubble">
                <div className="message-label">
                  {message.role === "assistant" ? "Aperonix" : "You"}
                </div>
                <p>{message.content}</p>
              </div>
            </article>
          ))}

          {isLoading && (
            <article className="message-row assistant">
              <img src="/aperonix-logo.png" alt="" className="avatar" />
              <div className="message-bubble typing" aria-label="Aperonix is typing">
                <span />
                <span />
                <span />
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
            ↑
          </button>
        </form>

        <p className="composer-note">
          Aperonix AI can make mistakes. Check important information.
        </p>
      </div>
    </main>
  );
}
