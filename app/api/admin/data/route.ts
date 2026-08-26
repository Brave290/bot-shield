import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/admin";
import { headers } from "next/headers";

export async function GET(req: Request) {
  const admin = await getAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const type = new URL(req.url).searchParams.get("type");

  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin.from("audit_logs").select("id").eq("actor_email", admin.email).eq("action", "console_access").gte("created_at", cutoff).limit(1);
  if (!recent || recent.length === 0) await supabaseAdmin.from("audit_logs").insert({ actor_email: admin.email, action: "console_access", target: "ip:" + ip });

  const desc = (t: string) => supabaseAdmin.from(t).select("*").order("created_at", { ascending: false });
  if (type === "me") return NextResponse.json(admin);
  if (type === "messages") { const { data } = await desc("contact_messages"); return NextResponse.json(data || []); }
  if (type === "applications") { const { data } = await desc("job_applications"); return NextResponse.json(data || []); }
  if (type === "pricing") { const { data } = await supabaseAdmin.from("plan_pricing").select("*"); return NextResponse.json(data || []); }
  if (type === "admins") { const { data } = await supabaseAdmin.from("admins").select("*").order("created_at"); return NextResponse.json(data || []); }
  if (type === "audit") { const { data } = await supabaseAdmin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(50); return NextResponse.json(data || []); }
  if (type === "projects") {
    const { data } = await supabaseAdmin.from("projects").select("id,name,api_key,mode,allowed_ips,blocked_ips,rate_limit_per_min");
    for (const p of data || []) {
      const { data: last } = await supabaseAdmin.from("verification_logs").select("created_at").eq("project_id", p.id).order("created_at", { ascending: false }).limit(1);
      (p as any).last_active = last?.[0]?.created_at || null;
    }
    return NextResponse.json(data || []);
  }
  if (type === "settings") {
    const { data } = await supabaseAdmin.from("platform_settings").select("*");
    const map: Record<string, string> = {}; (data || []).forEach((r: any) => { map[r.key] = r.value; });
    const v = map["resend_api_key"] || "";
    return NextResponse.json({ masked: v ? v.slice(0, 3) + "••••" + v.slice(-4) : "", maintenance: map["maintenance_mode"] === "on", ip });
  }
  if (type === "stats") {
    const [m, a, p, ad, vis, pay] = await Promise.all([
      supabaseAdmin.from("contact_messages").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("job_applications").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("admins").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("unique_daily_visitors").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("subscription_stats").select("*", { count: "exact", head: true }).neq("tier_name", "Hobby"),
    ]);
    let users = 0;
    try { const u = await supabaseAdmin.auth.admin.listUsers(); users = u.data.users?.length || 0; } catch {}
    return NextResponse.json({ messages: m.count || 0, applications: a.count || 0, projects: p.count || 0, admins: ad.count || 0, visitors: vis.count || 0, payments: pay.count || 0, users });
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
  const log = (action: string, target: string) => supabaseAdmin.from("audit_logs").insert({ actor_email: admin.email, action, target });

  if (body.action === "save-setting") {
    if (!["resend_api_key", "maintenance_mode", "resend_from_email", "contact_notify_email"].includes(body.key) || !body.value) return NextResponse.json({ error: "Invalid setting" }, { status: 400 });
    await supabaseAdmin.from("platform_settings").upsert({ key: body.key, value: body.value }, { onConflict: "key" });
    await log("update_setting", body.key);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update-project") {
    const clean: any = { mode: body.mode === "shadow" ? "shadow" : "active", allowed_ips: Array.isArray(body.allowed_ips) ? body.allowed_ips : [], blocked_ips: Array.isArray(body.blocked_ips) ? body.blocked_ips : [], rate_limit_per_min: body.rate_limit_per_min ? parseInt(body.rate_limit_per_min) : null };
    const { error } = await supabaseAdmin.from("projects").update(clean).eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await log("update_project", body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "add-admin") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!validEmail(email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    await supabaseAdmin.from("admins").upsert({ email, role: "admin", added_by: admin.email }, { onConflict: "email" });
    await log("add_admin", email);
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
    await log("remove_admin", email);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "transfer") {
    if (admin.role !== "owner") return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 });
    const email = String(body.email || "").trim().toLowerCase();
    if (!validEmail(email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    if (email === admin.email) return NextResponse.json({ error: "You already own this project" }, { status: 400 });
    await supabaseAdmin.from("admins").update({ role: "admin" }).eq("role", "owner");
    await supabaseAdmin.from("admins").upsert({ email, role: "owner", added_by: admin.email }, { onConflict: "email" });
    await log("transfer_ownership", email);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete-project") {
    const { data: project } = await supabaseAdmin.from("projects").select("*").eq("id", body.id).single();
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await supabaseAdmin.from("verification_logs").delete().eq("project_id", body.id);
    await supabaseAdmin.from("rate_limit_events").delete().eq("scope_key", project.api_key);
    await supabaseAdmin.from("projects").delete().eq("id", body.id);
    await log("delete_project", body.id);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "test-email") {
    const { data: settings } = await supabaseAdmin.from("platform_settings").select("*");
    const map: Record<string, string> = {}; (settings || []).forEach((r: any) => { map[r.key] = r.value; });
    const key = map["resend_api_key"];
    if (!key) return NextResponse.json({ error: "No Resend key saved" }, { status: 400 });
    const res = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" }, body: JSON.stringify({ from: map["resend_from_email"] || "BotShield <onboarding@resend.dev>", to: [admin.email], subject: "BotShield test email", html: "<p>If you can read this, Resend is configured correctly.</p>" }) });
    const out = await res.text();
    if (!res.ok) return NextResponse.json({ error: "Resend error: " + out.slice(0, 300) }, { status: 502 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "delete-message") { await supabaseAdmin.from("contact_messages").delete().eq("id", body.id); await log("delete_message", body.id); return NextResponse.json({ ok: true }); }
  if (body.action === "delete-application") { await supabaseAdmin.from("job_applications").delete().eq("id", body.id); await log("delete_application", body.id); return NextResponse.json({ ok: true }); }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
