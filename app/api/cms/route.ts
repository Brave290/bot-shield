import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug");

  let query = supabaseAdmin.from("cms_pages").select("*").order("updated_at", { ascending: false });
  if (type) query = query.eq("type", type);
  if (slug) query = query.eq("slug", slug).single();

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, slug, title, content, type, is_published } = body;

  if (!slug || !title || !content || !type) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (id) {
    // Update existing
    const { error } = await supabaseAdmin.from("cms_pages").update({ slug, title, content, type, is_published }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Create new
    const { error } = await supabaseAdmin.from("cms_pages").insert({ slug, title, content, type, is_published });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  const { data: auth } = await supabaseAdmin.auth.getUser(token);
  if (!auth?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

  const { error } = await supabaseAdmin.from("cms_pages").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  return NextResponse.json({ ok: true });
}
