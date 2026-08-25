import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    await supabaseAdmin.from("contact_messages").insert({ name, email, message });

    const { data: setting } = await supabaseAdmin.from("platform_settings").select("value").eq("key", "resend_api_key").single();
    const key = setting?.value || process.env.RESEND_API_KEY;
    let emailed = false;
    if (key) {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: "BotShield <onboarding@resend.dev>", to: ["info.bravehx@gmail.com"], subject: `[BotShield] Message from ${name}`, text: `${message}\n\n— ${name} (${email})` }),
      });
      emailed = r.ok;
    }
    return NextResponse.json({ ok: true, emailed });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
