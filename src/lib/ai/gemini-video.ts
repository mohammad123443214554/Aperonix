const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_UPLOAD_BASE =
  "https://generativelanguage.googleapis.com/upload/v1beta/files";

const GEMINI_VIDEO_MODEL =
  process.env.GEMINI_VIDEO_MODEL || "gemini-3.8-flash";

const MAX_ANALYSIS_CHARS = 50_000;
const FILE_PROCESSING_TIMEOUT_MS = 240_000;
const GEMINI_UPLOAD_MAX_BYTES = 50 * 1024 * 1024;
const POLL_INTERVAL_MS = 2_000;

type GeminiFile = {
  name?: string;
  uri?: string;
  mimeType?: string;
  state?: string;
  error?: {
    message?: string;
  };
  metadata?: {
    videoMetadata?: {
      videoDuration?: string;
    };
  };
};

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return apiKey;
}

async function readGeminiError(response: Response) {
  try {
    const payload = await response.json();
    return String(
      payload?.error?.message ||
        payload?.message ||
        `Gemini API request failed with HTTP ${response.status}.`
    );
  } catch {
    return `Gemini API request failed with HTTP ${response.status}.`;
  }
}

function parseVideoDuration(value?: string) {
  if (!value) return 0;
  const seconds = Number.parseFloat(value.replace(/s$/i, ""));
  return Number.isFinite(seconds) ? seconds : 0;
}

async function uploadVideoToGemini(
  bytes: Uint8Array,
  mimeType: string,
  displayName: string
) {
  const apiKey = getGeminiApiKey();

  if (bytes.byteLength > GEMINI_UPLOAD_MAX_BYTES) {
    throw new Error(
      "This video is larger than the current Gemini processing limit."
    );
  }

  const startResponse = await fetch(GEMINI_UPLOAD_BASE, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": String(bytes.byteLength),
      "X-Goog-Upload-Header-Content-Type": mimeType,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file: {
        display_name: displayName.slice(0, 512)
      }
    })
  });

  if (!startResponse.ok) {
    throw new Error(await readGeminiError(startResponse));
  }

  const uploadUrl = startResponse.headers.get("x-goog-upload-url");

  if (!uploadUrl) {
    throw new Error("Gemini did not return a resumable upload URL.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "x-goog-upload-offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
      "Content-Length": String(bytes.byteLength),
      "Content-Type": mimeType
    },
    body: Buffer.from(bytes)
  });

  if (!uploadResponse.ok) {
    throw new Error(await readGeminiError(uploadResponse));
  }

  const payload = (await uploadResponse.json()) as {
    file?: GeminiFile;
  };

  if (!payload.file?.name || !payload.file.uri) {
    throw new Error("Gemini returned an incomplete uploaded-file response.");
  }

  return payload.file;
}

async function getGeminiFile(fileName: string) {
  const apiKey = getGeminiApiKey();

  const response = await fetch(
    `${GEMINI_API_BASE}/${fileName}`,
    {
      headers: {
        "x-goog-api-key": apiKey
      },
      cache: "no-store"
    }
  );

  if (!response.ok) {
    throw new Error(await readGeminiError(response));
  }

  return (await response.json()) as GeminiFile;
}

async function waitForGeminiFile(fileName: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < FILE_PROCESSING_TIMEOUT_MS) {
    const file = await getGeminiFile(fileName);

    if (file.state === "ACTIVE") {
      return file;
    }

    if (file.state === "FAILED") {
      throw new Error(
        file.error?.message || "Gemini could not process this video."
      );
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error("Gemini video processing timed out.");
}

async function deleteGeminiFile(fileName: string) {
  try {
    const apiKey = getGeminiApiKey();

    const response = await fetch(
      `${GEMINI_API_BASE}/${fileName}`,
      {
        method: "DELETE",
        headers: {
          "x-goog-api-key": apiKey
        }
      }
    );

    if (!response.ok) {
      console.error(
        "Aperonix Gemini file cleanup error:",
        await readGeminiError(response)
      );
    }
  } catch (error) {
    console.error("Aperonix Gemini file cleanup error:", error);
  }
}

function buildVideoPrompt() {
  return [
    "You are the video-understanding engine for Aperonix AI.",
    "Analyze the ENTIRE uploaded video using both visual information and audio information when available.",
    "Create factual reference material that another AI assistant can use to answer the user's questions about this exact video.",
    "",
    "Include:",
    "- an overall summary of what happens",
    "- important events and scene changes in chronological order",
    "- timestamps in MM:SS format when useful",
    "- clearly visible people, objects, locations, actions, and interactions",
    "- spoken dialogue, narration, important sounds, and other meaningful audio",
    "- readable text, captions, signs, numbers, labels, and UI text",
    "- screens, diagrams, charts, demonstrations, animations, and other important visual details",
    "- details that may be useful for follow-up questions",
    "",
    "Be factual and do not invent details.",
    "If something is uncertain, clearly mark it as uncertain.",
    "Do not claim that you cannot see, watch, or analyze the video. Your job is specifically to analyze the video.",
    "Return only the useful video reference material, not advice about how to analyze it."
  ].join("\n");
}

function normalizeAnalysis(text: string) {
  const cleaned = text.trim();

  if (!cleaned) {
    throw new Error("Gemini returned no video analysis.");
  }

  return cleaned.length > MAX_ANALYSIS_CHARS
    ? cleaned.slice(0, MAX_ANALYSIS_CHARS).trimEnd() +
        "\n[Video analysis truncated for context size.]"
    : cleaned;
}

async function generateVideoAnalysis(
  file: GeminiFile,
  mimeType: string
) {
  const apiKey = getGeminiApiKey();

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_VIDEO_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                file_data: {
                  file_uri: file.uri,
                  mime_type: mimeType
                }
              },
              {
                text: buildVideoPrompt()
              }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 7000,
          thinkingConfig: {
            thinkingLevel: "low"
          }
        }
      })
    }
  );

  if (!response.ok) {
    throw new Error(await readGeminiError(response));
  }

  const payload = await response.json();
  const text = Array.isArray(payload?.candidates?.[0]?.content?.parts)
    ? payload.candidates[0].content.parts
        .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
        .join("")
    : "";

  return normalizeAnalysis(text);
}

export async function analyzeVideoWithGemini(input: {
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
}) {
  const uploaded = await uploadVideoToGemini(
    input.bytes,
    input.mimeType,
    input.fileName
  );

  try {
    const activeFile = await waitForGeminiFile(uploaded.name!);

    return await generateVideoAnalysis(
      activeFile,
      activeFile.mimeType || input.mimeType
    );
  } finally {
    await deleteGeminiFile(uploaded.name!);
  }
}
