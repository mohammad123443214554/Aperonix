import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    const accessToken = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (
      !supabaseUrl ||
      !supabaseKey ||
      !speechKey ||
      !speechRegion ||
      !accessToken
    ) {
      return NextResponse.json(
        { error: "Azure Speech is not configured." },
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

    const endpoint =
      `https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`;

    const tokenResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": speechKey
      },
      cache: "no-store"
    });

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text();
      console.error("Azure Speech token error:", details);
      return NextResponse.json(
        { error: "Could not authorize Azure Speech." },
        { status: 502 }
      );
    }

    const token = (await tokenResponse.text()).trim();

    if (!token) {
      return NextResponse.json(
        { error: "Azure Speech returned an empty token." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      token,
      region: speechRegion,
      expiresInSeconds: 540
    });
  } catch (error) {
    console.error("Azure Speech token route error:", error);
    return NextResponse.json(
      { error: "Could not start Read Aloud." },
      { status: 500 }
    );
  }
}
