// src/app/(app)/workspace/[id]/page.tsx
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { AppShell, RightSidebar } from '@/components/app-shell';
import { TabSwitcher } from '@/components/tab-switcher';
import StatsBar from '@/components/cards/StatsBar';
import InvoicesCard from '@/components/cards/InvoicesCard';
import ProofsCard from '@/components/cards/ProofsCard';
import RolesRatesCard from '@/components/cards/RolesRatesCard';
import TabAssigneesCard from '@/components/cards/TabAssigneesCard';
import ActivityFeed from '@/components/cards/ActivityFeed';
import { AddTabForm } from '@/components/add-tab-form';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { deleteWorkspaceAction } from '@/actions/workspaces';
import A1DocsCard from '@/components/cards/A1DocsCard';
import InviteButton from '@/components/InviteButton';


type MemberRole = 'owner' | 'manager' | 'member';
type MemberRow = { user_id: string; role: MemberRole | string | null };
type ProfileRow = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };

export const dynamic = 'force-dynamic';

export default async function WorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id: wsId } = await params;

  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Access check
  const { data: ws } = await admin
    .from('workspaces')
    .select('id,name,created_by')
    .eq('id', wsId)
    .maybeSingle();

  const { data: myMembership } = await admin
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', wsId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (!ws || !(ws.created_by === user.id || myMembership)) notFound();

  const myRole: MemberRole =
    ((myMembership?.role as MemberRole) ?? (ws.created_by === user.id ? 'owner' : 'member'));
  const isOwner = myRole === 'owner';

  // Members + profiles
  const { data: memberRowsData } = await admin
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', wsId);

  const memberRows: MemberRow[] = (memberRowsData ?? []).map((r: any) => ({
    user_id: String(r.user_id),
    role: (r.role as MemberRole) ?? 'member',
  }));

  const userIds = memberRows.map((m) => m.user_id);
  let profiles: ProfileRow[] = [];
  if (userIds.length > 0) {
    const { data: profilesData } = await admin
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .in('id', userIds);
    profiles = (profilesData ?? []) as ProfileRow[];
  }

  const memberList = memberRows.map((m) => {
    const p = profiles.find((pr) => pr.id === m.user_id);
    return {
      id: m.user_id,
      role: (m.role as MemberRole) ?? 'member',
      name: p?.full_name || p?.email || 'User',
      avatar: p?.avatar_url || undefined,
    };
  });

  // Tabs (RLS governs visibility)
  const { data: tabsData } = await supa
    .from('tabs')
    .select('id,label,month,year')
    .eq('workspace_id', wsId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  const tabs = (tabsData ?? []).map((t: any) => ({
    id: String(t.id),
    label: String(t.label),
  })) as { id: string; label: string }[];

  const sp = await searchParams;
  const activeId = (tabs.find((t) => t.id === sp.tab)?.id ?? tabs[0]?.id) as string | undefined;

  return (
    <AppShell
      sidebar={
        <RightSidebar members={memberList}>
          {activeId && (
            <div className="space-y-6">
              <TabAssigneesCard wsId={wsId} tabId={activeId} canEdit={myRole !== 'member'} />
              <ActivityFeed wsId={wsId} />

            </div>
          )}
        </RightSidebar>
      }
    >
      {/* Header card (left/main) */}
      <div className="bg-panel rounded-xl border p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-sm text-dim">Workspace</div>
            <div className="text-xl font-semibold">{ws.name}</div>
          </div>

          {/* Trimmed: no Back to Home / All workspaces / New workspace */}
          <div className="flex items-center gap-2">
            {isOwner && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="h-8 border-red-700 text-red-300 hover:bg-red-900/20"
                  >
                    Delete workspace
                  </Button>
                </AlertDialogTrigger>
                <InviteButton wsId={wsId} />
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this workspace?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the workspace, its tabs, invoices, proofs,
                      roles, members, and activity. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <form action={deleteWorkspaceAction.bind(null, wsId)}>
                      <Button type="submit" variant="destructive">
                        Yes, delete it
                      </Button>
                    </form>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Tabs & stats */}
        <div className="mt-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <TabSwitcher wsId={wsId} tabs={tabs} activeId={activeId} canDelete={isOwner} />
            <AddTabForm wsId={wsId} />
            
          </div>
          {activeId && <StatsBar tabId={activeId} />}
        </div>
      </div>

      {/* Left column content (cards) */}
      {activeId ? (
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InvoicesCard wsId={wsId} tabId={activeId} myRole={myRole} />
          <ProofsCard wsId={wsId} tabId={activeId} />
          <RolesRatesCard wsId={wsId} tabId={activeId} canEdit={myRole !== 'member'} />
          <A1DocsCard wsId={wsId} tabId={activeId} />
        </div>
      ) : (
        <div className="text-sm text-dim mt-6">No tabs yet.</div>
      )}
    </AppShell>
  );
}
