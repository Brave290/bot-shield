import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

function key(prefix: string) { return `${prefix}_${randomUUID().replaceAll("-", "")}`; }

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (!name) return NextResponse.json({ error: "Project name is required" }, { status: 400 });

  const { data: subscription } = await supabaseAdmin.from("subscription_stats").select("tier_name,status").eq("user_id", auth.user.id).maybeSingle();
  const tier = subscription?.tier_name || "Hobby";
  if (subscription?.status === "past_due" || subscription?.status === "canceled") return NextResponse.json({ error: "Your subscription is not active" }, { status: 402 });
  const { data: plan } = await supabaseAdmin.from("plan_pricing").select("max_projects").eq("id", tier).single();
  const { count } = await supabaseAdmin.from("projects").select("id", { count: "exact", head: true }).eq("user_id", auth.user.id);
  if (plan && (count || 0) >= plan.max_projects) return NextResponse.json({ error: `${tier} allows up to ${plan.max_projects} project(s). Upgrade to add another.` }, { status: 403 });

  const origin = String(body.origin || "").trim().replace(/\/$/, "");
  const { data: project, error } = await supabaseAdmin.from("projects").insert({
    user_id: auth.user.id, name, api_key: key("bs_live"), secret_key: key("bs_sec"),
    allowed_origins: origin ? [origin] : [], sensitivity: body.sensitivity || "balanced",
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(project, { status: 201 });
}
