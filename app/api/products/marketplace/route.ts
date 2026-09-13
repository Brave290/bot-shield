import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";

async function auth(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await supabaseAdmin.auth.getUser(token);
  return data.user || null;
}

export async function GET(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const url = new URL(req.url);
  const category = url.searchParams.get("category") || "";
  const search = url.searchParams.get("q") || "";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 200);
  const offset = parseInt(url.searchParams.get("offset") || "0");

  let query = supabaseAdmin
    .from("marketplace_items")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) query = query.eq("category", category);
  if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const [{ data: purchases }] = await Promise.all([
    supabaseAdmin
      .from("marketplace_purchases")
      .select("item_id")
      .eq("user_id", user.id),
  ]);

  const purchasedIds = new Set((purchases || []).map((p) => p.item_id));
  const items = (data || []).map((item) => ({ ...item, purchased: purchasedIds.has(item.id) }));

  return NextResponse.json({ items, total: count || 0 });
}

export async function POST(req: Request) {
  const user = await auth(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const rateLimit = await checkRateLimit("marketplace", user.id);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Rate limit exceeded", resetInSeconds: rateLimit.resetInSeconds }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  if (action === "purchase") {
    const itemId = String(body.item_id || "");
    if (!itemId) return NextResponse.json({ error: "Item ID required" }, { status: 400 });

    const { data: item } = await supabaseAdmin
      .from("marketplace_items")
      .select("*")
      .eq("id", itemId)
      .eq("published", true)
      .single();

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    const { data: existingPurchase } = await supabaseAdmin
      .from("marketplace_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .single();

    if (existingPurchase) return NextResponse.json({ error: "Already purchased" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("marketplace_purchases")
      .insert({
        user_id: user.id,
        item_id: itemId,
        item_name: item.name,
        price: item.price || 0,
        status: "completed",
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await supabaseAdmin.from("security_events").insert({ user_id: user.id, event_type: "marketplace.purchased", metadata: { item_id: itemId, name: item.name } });
    return NextResponse.json({ purchase: data });
  }

  if (action === "get-purchases") {
    const { data, error } = await supabaseAdmin
      .from("marketplace_purchases")
      .select("*, marketplace_items(name, description, category)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ purchases: data || [] });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
