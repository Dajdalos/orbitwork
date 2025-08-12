import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/';
  const res = NextResponse.redirect(new URL(next, url.origin));
  if (code) {
    const supa = createMiddlewareClient(
      { req, res },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    );
    await supa.auth.exchangeCodeForSession(code);
  }
  return res;
}
