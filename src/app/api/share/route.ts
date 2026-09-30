import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: "Bearer " + accessToken
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { data: authData, error: authError } =
      await supabase.auth.getUser(accessToken);

    if (authError || !authData.user || authData.user.is_anonymous) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      chatId?: string;
      messageId?: string;
    };

    const chatId = typeof body.chatId === "string" ? body.chatId : "";
    const messageId = typeof body.messageId === "string" ? body.messageId : "";

    if (!chatId || !messageId) {
      return NextResponse.json(
        { error: "Chat and message are required." },
        { status: 400 }
      );
    }

    const { data: message, error: messageError } = await supabase
      .from("chat_messages")
      .select("id,chat_id,user_id,role,content")
      .eq("id", messageId)
      .eq("chat_id", chatId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (messageError) {
      console.error("Share source message lookup error:", messageError);
      return NextResponse.json(
        { error: "Could not prepare this message for sharing." },
        { status: 500 }
      );
    }

    if (!message || (message.role !== "assistant" && message.role !== "user")) {
      return NextResponse.json(
        { error: "This message cannot be shared." },
        { status: 404 }
      );
    }

    const shareKind = message.role === "user" ? "prompt" : "response";

    const { data: existing, error: existingError } = await supabase
      .from("shared_responses")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("message_id", messageId)
      .maybeSingle();

    if (existingError) {
      console.error("Share lookup error:", existingError);
      return NextResponse.json(
        { error: "Could not prepare the share link." },
        { status: 500 }
      );
    }

    if (existing?.id) {
      return NextResponse.json({
        url: new URL("/share/" + existing.id, request.url).toString()
      });
    }

    const { data: created, error: createError } = await supabase
      .from("shared_responses")
      .insert({
        user_id: authData.user.id,
        chat_id: message.chat_id,
        message_id: message.id,
        content: message.content,
        content_type: shareKind
      })
      .select("id")
      .single();

    if (createError || !created?.id) {
      console.error("Share create error:", createError);
      return NextResponse.json(
        { error: "Could not create the share link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: new URL("/share/" + created.id, request.url).toString()
    });
  } catch (error) {
    console.error("Share API error:", error);

    return NextResponse.json(
      { error: "Could not create the share link." },
      { status: 500 }
    );
  }
}
