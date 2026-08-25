import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const type = new URL(req.url).searchParams.get("type");
  const desc = (t: string) => supabaseAdmin.from(t).select("*").order("created_at", { ascending: false });
  if (type === "messages") { const { data } = await desc("contact_messages"); return NextResponse.json(data || []); }
  if (type === "applications") { const { data } = await desc("job_applications"); return NextResponse.json(data || []); }
  if (type === "pricing") { const { data } = await supabaseAdmin.from("plan_pricing").select("*"); return NextResponse.json(data || []); }
  if (type === "admins") { const { data } = await supabaseAdmin.from("admins").select("*").order("created_at"); return NextResponse.json(data || []); }
  if (type === "stats") {
    const [m, a, p, ad] = await Promise.all([
      supabaseAdmin.from("contact_messages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("job_applications").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("admins").select("*", { count: "exact", head: true }),
    ]);
    return NextResponse.json({ messages: m.count || 0, applications: a.count || 0, projects: p.count || 0, admins: ad.count || 0 });
  }
  return NextResponse.json({ error: "Unknown type" }, { status: 400 });
}

export async function PATCH(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, price, tag } = await req.json();
  const { data, error } = await supabaseAdmin.from("plan_pricing").update({ price, tag }).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  if (body.action === "add-admin") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!validEmail(email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    const { error } = await supabaseAdmin.from("admins").upsert({ email, role: "admin", added_by: admin.email }, { onConflict: "email" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "remove-admin") {
    const email = String(body.email || "").toLowerCase();
    if (email === admin.email) return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Only the owner can remove admins" }, { status: 403 });
    const { data: target } = await supabaseAdmin.from("admins").select("*").eq("email", email).single();
    if (!target) return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    if (target.role === "owner") return NextResponse.json({ error: "The owner cannot be removed" }, { status: 400 });
    await supabaseAdmin.from("admins").delete().eq("email", email);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "transfer") {
    if (admin.role !== "owner") return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 });
    const email = String(body.email || "").trim().toLowerCase();
    if (!validEmail(email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    if (email === admin.email) return NextResponse.json({ error: "You already own this project" }, { status: 400 });
    await supabaseAdmin.from("admins").update({ role: "admin" }).eq("role", "owner");
    const { error } = await supabaseAdmin.from("admins").upsert({ email, role: "owner", added_by: admin.email }, { onConflict: "email" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete-message") { await supabaseAdmin.from("contact_messages").delete().eq("id", body.id); return NextResponse.json({ ok: true }); }
  if (body.action === "delete-application") { await supabaseAdmin.from("job_applications").delete().eq("id", body.id); return NextResponse.json({ ok: true }); }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
