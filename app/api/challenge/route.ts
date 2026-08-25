import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { calculateBotScore, isBlocked, BotPayload } from '@/lib/scoring-engine';
import { SignJWT } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, mouseData, typingData, fingerprint } = body as {
      apiKey: string; mouseData: BotPayload['mouseData']; typingData: BotPayload['typingData']; fingerprint: string;
    };

    if (!apiKey) return NextResponse.json({ error: 'Missing API key' }, { status: 400 });

    const { data: project, error } = await supabaseAdmin.from('projects').select('id, secret_key, sensitivity, allowed_origins').eq('api_key', apiKey).single();
    if (error || !project) return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });

    const origin = req.headers.get('origin') || '';
    if (project.allowed_origins.length > 0 && !project.allowed_origins.includes(origin)) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
    }

    const score = calculateBotScore({ mouseData, typingData, fingerprint });
    const blocked = isBlocked(score, project.sensitivity);
    const ipAddress = req.headers.get('x-forwarded-for') || req.ip || 'unknown';

    await supabaseAdmin.from('verification_logs').insert({
      project_id: project.id, ip_address: ipAddress, browser_fingerprint: fingerprint,
      mouse_score: Math.round(score * 0.5), typing_score: Math.round(score * 0.5),
      total_score: score, is_blocked: blocked,
    });

    if (blocked) return NextResponse.json({ status: 'blocked', score }, { status: 403 });

    const secret = new TextEncoder().encode(project.secret_key);
    const token = await new SignJWT({ projectId: project.id, score })
      .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('5m').sign(secret);

    return NextResponse.json({ status: 'passed', token });
  } catch (err) {
    console.error('Challenge API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
