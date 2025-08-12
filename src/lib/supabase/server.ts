// src/lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient as createSSRServerClient } from '@supabase/ssr';
import { createClient as createCoreClient } from '@supabase/supabase-js';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE!;

export function createServerClient() {
  const cookieStore = cookies(); // sync in Next 15
  return createSSRServerClient(URL, ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: Partial<ResponseCookie>) {
        // In RSC, setting might be a no-op; that's fine.
        try {
          cookieStore.set(name, value, options);
        } catch {}
      },
      remove(name: string, options: Partial<ResponseCookie>) {
        try {
          cookieStore.delete({ name, ...options });
        } catch {}
      },
    },
  });
}

// Backwards compatibility for modules still importing the old name.
export const createSupabaseServer = createServerClient;

// ⚠️ Service-role bypasses RLS/auth.uid(); do NOT use it in user-facing server actions.
export function createAdminClient() {
  return createCoreClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
