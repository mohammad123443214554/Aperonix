import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type SharedResponse = {
  id: string;
  content: string;
  created_at: string;
};

async function getSharedResponse(shareId: string): Promise<SharedResponse | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  });

  const { data, error } = await supabase
    .from("shared_responses")
    .select("id,content,created_at")
    .eq("id", shareId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

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
    title: "Aperonix AI response",
    description: description || "A response shared from Aperonix AI.",
    robots: { index: false, follow: false },
    openGraph: {
      title: "Aperonix AI response",
      description: description || "A response shared from Aperonix AI.",
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

  if (!shared) {
    notFound();
  }

  const sharedDate = new Date(shared.created_at);

  return (
    <main className="shared-response-page">
      <div className="shared-response-shell">
        <header className="shared-response-brand">
          <img src="/aperonix-logo.png" alt="Aperonix AI" />
          <div>
            <strong>Aperonix AI</strong>
            <span>Shared response</span>
          </div>
        </header>

        <section className="shared-response-card">
          <div className="shared-response-heading">
            <span className="hero-kicker">Aperonix AI</span>
            <h1>Shared response</h1>
            <p>This response was shared from an Aperonix AI conversation.</p>
          </div>

          <article className="shared-response-content">
            <ReactMarkdown>{shared.content}</ReactMarkdown>
          </article>

          <div className="shared-response-footer">
            <time dateTime={shared.created_at}>
              Shared {sharedDate.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
              })}
            </time>
            <a className="shared-response-open" href="/">
              Open Aperonix AI
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>

        <p className="shared-response-note">
          This page contains only the selected response. Private chat history is not shared.
        </p>
      </div>
    </main>
  );
}
