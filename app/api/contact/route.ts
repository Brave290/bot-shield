import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { name, email, message } = await req.json();
    if (!name || !email || !message) return NextResponse.json({ error: "All fields are required" }, { status: 400 });

    // Always store in database (admin can read later)
    await supabaseAdmin.from("contact_messages").insert({ name, email, message });

    // If Resend key exists, also email it
    const key = process.env.RESEND_API_KEY;
    if (key) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "BotShield <onboarding@resend.dev>",
          to: ["info.bravehx@gmail.com"],
          subject: `[BotShield] Message from ${name}`,
          text: `${message}\n\n— ${name} (${email})`,
        }),
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
