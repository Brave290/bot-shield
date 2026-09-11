import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user?.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: "Billing is not configured" }, { status: 503 });
  const { tier } = await req.json().catch(() => ({}));
  if (!["Pro", "Enterprise"].includes(tier)) return NextResponse.json({ error: "Choose a paid plan" }, { status: 400 });
  if (tier === "Enterprise") return NextResponse.json({ error: "Enterprise billing requires a sales conversation" }, { status: 400 });
  const { data: plan } = await supabaseAdmin.from("plan_pricing").select("price").eq("id", tier).single();
  const amount = Math.round(Number(String(plan?.price || "29").replace(/[^0-9.]/g, "")) * 100);
  const callback = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=complete` : undefined;
  const response = await fetch("https://api.paystack.co/transaction/initialize", { method: "POST", headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" }, body: JSON.stringify({ email: auth.user.email, amount, currency: "USD", callback_url: callback, metadata: { user_id: auth.user.id, tier } }) });
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.status) return NextResponse.json({ error: result?.message || "Unable to initialize checkout" }, { status: 502 });
  return NextResponse.json({ authorization_url: result.data.authorization_url, reference: result.data.reference });
}
