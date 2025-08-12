'use server';

import { redirect } from 'next/navigation';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function deleteWorkspaceAction(wsId: string, _formData: FormData) {
  const supa = await createServerClient();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();

  // Verify owner
  const { data: ws, error: werr } = await admin
    .from('workspaces')
    .select('id, created_by')
    .eq('id', wsId)
    .maybeSingle();
  if (werr || !ws) throw new Error(werr?.message || 'Workspace not found');
  if (ws.created_by !== user.id) throw new Error('Only the owner can delete this workspace');

  // Tab ids for fallback deletes (when child tables don't have workspace_id)
  const { data: tabRows, error: tabsErr } = await admin
    .from('tabs')
    .select('id')
    .eq('workspace_id', wsId);
  if (tabsErr) throw new Error(`Failed loading tabs: ${tabsErr.message}`);
  const tabIds: string[] = (tabRows ?? []).map((t: any) => String(t.id));

  // Helper: delete from a table by workspace_id, fallback to tab_id if needed
  async function delByWsOrTabs(
    table: string,
    opts?: { hasTab?: boolean; tabCol?: string }
  ) {
    const tabCol = opts?.tabCol ?? 'tab_id';
    // try workspace_id first
    const r1 = await admin.from(table).delete().eq('workspace_id', wsId);
    if (!r1.error) return;
    // if column doesn't exist, fallback via tab_id (when available)
    const e = r1.error;
    const isNoCol =
      e.code === '42703' || /column .*workspace_id .* does not exist/i.test(e.message || '');
    if (isNoCol && opts?.hasTab && tabIds.length > 0) {
      const r2 = await admin.from(table).delete().in(tabCol, tabIds);
      if (r2.error && r2.error.code !== 'PGRST116') {
        throw new Error(`Failed deleting from ${table} (fallback): ${r2.error.message}`);
      }
      return;
    }
    // ignore "no rows" errors; otherwise bubble up
    if (e.code !== 'PGRST116') {
      throw new Error(`Failed deleting from ${table}: ${e.message}`);
    }
  }

  // 1) Delete activity (has workspace_id)
  await delByWsOrTabs('activities');

  // 2) Delete child data (with robust fallbacks)
  await delByWsOrTabs('invoices', { hasTab: true });
  await delByWsOrTabs('proofs', { hasTab: true });
  await delByWsOrTabs('tab_roles', { hasTab: true });
  await delByWsOrTabs('tab_members', { hasTab: true });

  // 3) Delete tabs themselves (by workspace or by in(id))
  {
    const r1 = await admin.from('tabs').delete().eq('workspace_id', wsId);
    if (r1.error) {
      const isNoCol =
        r1.error.code === '42703' ||
        /column .*workspace_id .* does not exist/i.test(r1.error.message || '');
      if (isNoCol && tabIds.length > 0) {
        const r2 = await admin.from('tabs').delete().in('id', tabIds);
        if (r2.error && r2.error.code !== 'PGRST116') {
          throw new Error(`Failed deleting tabs (fallback): ${r2.error.message}`);
        }
      } else if (r1.error.code !== 'PGRST116') {
        throw new Error(`Failed deleting tabs: ${r1.error.message}`);
      }
    }
  }

  // 4) Best-effort: remove Storage files under this workspace folder
  // (works whether buckets are public or private)
  async function removeBucketPrefix(bucket: string, prefix: string) {
    // recursively list and collect paths
    async function listAll(dir: string): Promise<string[]> {
      const acc: string[] = [];
      const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 1000 });
      if (error) return acc; // swallow storage list errors
      for (const it of data ?? []) {
        const path = dir ? `${dir}/${it.name}` : it.name;
        if (it.id) {
          // it's a file
          acc.push(path);
        } else {
          // it's a "folder" (no id) — recurse
          acc.push(...(await listAll(path)));
        }
      }
      return acc;
    }
    const files = await listAll(prefix);
    if (files.length) {
      // remove in chunks to avoid payload limits
      const chunk = 100;
      for (let i = 0; i < files.length; i += chunk) {
        await admin.storage.from(bucket).remove(files.slice(i, i + chunk));
      }
    }
  }
  try {
    await Promise.all([
      removeBucketPrefix('invoices', wsId),
      removeBucketPrefix('proofs', wsId),
    ]);
  } catch {
    // ignore storage cleanup errors
  }

  // 5) Delete members (by workspace_id)
  {
    const r = await admin.from('workspace_members').delete().eq('workspace_id', wsId);
    if (r.error && r.error.code !== 'PGRST116') {
      throw new Error(`Failed deleting members: ${r.error.message}`);
    }
  }

  // 6) Finally delete the workspace
  {
    const r = await admin.from('workspaces').delete().eq('id', wsId);
    if (r.error) throw new Error(`Failed deleting workspace: ${r.error.message}`);
  }

  redirect('/workspaces');
}
