import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  buildGroqMessages,
  getGroqClient,
  GROQ_MODEL
} from "@/lib/ai/groq";
import type { ChatMessage } from "@/types/chat";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseKey || !accessToken) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseKey);
    const { data: authData, error: authError } = await authClient.auth.getUser(
      accessToken
    );

    if (authError || !authData.user || authData.user.is_anonymous) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as { messages?: ChatMessage[] };
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const sanitizedMessages = messages
      .filter(
        (message) =>
          message &&
          (message.role === "user" || message.role === "assistant") &&
          typeof message.content === "string"
      )
      .map((message) => ({
        role: message.role,
        content: message.content.trim()
      }))
      .filter((message) => message.content.length > 0)
      .slice(-40);

    if (sanitizedMessages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 }
      );
    }

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages: buildGroqMessages(sanitizedMessages),
      temperature: 0.7,
      max_completion_tokens: 2048,
      stream: false
    });

    const content = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      message: {
        role: "assistant",
        content
      },
      model: completion.model
    });
  } catch (error) {
    console.error("Aperonix chat error:", error);

    const message =
      error instanceof Error ? error.message : "Unknown server error.";

    if (message === "GROQ_API_KEY is not configured.") {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not configured." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Aperonix could not complete that request." },
      { status: 500 }
    );
  }
}
