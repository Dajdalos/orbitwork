import { createMiddlewareClient as createSSRMiddlewareClient } from '@supabase/ssr';
import type { NextRequest, NextResponse } from 'next/server';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
  return createSSRMiddlewareClient(
    { req, res },
    {
      supabaseUrl: URL,
      supabaseKey: ANON,
    }
  );
}
