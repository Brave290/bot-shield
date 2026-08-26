import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  try {
    const [t, b, pr] = await Promise.all([
      supabaseAdmin.from("verification_logs").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("verification_logs").select("*", { count: "exact", head: true }).eq("status", "blocked"),
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
    ]);
    const { data: subs } = await supabaseAdmin.from("subscription_stats").select("tier_name");
    const counts: Record<string, number> = {};
    (subs || []).forEach((s) => { counts[s.tier_name] = (counts[s.tier_name] || 0) + 1; });
    const mostPopular = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Pro";
    const { data: pricingRows } = await supabaseAdmin.from("plan_pricing").select("*");
    const pricing: Record<string, { price: string; tag: string }> = {};
    (pricingRows || []).forEach((r) => { pricing[r.id] = { price: r.price, tag: r.tag }; });
    return NextResponse.json({ totalRequests: t.count || 0, blockedBots: b.count || 0, projects: pr.count || 0, subscriptionTiers: counts, mostPopularTier: mostPopular, pricing });
  } catch {
    return NextResponse.json({ totalRequests: 0, blockedBots: 0, projects: 0, subscriptionTiers: {}, mostPopularTier: "Pro", pricing: {} });
  }
}
