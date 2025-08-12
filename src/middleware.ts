import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supa = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  );
  await supa.auth.getSession();
  return res;
}

export const config = {
  matcher: [
    // Skip static files and api route for static assets
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};
