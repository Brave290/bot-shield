import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { jwtVerify } from "jose";
import { hashSecret } from "@/lib/crypto";

export async function POST(req: Request) {
  try {
    const { secretKey, token } = await req.json();
    if (!secretKey || !token) {
      return NextResponse.json({ error: "secretKey and token required" }, { status: 400 });
    }

    const { data: project } = await supabaseAdmin.from("projects").select("*").eq("secret_key", "hash:" + hashSecret(secretKey)).single();
    if (!project) {
      return NextResponse.json({ error: "Invalid secret key" }, { status: 401 });
    }

    // CRITICAL: Validate JWT with strict claims
    const secret = new TextEncoder().encode(project.secret_key.startsWith("hash:") ? secretKey : project.secret_key);
    const { payload, warnings } = await jwtVerify(token, secret, {
      issuer: "botshield",
      audience: project.id,
      algorithms: ["HS256"],
    });

    // Validate token purpose
    if (payload.purpose !== "bot_verification") {
      return NextResponse.json({ error: "Invalid token purpose" }, { status: 401 });
    }

    // Check project status
    if (project.mode === "revoked" || project.mode === "suspended") {
      return NextResponse.json({ error: "Project suspended" }, { status: 403 });
    }

    return NextResponse.json({ 
      status: payload.score < 50 ? "human" : "suspicious", 
      payload: { 
        projectId: payload.aud, 
        score: payload.score, 
        iat: payload.iat, 
        exp: payload.exp 
      } 
    });
  } catch (err) {
    console.error("[BotShield] Verify error:", err);
    return NextResponse.json({ error: "Invalid token", details: String(err) }, { status: 401 });
  }
}
