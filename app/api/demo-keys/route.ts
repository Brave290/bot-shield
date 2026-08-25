import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const name = "Public Playground";
  let { data } = await supabaseAdmin.from("projects").select("*").eq("name", name).single();
  if (!data) {
    const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
      email: "playground@botshield.dev",
      password: "demo-" + Math.random().toString(36).slice(2),
      email_confirm: true,
    });
    const uid = authUser?.user?.id || "00000000-0000-0000-0000-000000000000";
    const { data: created, error } = await supabaseAdmin
      .from("projects")
      .insert({ user_id: uid, name, api_key: "bs_live_demo_playground", secret_key: "bs_sec_demo_playground" })
      .select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    data = created;
  }
  return NextResponse.json({ apiKey: data.api_key, secretKey: data.secret_key });
}
