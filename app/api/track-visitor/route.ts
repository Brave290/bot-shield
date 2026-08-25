import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { createHash } from "crypto";
import { headers } from "next/headers";

export async function POST() {
  try {
    const h = await headers();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
    const ipHash = createHash("sha256").update(ip).digest("hex");
    const today = new Date().toISOString().slice(0, 10);

    const rpc = await supabaseAdmin.rpc("track_and_count_visitor", { p_ip_hash: ipHash });
    if (rpc.error) {
      await supabaseAdmin.from("unique_daily_visitors")
        .upsert({ visit_date: today, ip_hash: ipHash }, { onConflict: "visit_date,ip_hash", ignoreDuplicates: true });
    }

    const { count: total } = await supabaseAdmin.from("unique_daily_visitors").select("*", { count: "exact", head: true });
    const { count: todayCount } = await supabaseAdmin.from("unique_daily_visitors").select("*", { count: "exact", head: true }).eq("visit_date", today);

    return NextResponse.json({ total: total || 0, today: todayCount || 0 });
  } catch {
    return NextResponse.json({ total: 0, today: 0 });
  }
}
