import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function WorkspacesPage() {
  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');

  const { data } = await supa
    .from('workspaces')
    .select('id,name,created_at')
    .order('created_at', { ascending: false });
  const workspaces = (data ?? []) as any[];

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My workspaces</h1>
        <div className="flex gap-2">
          <Link href="/" className="text-sm underline text-dim">Back to Home</Link>
          <Link href="/workspace/new"><Button>New workspace</Button></Link>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {workspaces.map(ws => (
          <Link key={ws.id} href={`/workspace/${ws.id}`} className="block">
            <Card className="p-4 hover:bg-white/5 transition">
              <div className="font-medium">{ws.name}</div>
              <div className="text-xs text-dim mt-1">{new Date(ws.created_at).toLocaleString()}</div>
            </Card>
          </Link>
        ))}
        {workspaces.length === 0 && (
          <Card className="p-4">
            <div className="text-sm text-dim">No workspaces yet.</div>
          </Card>
        )}
      </div>
    </main>
  );
}
