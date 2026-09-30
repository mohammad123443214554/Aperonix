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
    };

    const chatId = typeof body.chatId === "string" ? body.chatId : "";

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat is required." },
        { status: 400 }
      );
    }

    const { data: chat, error: chatError } = await supabase
      .from("chat_sessions")
      .select("id,title")
      .eq("id", chatId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (chatError) {
      console.error("Share chat lookup error:", chatError);
      return NextResponse.json(
        { error: "Could not prepare this chat for sharing." },
        { status: 500 }
      );
    }

    if (!chat) {
      return NextResponse.json(
        { error: "This chat cannot be shared." },
        { status: 404 }
      );
    }

    const { data: messages, error: messagesError } = await supabase
      .from("chat_messages")
      .select("id,role,content,created_at")
      .eq("chat_id", chatId)
      .eq("user_id", authData.user.id)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Share chat messages lookup error:", messagesError);
      return NextResponse.json(
        { error: "Could not load the full chat for sharing." },
        { status: 500 }
      );
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "This chat has no messages to share yet." },
        { status: 400 }
      );
    }

    const snapshot = messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      created_at: message.created_at
    }));

    const { data: existing, error: existingError } = await supabase
      .from("shared_chats")
      .select("id")
      .eq("user_id", authData.user.id)
      .eq("chat_id", chatId)
      .maybeSingle();

    if (existingError) {
      console.error("Shared chat lookup error:", existingError);
      return NextResponse.json(
        { error: "Could not prepare the chat share link." },
        { status: 500 }
      );
    }

    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("shared_chats")
        .update({
          title: chat.title,
          messages: snapshot,
          updated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .eq("user_id", authData.user.id);

      if (updateError) {
        console.error("Shared chat update error:", updateError);
        return NextResponse.json(
          { error: "Could not update the chat share link." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: new URL("/share/" + existing.id, request.url).toString()
      });
    }

    const { data: created, error: createError } = await supabase
      .from("shared_chats")
      .insert({
        user_id: authData.user.id,
        chat_id: chat.id,
        title: chat.title,
        messages: snapshot
      })
      .select("id")
      .single();

    if (createError || !created?.id) {
      console.error("Shared chat create error:", createError);
      return NextResponse.json(
        { error: "Could not create the chat share link." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: new URL("/share/" + created.id, request.url).toString()
    });
  } catch (error) {
    console.error("Share chat API error:", error);

    return NextResponse.json(
      { error: "Could not create the chat share link." },
      { status: 500 }
    );
  }
}
