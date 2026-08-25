import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabaseAdmin.from("rate_limits").select("*").order("id");
  return NextResponse.json(data || []);
}

export async function PATCH(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, ...updates } = await req.json();
  const allowed = ["max_attempts", "window_seconds", "enabled"];
  const clean: Record<string, unknown> = {};
  for (const k of allowed) if (k in updates) clean[k] = updates[k];
  const { data, error } = await supabaseAdmin.from("rate_limits").update(clean).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
