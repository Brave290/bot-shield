import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");
    const secret = process.env.PAYSTACK_SECRET_KEY;

    if (!secret || !signature) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 401 });
    }

    // Verify webhook signature using Paystack's secret key
    const hash = createHmac("sha512", secret).update(body).digest("hex");
    if (hash !== signature) {
      console.error("[Paystack] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Only process successful charges
    if (event.event === "charge.success") {
      const metadata = event.data.metadata || {};
      const userId = metadata.user_id;

      if (!userId) {
        console.error("[Paystack] No user_id found in metadata");
        return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
      }

      // Upgrade user to Pro
      const { error } = await supabaseAdmin.from("subscription_stats").upsert(
        { user_id: userId, tier_name: "Pro", updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("[Paystack] DB update failed:", error);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
      
      console.log(`[Paystack] User ${userId} upgraded to Pro`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Paystack] Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
