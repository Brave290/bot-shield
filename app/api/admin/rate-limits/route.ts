import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "info.bravehx@gmail.com").split(",").map((s) => s.trim());

async function requireAdmin(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  if (!ADMIN_EMAILS.includes(data.user.email || "")) return null;
  return data.user;
}

export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data } = await supabaseAdmin.from("rate_limits").select("*").order("id");
  return NextResponse.json(data || []);
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, ...updates } = await req.json();
  const allowed = ["max_attempts", "window_seconds", "enabled"];
  const clean: Record<string, unknown> = {};
  for (const k of allowed) if (k in updates) clean[k] = updates[k];
  const { data, error } = await supabaseAdmin.from("rate_limits").update(clean).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
