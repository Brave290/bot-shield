import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/server";
import { jwtVerify } from "jose";
import { z } from "zod";

const VerifyPayloadSchema = z.object({
  secretKey: z.string().min(1, "secretKey required"),
  token: z.string().min(1, "token required"),
});

export async function POST(req: Request) {
  try {
    const rawPayload = await req.json();

    // Validate payload schema
    let payload;
    try {
      payload = VerifyPayloadSchema.parse(rawPayload);
    } catch (validationError) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const { secretKey, token } = payload;

    // Rate limiting per IP
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { data: rateConfig } = await supabaseAdmin
      .from("rate_limits")
      .select("*")
      .eq("endpoint", "/api/verify")
      .single();

    const maxAttempts = rateConfig?.max_attempts || 100;
    const windowSeconds = rateConfig?.window_seconds || 60;

    if (!rateConfig || rateConfig.enabled !== false) {
      const cutoff = new Date(Date.now() - windowSeconds * 1000).toISOString();
      const { count } = await supabaseAdmin
        .from("rate_limit_events")
        .select("*", { count: "exact", head: true })
        .eq("limit_id", "verify_ip")
        .eq("scope_key", ip)
        .gte("created_at", cutoff);

      if ((count || 0) >= maxAttempts) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429 }
        );
      }

      await supabaseAdmin.from("rate_limit_events").insert({
        limit_id: "verify_ip",
        scope_key: ip,
      });
    }

    // Find project by secret key (try hashed first, then plaintext for legacy support)
    let matchedSecret = secretKey;
    let { data: project } = await supabaseAdmin
      .from("projects")
      .select("*")
      .eq("secret_key", "hash:" + require("crypto")
        .createHmac("sha256", "botshield-key-derivation")
        .update(secretKey)
      .digest("hex"))
      .single();
    if (project) matchedSecret = project.secret_key;

    // Fallback to plaintext secret for migration period
    if (!project) {
      const fallback = await supabaseAdmin
        .from("projects")
        .select("*")
        .eq("secret_key", secretKey)
        .single();
      project = fallback.data;
    }

    if (!project) {
      const previous = await supabaseAdmin.from("projects").select("*").eq("previous_secret_key", secretKey).single();
      project = previous.data;
    }

    if (!project) {
      return NextResponse.json(
        { error: "Invalid secret key" },
        { status: 401 }
      );
    }

    // Verify JWT using derived key
    try {
      const jwtSecret = new TextEncoder().encode(matchedSecret);
      const { payload: jwtPayload } = await jwtVerify(token, jwtSecret, {
        issuer: "botshield",
        audience: project.id,
        algorithms: ["HS256"],
      });

      if (jwtPayload.purpose !== "bot_verification") {
        return NextResponse.json(
          { error: "Invalid token purpose" },
          { status: 401 }
        );
      }

      const score = jwtPayload.score as number;
      return NextResponse.json({
        status: score < 50 ? "human" : "suspicious",
        payload: { projectId: jwtPayload.aud, score },
      });
    } catch (jwtErr) {
      console.warn("[BotShield] JWT verification failed (expected for invalid tokens)");
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }
  } catch (err) {
    console.error("[BotShield] Verify error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
