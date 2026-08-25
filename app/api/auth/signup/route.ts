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
    const rateLimit = await checkRateLimit("signup_ip", ip);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Too many signups. Try again in ${Math.ceil(rateLimit.resetInSeconds / 60)} minutes.` },
        { status: 429, headers: { "Retry-After": String(rateLimit.resetInSeconds) } }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ 
      user: data.user,
      session: data.session,
      rateLimit: { remaining: rateLimit.remaining }
    });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
