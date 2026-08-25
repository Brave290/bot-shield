import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  if (slug) {
    const { data } = await supabaseAdmin.from("blog_posts").select("*").eq("slug", slug).eq("published", true).single();
    return NextResponse.json(data || null);
  }
  const { data } = await supabaseAdmin.from("blog_posts").select("*").eq("published", true).order("created_at", { ascending: false });
  return NextResponse.json(data || []);
}

// Admin edit: POST with x-admin-key header (set ADMIN_API_KEY in .env)
export async function POST(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!process.env.ADMIN_API_KEY || key !== process.env.ADMIN_API_KEY) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await req.json();
  const { data, error } = await supabaseAdmin.from("blog_posts").upsert(body, { onConflict: "slug" }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
