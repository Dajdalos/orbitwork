import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supa = createMiddlewareClient(req, res);
  await supa.auth.getSession();
  return res;
}



export const config = {
  matcher: [
    // Skip static files and api route for static assets
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json).*)',
  ],
};