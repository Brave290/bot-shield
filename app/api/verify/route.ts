import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

export async function POST(req: NextRequest) {
  try {
    const { secretKey, token } = await req.json() as { secretKey: string; token: string };
    if (!secretKey || !token) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });

    const { data: project, error } = await supabaseAdmin.from('projects').select('id, secret_key').eq('secret_key', secretKey).single();
    if (error || !project) return NextResponse.json({ error: 'Invalid secret key' }, { status: 401 });

    const secret = new TextEncoder().encode(project.secret_key);
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({ status: 'human', payload });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
