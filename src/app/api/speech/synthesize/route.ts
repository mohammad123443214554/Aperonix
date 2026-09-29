import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 30000;
const CHUNK_SIZE = 4500;
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

function splitIntoChunks(text: string) {
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of text.split(/\n{2,}/)) {
    const cleanParagraph = paragraph.trim();
    if (!cleanParagraph) continue;

    if ((current + " " + cleanParagraph).trim().length <= CHUNK_SIZE) {
      current = (current + " " + cleanParagraph).trim();
      continue;
    }

    if (current) chunks.push(current);

    let remainder = cleanParagraph;
    while (remainder.length > CHUNK_SIZE) {
      const slice = remainder.slice(0, CHUNK_SIZE);
      const breakAt = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("! "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf(" "),
        1
      );

      chunks.push(remainder.slice(0, breakAt).trim());
      remainder = remainder.slice(breakAt).trim();
    }

    current = remainder;
  }

  if (current) chunks.push(current);

  return chunks;
}

function buildWordTimepoints(alignment: {
  characters?: string[];
  character_start_times_seconds?: number[];
}) {
  const characters = alignment.characters ?? [];
  const starts = alignment.character_start_times_seconds ?? [];
  const timepoints: Array<{ index: number; timeSeconds: number }> = [];

  let wordIndex = -1;
  let inWord = false;

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index] ?? "";

    if (/\s/u.test(character)) {
      inWord = false;
      continue;
    }

    if (!inWord) {
      wordIndex += 1;
      inWord = true;

      timepoints.push({
        index: wordIndex,
        timeSeconds: Number(starts[index] ?? 0)
      });
    }
  }

  return timepoints;
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID || DEFAULT_VOICE_ID;

    if (!supabaseUrl || !supabaseKey || !elevenLabsApiKey || !accessToken) {
      return NextResponse.json(
        { error: "ElevenLabs Text-to-Speech is not configured." },
        { status: 503 }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { data, error } = await authClient.auth.getUser(accessToken);

    if (error || !data.user || data.user.is_anonymous) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      text?: string;
    };

    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text) {
      return NextResponse.json(
        { error: "Text is required." },
        { status: 400 }
      );
    }

    if (text.length > MAX_INPUT_CHARS) {
      return NextResponse.json(
        { error: "This response is too long for Read Aloud." },
        { status: 400 }
      );
    }

    const textChunks = splitIntoChunks(text);
    const chunks: Array<{
      audioContent: string;
      words: string[];
      timepoints: Array<{ index: number; timeSeconds: number }>;
    }> = [];

    const chunkWordOffsets: number[] = [];
    let globalWordOffset = 0;

    for (const chunkText of textChunks) {
      const words = chunkText.split(/\s+/).filter(Boolean);
      chunkWordOffsets.push(globalWordOffset);

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128&enable_logging=false`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsApiKey
          },
          body: JSON.stringify({
            text: chunkText,
            model_id: "eleven_multilingual_v2"
          }),
          cache: "no-store"
        }
      );

      const result = await response.json();

      if (!response.ok || !result.audio_base64) {
        console.error("ElevenLabs TTS error:", result);
        return NextResponse.json(
          { error: "ElevenLabs could not synthesize this response." },
          { status: 502 }
        );
      }

      chunks.push({
        audioContent: result.audio_base64,
        words,
        timepoints: buildWordTimepoints(result.alignment ?? {})
      });

      globalWordOffset += words.length;
    }

    return NextResponse.json({
      chunks,
      words: text.split(/\s+/).filter(Boolean),
      chunkWordOffsets
    });
  } catch (error) {
    console.error("ElevenLabs TTS route error:", error);

    return NextResponse.json(
      { error: "Could not start Read Aloud." },
      { status: 500 }
    );
  }
}
