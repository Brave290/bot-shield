import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const ip = await getClientIP();
    
    const ipLimit = await checkRateLimit("login_ip", ip);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(ipLimit.resetInSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    const emailLimit = await checkRateLimit("login_email", email);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        { error: `Too many attempts for this email. Try again in ${Math.ceil(emailLimit.resetInSeconds / 60)} minutes.` },
        { status: 429 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({ 
      user: data.user,
      session: data.session,
      rateLimit: { remaining: Math.min(ipLimit.remaining, emailLimit.remaining) }
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
