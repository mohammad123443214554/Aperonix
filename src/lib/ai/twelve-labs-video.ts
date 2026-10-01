const TWELVE_LABS_API_BASE = "https://api.twelvelabs.io/v1.3";

const TWELVE_LABS_MODEL = "pegasus1.5";
const MAX_ANALYSIS_CHARS = 50_000;
const ANALYSIS_TIMEOUT_MS = 240_000;

function getTwelveLabsApiKey() {
  const apiKey = process.env.TWELVELABS_API_KEY;

  if (!apiKey) {
    throw new Error("TWELVELABS_API_KEY is not configured.");
  }

  return apiKey;
}

async function readTwelveLabsError(response: Response) {
  try {
    const payload = await response.json();
    return String(
      payload?.error?.message ||
        payload?.message ||
        payload?.detail ||
        `Twelve Labs API request failed with HTTP ${response.status}.`
    );
  } catch {
    return `Twelve Labs API request failed with HTTP ${response.status}.`;
  }
}

function normalizeAnalysis(text: string) {
  const cleaned = text.trim();

  if (!cleaned) {
    throw new Error("Twelve Labs returned no video analysis.");
  }

  return cleaned.length > MAX_ANALYSIS_CHARS
    ? cleaned.slice(0, MAX_ANALYSIS_CHARS).trimEnd() +
        "\n[Video analysis truncated for context size.]"
    : cleaned;
}

function buildVideoPrompt() {
  return [
    "You are the video-understanding engine for Aperonix AI.",
    "Analyze the ENTIRE uploaded video using visual information and audio information when available.",
    "Create factual reference material that another AI assistant can use to answer questions about this exact video.",
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
    "Do not say that you cannot see, watch, hear, or analyze the video. Video understanding is your specific task.",
    "Return only useful video reference material for the downstream Aperonix assistant."
  ].join("\n");
}

export async function analyzeVideoWithTwelveLabs(input: {
  url: string;
  mimeType: string;
  fileName: string;
}) {
  const apiKey = getTwelveLabsApiKey();
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    ANALYSIS_TIMEOUT_MS
  );

  try {
    const response = await fetch(`${TWELVE_LABS_API_BASE}/analyze`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model_name: TWELVE_LABS_MODEL,
        video: {
          type: "url",
          url: input.url
        },
        prompt: buildVideoPrompt(),
        stream: false,
        temperature: 0.2,
        max_tokens: 7000
      }),
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(await readTwelveLabsError(response));
    }

    const payload = await response.json();

    const analysis =
      typeof payload?.data === "string"
        ? payload.data
        : typeof payload?.text === "string"
          ? payload.text
          : typeof payload?.output_text === "string"
            ? payload.output_text
            : "";

    return normalizeAnalysis(analysis);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Twelve Labs video analysis timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
