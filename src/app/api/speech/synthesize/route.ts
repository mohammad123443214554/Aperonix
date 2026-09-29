import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MAX_INPUT_CHARS = 30000;
const WORDS_PER_CHUNK = 110;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function splitWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function buildChunks(words: string[]) {
  const chunks: string[][] = [];

  for (let index = 0; index < words.length; index += WORDS_PER_CHUNK) {
    chunks.push(words.slice(index, index + WORDS_PER_CHUNK));
  }

  return chunks;
}

function buildSsml(words: string[], startIndex: number) {
  const body = words
    .map(
      (word, index) =>
        `<mark name="w${startIndex + index}"/>${escapeXml(word)}`
    )
    .join(" ");

  return `<speak>${body}</speak>`;
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const googleApiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!supabaseUrl || !supabaseKey || !googleApiKey || !accessToken) {
      return NextResponse.json(
        { error: "Google Cloud Text-to-Speech is not configured." },
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
      languageCode?: string;
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

    const languageCode =
      body.languageCode === "hi-IN" ? "hi-IN" : "en-IN";

    const voiceName = `${languageCode}-Chirp3-HD-Aoede`;
    const words = splitWords(text);
    const wordChunks = buildChunks(words);
    const chunks: Array<{
      audioContent: string;
      timepoints: Array<{ index: number; timeSeconds: number }>;
      words: string[];
    }> = [];

    const chunkWordOffsets: number[] = [];

    for (let chunkIndex = 0; chunkIndex < wordChunks.length; chunkIndex += 1) {
      const chunkWords = wordChunks[chunkIndex];
      const wordOffset = chunkIndex * WORDS_PER_CHUNK;
      chunkWordOffsets.push(wordOffset);

      const response = await fetch(
        "https://texttospeech.googleapis.com/v1beta1/text:synthesize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": googleApiKey
          },
          body: JSON.stringify({
            input: {
              ssml: buildSsml(chunkWords, wordOffset)
            },
            voice: {
              languageCode,
              name: voiceName
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 0.96
            },
            enableTimePointing: ["SSML_MARK"]
          }),
          cache: "no-store"
        }
      );

      const result = await response.json();

      if (!response.ok || !result.audioContent) {
        console.error("Google Cloud TTS error:", result);
        return NextResponse.json(
          { error: "Google Cloud Text-to-Speech could not synthesize this response." },
          { status: 502 }
        );
      }

      const timepoints = Array.isArray(result.timepoints)
        ? result.timepoints
            .map((timepoint: { markName?: string; timeSeconds?: number }) => ({
              index: Number(String(timepoint.markName ?? "").replace("w", "")) - wordOffset,
              timeSeconds: Number(timepoint.timeSeconds ?? 0)
            }))
            .filter(
              (timepoint: { index: number; timeSeconds: number }) =>
                Number.isInteger(timepoint.index) &&
                timepoint.index >= 0 &&
                timepoint.index < chunkWords.length
            )
        : [];

      chunks.push({
        audioContent: result.audioContent,
        timepoints,
        words: chunkWords
      });
    }

    return NextResponse.json({
      chunks,
      words,
      chunkWordOffsets
    });
  } catch (error) {
    console.error("Google Cloud TTS route error:", error);
    return NextResponse.json(
      { error: "Could not start Read Aloud." },
      { status: 500 }
    );
  }
}
