import { supabaseAdmin } from "@/lib/supabase/server";

const CONFIGURED_ADMINS = new Set((process.env.ADMIN_EMAILS || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean));

export async function getAdmin(req: Request): Promise<{ email: string; role: string } | null> {
  const token = (req.headers.get("authorization") || "").replace("Bearer ", "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user?.email) return null;
  const email = data.user.email;
  const { data: row } = await supabaseAdmin.from("admins").select("*").eq("email", email).single();
  if (row) return { email, role: row.role };
  const { count } = await supabaseAdmin.from("admins").select("*", { count: "exact", head: true });
  if ((count || 0) === 0 && CONFIGURED_ADMINS.has(email.toLowerCase())) return { email, role: "owner" };
  return null;
}
