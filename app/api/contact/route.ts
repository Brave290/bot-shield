import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) return NextResponse.json({ error: "All fields required" }, { status: 400 });

    const { error } = await supabaseAdmin.from("contact_messages").insert({ name, email, message });
    if (error) return NextResponse.json({ error: "Failed to save message" }, { status: 500 });

    const { data: settings } = await supabaseAdmin.from("platform_settings").select("*");
    const map: Record<string, string> = {};
    (settings || []).forEach((r: any) => { map[r.key] = r.value; });
    const key = map["resend_api_key"];
    if (!key) return NextResponse.json({ ok: true, email: "no-key" });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: map["resend_from_email"] || "BotShield <onboarding@resend.dev>",
        to: [map["contact_notify_email"] || "legateakanjimusab@gmail.com"],
        subject: `New contact from ${name}`,
        html: `<p><strong>${name}</strong> (${email})</p><p>${message}</p>`,
      }),
    });
    if (!res.ok) {
      const errBody = await res.text();
      console.error("[BotShield] Resend failed:", res.status, errBody);
      return NextResponse.json({ ok: true, email: "failed", emailError: errBody.slice(0, 200) });
    }
    return NextResponse.json({ ok: true, email: "sent" });
  } catch (err) {
    console.error("[BotShield] Contact error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
