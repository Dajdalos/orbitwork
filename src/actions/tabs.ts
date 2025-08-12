// src/actions/tabs.ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseServer } from '@/lib/supabase/server'; // ← if yours is named createServerClient, import that

export async function createTabAction(wsId: string, formData: FormData) {
  const supa = await createSupabaseServer(); // or createServerClient()
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');

  // Parse "Aug 2025" → month/year
  const raw = String(formData.get('label') ?? '').trim();
  const now = new Date();
  const monthMap: Record<string, number> = { jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
  const parts = raw.split(/\s+/);
  const mm = monthMap[(parts[0] || '').slice(0,3).toLowerCase()] ?? (now.getMonth() + 1);
  const yy = Number(parts[1]) || now.getFullYear();
  const label = raw || now.toLocaleString('en', { month: 'short', year: 'numeric' });

  // Insert with the authed client (trigger sets created_by = auth.uid())
  const { data: tab, error } = await supa
    .from('tabs')
    .insert({ workspace_id: wsId, label, month: mm, year: yy })
    .select('id')
    .single();

  if (error) {
    console.error('Create tab failed:', error);
    throw new Error(error.message);
  }

  // Activity with the same authed client (RLS applies)
  await supa.from('activities').insert({
    workspace_id: wsId,
    tab_id: tab.id,
    actor_id: user.id,
    action: 'tab.created',
    meta: { label, month: mm, year: yy },
  }).catch(() => {}); // best effort

  revalidatePath(`/workspace/${wsId}`);
  redirect(`/workspace/${wsId}?tab=${tab.id}`);
}

export async function deleteTabAction(wsId: string, tabId: string, _formData: FormData) {
  const supa = await createSupabaseServer(); // or createServerClient()
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');

  // Ensure the tab belongs to this workspace (and you have access)
  const { data: tab, error: serr } = await supa
    .from('tabs').select('id').eq('id', tabId).eq('workspace_id', wsId).single();
  if (serr || !tab) throw new Error(serr?.message || 'Tab not found');

  // Delete (FKs are ON DELETE CASCADE; no need to delete children manually)
  const { error } = await supa.from('tabs').delete().eq('id', tabId);
  if (error) throw new Error(error.message);

  // Pick remaining tab (optional)
  const { data: remaining } = await supa
    .from('tabs').select('id').eq('workspace_id', wsId)
    .order('year', { ascending: false }).order('month', { ascending: false }).limit(1);

  revalidatePath(`/workspace/${wsId}`);
  if (remaining && remaining.length) redirect(`/workspace/${wsId}?tab=${remaining[0].id}`);
  redirect(`/workspace/${wsId}`);
}
