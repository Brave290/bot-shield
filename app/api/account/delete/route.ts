import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createHash } from "crypto";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const uid = auth.user.id;

  const errors: string[] = [];

  const { data: projects } = await supabaseAdmin.from("projects").select("id, api_key").eq("user_id", uid);
  for (const p of projects || []) {
    const { error: e1 } = await supabaseAdmin.from("verification_logs").delete().eq("project_id", p.id);
    if (e1) errors.push(`verification_logs:${e1.message}`);

    const scopeKey = createHash("sha256").update(p.api_key).digest("hex");
    const { error: e2 } = await supabaseAdmin.from("rate_limit_events").delete().in("scope_key", [p.api_key, scopeKey]);
    if (e2) errors.push(`rate_limit_events:${e2.message}`);

    const { error: e3 } = await supabaseAdmin.from("project_members").delete().eq("project_id", p.id);
    if (e3) errors.push(`project_members:${e3.message}`);

    const { error: e4 } = await supabaseAdmin.from("team_invitations").delete().eq("project_id", p.id);
    if (e4) errors.push(`team_invitations:${e4.message}`);
  }

  const { error: e5 } = await supabaseAdmin.from("projects").delete().eq("user_id", uid);
  if (e5) errors.push(`projects:${e5.message}`);

  const { error: e6 } = await supabaseAdmin.from("subscription_stats").delete().eq("user_id", uid);
  if (e6) errors.push(`subscription_stats:${e6.message}`);

  await supabaseAdmin.from("audit_logs").insert({ actor_email: auth.user.email || "unknown", action: "account_deletion", target: uid });

  if (errors.length > 0) return NextResponse.json({ error: "Partial deletion failure", details: errors }, { status: 500 });

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(uid);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
