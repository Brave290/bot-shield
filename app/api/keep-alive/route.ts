import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { error } = await supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).limit(1);
    if (error) return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    return NextResponse.json({ status: 'success', message: 'Database is awake!' });
  } catch (err) {
    return NextResponse.json({ status: 'error', message: 'Internal server error' }, { status: 500 });
  }
}
