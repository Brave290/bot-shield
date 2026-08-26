import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { jwtVerify } from "jose";
import { hashSecret } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const { secretKey, token } = await req.json();

    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { data: rateConfig } = await supabaseAdmin.from("rate_limits").select("*").eq("endpoint", "/api/verify").single();
    const maxAttempts = rateConfig?.max_attempts || 100;
    const windowSeconds = rateConfig?.window_seconds || 60;
    if (!rateConfig || rateConfig.enabled !== false) {
      const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();
      const { count } = await supabaseAdmin.from("rate_limit_events").select("*", { count: "exact", head: true }).eq("limit_id", "verify_ip").eq("scope_key", ip).gte("created_at", cutoff);
      if ((count || 0) >= maxAttempts) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      await supabaseAdmin.from("rate_limit_events").insert({ limit_id: "verify_ip", scope_key: ip });
    }
    if (!secretKey || !token) {
      return NextResponse.json({ error: "secretKey and token required" }, { status: 400 });
    }

    // Try hashed secret first
    let { data: project } = await supabaseAdmin.from("projects").select("*").eq("secret_key", "hash:" + hashSecret(secretKey)).single();
    
    // Fallback to plaintext secret (for projects created before migration)
    if (!project) {
      const fallback = await supabaseAdmin.from("projects").select("*").eq("secret_key", secretKey).single();
      project = fallback.data;
    }

    if (!project) {
      return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
    }

    // Validate JWT
    const secret = new TextEncoder().encode(project.secret_key);
    const { payload } = await jwtVerify(token, secret, {
      issuer: "botshield",
      audience: project.id,
      algorithms: ["HS256"],
    });

    if (payload.purpose !== "bot_verification") {
      return NextResponse.json({ error: "Invalid token purpose" }, { status: 401 });
    }

    return NextResponse.json({ 
      status: (payload.score as number) < 50 ? "human" : "suspicious", 
      payload: { projectId: payload.aud, score: payload.score } 
    });
  } catch (err) {
    console.error("[BotShield] Verify error:", err);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
