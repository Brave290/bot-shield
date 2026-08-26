import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { hashSecret } from "@/lib/crypto";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: projects } = await supabaseAdmin.from("projects").select("id, secret_key");
  if (!projects) return NextResponse.json({ error: "No projects" }, { status: 400 });

  let migrated = 0;
  for (const p of projects) {
    if (p.secret_key && !p.secret_key.startsWith("hash:")) {
      const hashed = "hash:" + hashSecret(p.secret_key);
      await supabaseAdmin.from("projects").update({ secret_key: hashed }).eq("id", p.id);
      migrated++;
    }
  }

  return NextResponse.json({ ok: true, migrated });
}
