import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const res = NextResponse.redirect(new URL(next, url.origin));
  if (code) {
    const supa = createMiddlewareClient(req, res);
    await supa.auth.exchangeCodeForSession(code);
  }
  return res;
}
