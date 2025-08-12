// src/app/workspaces/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteWorkspaceAction } from '@/actions/workspaces';

export const dynamic = 'force-dynamic';

type WSRow = { id: string; name: string; created_at: string; created_by: string };
type MemberRow = { workspace_id: string };

export default async function WorkspacesPage() {
  const supa = await createServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // 1) Workspaces you own
  const { data: ownedData } = await admin
    .from('workspaces')
    .select('id,name,created_at,created_by')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  const owned: WSRow[] = (ownedData ?? []) as WSRow[];

  // 2) Membership rows (where you're a member)
  const { data: memberRowsData } = await admin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id);

  const memberRows: MemberRow[] = (memberRowsData ?? []) as MemberRow[];

  // Unique member workspace ids, excluding ones you already own
  const ownedIds = new Set(owned.map((o) => o.id));
  const memberIds = Array.from(new Set(memberRows.map((r) => r.workspace_id))).filter(
    (id) => !ownedIds.has(id)
  );

  // 3) Workspaces where you're a member (not owner)
  let memberWorkspaces: WSRow[] = [];
  if (memberIds.length > 0) {
    const { data: memberWsData } = await admin
      .from('workspaces')
      .select('id,name,created_at,created_by')
      .in('id', memberIds)
      .order('created_at', { ascending: false });

    memberWorkspaces = (memberWsData ?? []) as WSRow[];
  }

  const workspaces: WSRow[] = [...owned, ...memberWorkspaces];

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">My workspaces</h1>
        <div className="flex gap-2">
          <Link href="/workspace/new">
            <Button>New workspace</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {workspaces.map((ws) => (
          <Card key={ws.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/workspace/${ws.id}`} className="font-medium hover:underline">
                  {ws.name}
                </Link>
                <div className="text-xs text-dim mt-1">
                  {new Date(ws.created_at).toLocaleString()}
                </div>
              </div>

              {ws.created_by === user.id && (
                <form action={deleteWorkspaceAction.bind(null, ws.id)}>
                  <button
                    type="submit"
                    className="rounded-md border border-red-700 text-red-300 px-2 py-1 text-xs hover:bg-red-900/20 transition"
                    title="Delete workspace"
                  >
                    Delete
                  </button>
                </form>
              )}
            </div>
          </Card>
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
