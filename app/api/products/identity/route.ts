import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

async function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const [{ data: sessions }, { data: methods }] = await Promise.all([
    supabaseAdmin
      .from("identity_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabaseAdmin
      .from("identity_auth_methods")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return NextResponse.json({ sessions: sessions || [], methods: methods || [] });
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("identity", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "create-session") {
    const deviceInfo = body.device_info && typeof body.device_info === "object" ? body.device_info : {};
    const ipHash = String(body.ip_hash || "").trim();
    const country = String(body.country || "").trim();

    const { data, error } = await supabaseAdmin
      .from("identity_sessions")
      .insert({
        user_id: user.id,
        session_token: `ids_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        device_info: deviceInfo,
        ip_hash: ipHash,
        country,
        status: "active",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "identity.session_created", metadata: { session_id: data.id } });
    return NextResponse.json({ session: data });
  }

  if (action === "add-auth-method") {
    const method = ["password", "totp", "passkey", "email_otp", "sms_otp"].includes(body.method) ? body.method : "password";
    const config = body.config && typeof body.config === "object" ? body.config : {};

    const { data, error } = await supabaseAdmin
      .from("identity_auth_methods")
      .insert({
        user_id: user.id,
        method,
        config,
        enabled: true,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ method: data });
  }

  if (action === "revoke-session") {
    const sessionId = String(body.session_id || "");
    if (!sessionId) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("identity_sessions").select("id").eq("id", sessionId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const { error } = await supabaseAdmin.from("identity_sessions").update({ status: "revoked", revoked_at: new Date().toISOString() }).eq("id", sessionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (action === "toggle-auth-method") {
    const methodId = String(body.method_id || "");
    if (!methodId) return NextResponse.json({ error: "Method ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("identity_auth_methods").select("id,enabled").eq("id", methodId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Auth method not found" }, { status: 404 });

    const { data, error } = await supabaseAdmin.from("identity_auth_methods").update({ enabled: !existing.enabled }).eq("id", methodId).select("*").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ method: data });
  }

  if (action === "delete-auth-method") {
    const methodId = String(body.method_id || "");
    if (!methodId) return NextResponse.json({ error: "Method ID required" }, { status: 400 });

    const { data: existing } = await supabaseAdmin.from("identity_auth_methods").select("id").eq("id", methodId).eq("user_id", user.id).single();
    if (!existing) return NextResponse.json({ error: "Auth method not found" }, { status: 404 });

    const { error } = await supabaseAdmin.from("identity_auth_methods").delete().eq("id", methodId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
