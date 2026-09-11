import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

type PaystackEvent = { event?: string; data?: { reference?: string; customer?: { email?: string; customer_code?: string }; subscription_code?: string; metadata?: { user_id?: string; tier?: string } } };

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !signature) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
    const hash = createHmac("sha512", secret).update(body).digest("hex");
    const expected = Buffer.from(hash, "utf8"); const received = Buffer.from(signature, "utf8");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    const event = JSON.parse(body) as PaystackEvent;
    const eventId = event.data?.reference || `${event.event || "unknown"}:${hash}`;
    const { error: eventError } = await supabaseAdmin.from("billing_events").insert({ provider: "paystack", event_id: eventId, event_type: event.event || "unknown", payload: event });
    if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    if (eventError) return NextResponse.json({ error: "Unable to record billing event" }, { status: 500 });

    const userId = event.data?.metadata?.user_id;
    if (userId) {
      const success = event.event === "charge.success";
      const failed = event.event === "charge.failed";
      const canceled = event.event === "subscription.disable" || event.event === "subscription.not_renew";
      const status = success ? "active" : failed ? "past_due" : canceled ? "canceled" : null;
      if (status) {
        const values: Record<string, string | null> = { user_id: userId, tier_name: event.data?.metadata?.tier === "Enterprise" ? "Enterprise" : success ? "Pro" : "Hobby", status, provider: "paystack", customer_code: event.data?.customer?.customer_code || event.data?.reference || null, subscription_code: event.data?.subscription_code || null, updated_at: new Date().toISOString() };
        const { error } = await supabaseAdmin.from("subscription_stats").upsert(values, { onConflict: "user_id" });
        if (error) return NextResponse.json({ error: "Subscription update failed" }, { status: 500 });
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paystack] Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
