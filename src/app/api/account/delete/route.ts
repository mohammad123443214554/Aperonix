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
    const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const secretKey =
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !publicKey || !secretKey || !accessToken) {
      return NextResponse.json(
        { error: "Account deletion is not configured." },
        { status: 503 }
      );
    }

    const publicClient = createClient(supabaseUrl, publicKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { data: authData, error: authError } =
      await publicClient.auth.getUser(accessToken);

    if (authError || !authData.user || authData.user.is_anonymous) {
      return NextResponse.json(
        { error: "Authentication is required." },
        { status: 401 }
      );
    }

    const adminClient = createClient(supabaseUrl, secretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    });

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(
      authData.user.id,
      false
    );

    if (deleteError) {
      console.error("Supabase account deletion error:", deleteError);
      return NextResponse.json(
        { error: "Could not permanently delete the account." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account deletion route error:", error);
    return NextResponse.json(
      { error: "Could not permanently delete the account." },
      { status: 500 }
    );
  }
}
