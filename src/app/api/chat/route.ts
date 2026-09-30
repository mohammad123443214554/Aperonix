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

    // Keep the user's JWT attached to every Supabase request made in
    // this route. Without this, auth.getUser(token) can succeed while
    // The following profiles query is executed as an anonymous request
    // and RLS can hide the saved Aperonix setting.
    const authClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    });

    const { data: authData, error: authError } = await authClient.auth.getUser(
      accessToken
    );

    if (authError || !authData.user || authData.user.is_anonymous) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      messages?: ChatMessage[];
      aperonixSetting?: string;
      branchFromChatId?: string | null;
      branchFromMessageId?: string | null;
    };
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const requestAperonixSetting =
      typeof body.aperonixSetting === "string"
        ? body.aperonixSetting.slice(0, 4000).trim()
        : "";

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
      .filter((message) => message.content.length > 0);

    if (sanitizedMessages.length === 0) {
      return NextResponse.json(
        { error: "At least one message is required." },
        { status: 400 }
      );
    }

    const branchFromChatId =
      typeof body.branchFromChatId === "string" ? body.branchFromChatId : "";
    const branchFromMessageId =
      typeof body.branchFromMessageId === "string" ? body.branchFromMessageId : "";

    let effectiveMessages = sanitizedMessages;

    if (branchFromChatId && branchFromMessageId) {
      const { data: branchMessage, error: branchMessageError } = await authClient
        .from("chat_messages")
        .select("id,chat_id,user_id,role,content,created_at")
        .eq("id", branchFromMessageId)
        .eq("chat_id", branchFromChatId)
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (branchMessageError) {
        console.error("Branch source lookup error:", branchMessageError);
        return NextResponse.json(
          { error: "Could not load the branch conversation memory." },
          { status: 500 }
        );
      }

      if (!branchMessage || branchMessage.role !== "assistant") {
        return NextResponse.json(
          { error: "The selected branch source is no longer available." },
          { status: 400 }
        );
      }

      const { data: earlierRows, error: earlierError } = await authClient
        .from("chat_messages")
        .select("id,role,content,created_at")
        .eq("chat_id", branchFromChatId)
        .eq("user_id", authData.user.id)
        .lt("created_at", branchMessage.created_at)
        .in("role", ["user", "assistant"])
        .order("created_at", { ascending: false })
        .limit(39);

      if (earlierError) {
        console.error("Branch context lookup error:", earlierError);
        return NextResponse.json(
          { error: "Could not load the branch conversation memory." },
          { status: 500 }
        );
      }

      const branchContext = [
        ...(earlierRows ?? []).reverse(),
        {
          id: branchMessage.id,
          role: branchMessage.role,
          content: branchMessage.content,
          created_at: branchMessage.created_at
        }
      ].map((message) => ({
        role: message.role as "user" | "assistant",
        content: message.content
      }));

      effectiveMessages = [...branchContext, ...sanitizedMessages].slice(-40);
    } else {
      effectiveMessages = sanitizedMessages.slice(-40);
    }

    const { data: profileData, error: profileError } = await authClient
      .from("profiles")
      .select("aperonix_setting")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("Aperonix setting load error:", profileError);
    }

    const storedAperonixSetting =
      typeof profileData?.aperonix_setting === "string"
        ? profileData.aperonix_setting.slice(0, 4000).trim()
        : "";

    // The saved profile value is the source of truth. The client value is
    // a fallback for environments where the profile read is temporarily
    // blocked by an RLS/schema issue; it is still bounded and cannot
    // override the protected system prompt.
    const aperonixSetting = storedAperonixSetting || requestAperonixSetting;

    const completion = await getGroqClient().chat.completions.create({
      model: GROQ_MODEL,
      messages: buildGroqMessages(effectiveMessages, aperonixSetting),
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
