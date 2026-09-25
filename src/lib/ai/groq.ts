import Groq from "groq-sdk";

import { APERONIX_SYSTEM_PROMPT } from "./system-prompt";
import type { ChatMessage } from "@/types/chat";

export const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

export function buildGroqMessages(messages: ChatMessage[]) {
  return [
    { role: "system" as const, content: APERONIX_SYSTEM_PROMPT },
    ...messages
      .filter(
        (message) =>
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string"
      )
      .map((message) => ({
        role: message.role,
        content: message.content
      }))
  ];
}

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  return new Groq({ apiKey });
}
