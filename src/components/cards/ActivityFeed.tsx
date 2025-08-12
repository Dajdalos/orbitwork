'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Activity = {
  id: string;
  type: string;
  created_at: string;
  meta: any;
  tab_id: string | null;
  actor_id: string;
};

export default function ActivityFeed({ wsId }: { wsId: string }) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [items, setItems] = useState<Activity[]>([]);

  async function load() {
    const { data } = await supa
      .from('activities')
      .select('id,type,created_at,meta,tab_id,actor_id')
      .eq('workspace_id', wsId)
      .order('created_at', { ascending: false })
      .limit(30);
    setItems((data ?? []) as any);
  }

  useEffect(() => {
    load();
    const ch = supa
      .channel(`ws-acts-${wsId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activities', filter: `workspace_id=eq.${wsId}` }, () => load())
      .subscribe();
    return () => { supa.removeChannel(ch); };
    // eslint-disable-next-line
  }, [wsId]);

  return (
    <Card>
      <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map(a => <Row key={a.id} a={a} />)}
        {items.length === 0 && <div className="text-sm text-dim">No activity yet.</div>}
      </CardContent>
    </Card>
  );
}

function Row({ a }: { a: Activity }) {
  const when = new Date(a.created_at).toLocaleString();
  const map: Record<string, string> = {
    tab_created: 'created a tab',
    invoice_uploaded: 'uploaded an invoice',
    invoice_status: `changed invoice status to ${(a.meta?.status ?? '').toString()}`,
    proof_uploaded: 'uploaded a photo proof',
    role_added: 'added a role',
    tab_member_added: 'assigned a member to a tab',
    tab_member_removed: 'removed a member from a tab',
  };
  const text = map[a.type] ?? a.type;
  return (
    <div className="text-sm text-dim">
      <span className="text-white">{a.actor_id.slice(0, 6)}…</span> {text}
      {a.meta?.info ? ` (${a.meta.info})` : ''} <span className="ml-2">{when}</span>
    </div>
  );
}
