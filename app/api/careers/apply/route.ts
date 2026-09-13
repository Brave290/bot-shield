import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { checkRateLimit, getClientIP } from "@/lib/rate-limit";
import { createHash } from "crypto";

const MAX_CV_BYTES = 5 * 1024 * 1024;
const roles = new Set(["Senior Backend Engineer", "Security Researcher", "Developer Advocate"]);
const allowedExtensions = new Set(["pdf", "doc", "docx"]);
const allowedTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function extension(name: string) {
  return name.toLowerCase().split(".").pop() || "";
}

async function hasValidSignature(file: File, ext: string) {
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (ext === "pdf") return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  if (ext === "doc") return bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0;
  return bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

export async function POST(request: Request) {
  try {
    const ip = await getClientIP();
    const scopeKey = createHash("sha256").update(ip).digest("hex");
    const limit = await checkRateLimit("careers_ip", scopeKey);
    if (!limit.allowed) return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429, headers: { "Retry-After": String(limit.resetInSeconds) } });

    const form = await request.formData();
    const role = String(form.get("role") || "");
    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const portfolio = String(form.get("portfolio") || "").trim();
    const note = String(form.get("note") || "").trim();
    const cv = form.get("cv");

    if (!roles.has(role) || name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !cv || typeof cv === "string") {
      return NextResponse.json({ error: "Invalid application details" }, { status: 400 });
    }

    const ext = extension(cv.name);
    if (!allowedExtensions.has(ext) || !allowedTypes.has(cv.type) || cv.size === 0 || cv.size > MAX_CV_BYTES || !(await hasValidSignature(cv, ext))) {
      return NextResponse.json({ error: "CV must be a valid PDF, DOC, or DOCX file under 5MB" }, { status: 400 });
    }

    const path = `${crypto.randomUUID()}.${ext}`;
    const upload = await supabaseAdmin.storage.from("careers").upload(path, Buffer.from(await cv.arrayBuffer()), {
      contentType: cv.type,
      upsert: false,
    });
    if (upload.error) return NextResponse.json({ error: "Unable to store CV" }, { status: 500 });

    const { error } = await supabaseAdmin.from("job_applications").insert({ role, name, email, portfolio, note, cv_url: path });
    if (error) {
      await supabaseAdmin.storage.from("careers").remove([path]);
      return NextResponse.json({ error: "Unable to save application" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid application request" }, { status: 400 });
  }
}
