import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "info.bravehx@gmail.com,legateakanjimusab@gmail.com").split(",").map((s) => s.trim());

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
  const type = new URL(req.url).searchParams.get("type");
  if (type === "messages") {
    const { data } = await supabaseAdmin.from("contact_messages").select("*").order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  }
  if (type === "applications") {
    const { data } = await supabaseAdmin.from("job_applications").select("*").order("created_at", { ascending: false });
    return NextResponse.json(data || []);
  }
  if (type === "pricing") {
    const { data } = await supabaseAdmin.from("plan_pricing").select("*");
    return NextResponse.json(data || []);
  }
  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, price, tag } = await req.json();
  const { data, error } = await supabaseAdmin.from("plan_pricing").update({ price, tag }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
