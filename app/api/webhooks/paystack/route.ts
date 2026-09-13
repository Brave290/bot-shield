import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

type PaystackEvent = {
  event?: string;
  data?: {
    reference?: string;
    amount?: number;
    currency?: string;
    customer?: { email?: string; customer_code?: string };
    subscription_code?: string;
    metadata?: { user_id?: string; tier?: string };
  };
};

const VALID_TIERS = ["Hobby", "Pro", "Enterprise"] as const;
const VALID_EVENTS = new Set(["charge.success", "charge.failed", "subscription.disable", "subscription.not_renew"]);

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret || !signature) return NextResponse.json({ error: "Missing credentials" }, { status: 401 });

    const hash = createHmac("sha512", secret).update(body).digest("hex");
    const expected = Buffer.from(hash, "utf8");
    const received = Buffer.from(signature, "utf8");
    if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body) as PaystackEvent;
    if (!event.event || !VALID_EVENTS.has(event.event) || !event.data?.reference) {
      return NextResponse.json({ error: "Unsupported or incomplete event" }, { status: 400 });
    }

    const eventId = event.data.reference;
    const { error: eventError } = await supabaseAdmin.from("billing_events").insert({
      provider: "paystack",
      event_id: eventId,
      event_type: event.event,
      payload: event,
    });
    if (eventError?.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    if (eventError) return NextResponse.json({ error: "Unable to record billing event" }, { status: 500 });

    const userId = event.data.metadata?.user_id;
    if (!userId) return NextResponse.json({ received: true });

    const { data: account } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!account.user) return NextResponse.json({ error: "Unknown subscription account" }, { status: 400 });

    const tierFromMetadata = event.data.metadata?.tier;
    const tierName = tierFromMetadata && VALID_TIERS.includes(tierFromMetadata as typeof VALID_TIERS[number])
      ? tierFromMetadata
      : event.event === "charge.success" ? "Pro" : "Hobby";

    const success = event.event === "charge.success";
    const failed = event.event === "charge.failed";
    const canceled = event.event === "subscription.disable" || event.event === "subscription.not_renew";
    const status = success ? "active" : failed ? "past_due" : canceled ? "canceled" : null;

    if (status) {
      const { error } = await supabaseAdmin.from("subscription_stats").upsert({
        user_id: userId,
        tier_name: tierName,
        status,
        provider: "paystack",
        customer_code: event.data.customer?.customer_code || event.data.reference || null,
        subscription_code: event.data.subscription_code || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) return NextResponse.json({ error: "Subscription update failed" }, { status: 500 });

      await supabaseAdmin.from("audit_logs").insert({
        actor_email: account.user.email || "system",
        action: `subscription_${status}`,
        target: `${userId}:${tierName}`,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Paystack] Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
