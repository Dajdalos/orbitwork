// src/lib/supabase/server.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient as createCoreClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE!;

export function createSupabaseServer() {
  const cookieStore = cookies(); // sync in Next 15
  return createServerClient(URL, ANON, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // In RSC, setting might be a no-op; that's fine.
        try { cookieStore.set(name, value, options); } catch {}
      },
      remove(name: string, options: any) {
        try { cookieStore.delete({ name, ...options }); } catch {}
      },
    },
  });
}

// ⚠️ Service-role bypasses RLS/auth.uid(); do NOT use it in user-facing server actions.
export function createAdminClient() {
  return createCoreClient(URL, SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
