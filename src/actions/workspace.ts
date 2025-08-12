'use server';

import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function createWorkspaceAction(_: any, formData: FormData) {
  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const name = String(formData.get('name') ?? '').trim() || 'Untitled';
  const makeInitialTab = String(formData.get('initialTab') ?? '') === 'on';

  const admin = createAdminClient();

  const { data: ws, error: werr } = await admin
    .from('workspaces')
    .insert({ name, created_by: user.id })
    .select('id')
    .single();
  if (werr) return { ok: false, error: werr.message };

  const { error: merr } = await admin
    .from('workspace_members')
    .upsert(
      { workspace_id: ws.id, user_id: user.id, role: 'owner' },
      { onConflict: 'workspace_id,user_id', ignoreDuplicates: true }
    );
  if (merr) return { ok: false, error: merr.message };

  if (makeInitialTab) {
    const now = new Date();
    const label = now.toLocaleString('en', { month: 'short', year: 'numeric' });
    await admin.from('tabs').insert({ workspace_id: ws.id, label, month: now.getMonth()+1, year: now.getFullYear() });
  }

  return { ok: true, id: ws.id };
}
