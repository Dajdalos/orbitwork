import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function Home() {
  
  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();

  let workspaces: { id: string; name: string }[] = [];
  if (user) {
    const { data } = await supa
      .from('workspaces')
      .select('id,name')
      .order('created_at', { ascending: false })
      .limit(8);
    workspaces = (data ?? []) as any;
  }

  return (
    <main className="min-h-dvh bg-[#0b0b0f] text-[#e6e6ea]">
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
            Organize work by month with roles, invoices & photo proofs.
          </h1>
          <p className="mt-4 text-dim">
            Owners manage roles and visibility. Members only see their assigned tabs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <>
                <Link href="/workspace/new" className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition">Create workspace</Link>
                <Link href="/workspaces" className="rounded-md border border-[#2b2b35] px-4 py-2 text-sm hover:bg-white/5 transition">View all my workspaces</Link>
              </>
            ) : (
              <>
                <Link href="/signup" className="rounded-md bg-white text-black px-4 py-2 text-sm font-medium hover:bg-white/90 transition">Sign up</Link>
                <Link href="/login" className="rounded-md border border-[#2b2b35] px-4 py-2 text-sm hover:bg-white/5 transition">Log in</Link>
              </>
            )}
          </div>
        </div>

        {user && (
          <div className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Your workspaces</h2>
              <Link href="/workspaces" className="text-sm text-dim hover:underline">View all</Link>
            </div>
            <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {workspaces.map(ws => (
                <Link key={ws.id} href={`/workspace/${ws.id}`} className="block">
                  <Card className="p-4 hover:bg-white/5 transition">
                    <div className="font-medium">{ws.name}</div>
                    <div className="text-sm text-dim mt-1">{ws.id}</div>
                  </Card>
                </Link>
              ))}
              {workspaces.length === 0 && (
                <Card className="p-4">
                  <div className="text-sm text-dim">No workspaces yet — create your first one.</div>
                </Card>
              )}
            </div>
          </div>
        )}
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-10 text-dim text-sm">
        © {new Date().getFullYear()} OrbitWork
      </footer>
    </main>
  );
}
