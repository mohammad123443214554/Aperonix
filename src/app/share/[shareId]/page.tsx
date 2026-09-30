import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SharedResponse = {
  id: string;
  content: string;
  content_type: "response" | "prompt";
  created_at: string;
};

async function getSharedResponse(shareId: string): Promise<SharedResponse | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  const { data, error } = await supabase
    .from("shared_responses")
    .select("id,content,content_type,created_at")
    .eq("id", shareId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SharedResponse;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ shareId: string }>;
}): Promise<Metadata> {
  const { shareId } = await params;
  const shared = await getSharedResponse(shareId);

  if (!shared) {
    return {
      title: "Aperonix AI",
      robots: { index: false, follow: false }
    };
  }

  const description = shared.content
    .replaceAll("#", "")
    .replaceAll("*", "")
    .replaceAll("`", "")
    .replaceAll("\n", " ")
    .slice(0, 155);

  return {
    title: "Aperonix AI",
    description:
      description ||
      (shared.content_type === "prompt"
        ? "A prompt shared from Aperonix AI."
        : "A response shared from Aperonix AI."),
    robots: { index: false, follow: false },
    openGraph: {
      title: "Aperonix AI",
      description:
        description ||
        (shared.content_type === "prompt"
          ? "A prompt shared from Aperonix AI."
          : "A response shared from Aperonix AI."),
      type: "article"
    }
  };
}

export default async function SharedResponsePage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const shared = await getSharedResponse(shareId);

  if (!shared) notFound();

  return (
    <main className="shared-response-page">
      <div className="shared-response-orb shared-response-orb-one" aria-hidden="true" />
      <div className="shared-response-orb shared-response-orb-two" aria-hidden="true" />

      <div className="shared-response-shell">
        <header className="shared-response-brand" aria-label="Aperonix AI">
          <img src="/aperonix-logo.png" alt="" />
          <span>Aperonix AI</span>
        </header>

        <section className="shared-response-card" aria-labelledby="shared-response-title">
          <div className="shared-response-heading">
            <span className="shared-response-kicker">APERONIX AI</span>
            <h1 id="shared-response-title">
              {shared.content_type === "prompt" ? "Shared prompt" : "Shared response"}
            </h1>
            <p>
              {shared.content_type === "prompt"
                ? "A prompt shared from Aperonix AI."
                : "A response shared from Aperonix AI."}
            </p>
          </div>

          <article className="shared-response-content">
            <ReactMarkdown>{shared.content}</ReactMarkdown>
          </article>

          <div className="shared-response-footer">
            <a className="shared-response-open" href="/">
              Open Aperonix AI
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <p className="shared-response-note">
          {shared.content_type === "prompt"
            ? "Only this prompt was shared. Private chat history is not included."
            : "Only this response was shared. Private chat history is not included."}
        </p>
      </div>
    </main>
  );
}
