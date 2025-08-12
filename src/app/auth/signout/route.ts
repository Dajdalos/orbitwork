import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/', req.url));
  const supa = createMiddlewareClient(
    { req, res },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    }
  );
  await supa.auth.signOut();
  return res;
}
