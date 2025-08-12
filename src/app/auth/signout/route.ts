import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  const supa = createMiddlewareClient(req, res);
  await supa.auth.signOut();
  return res;
}
