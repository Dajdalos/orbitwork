'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type Row = { id: string; label: string; rate: number };

export default function RolesRatesCard({
  wsId,
  tabId,
  canEdit,
}: {
  wsId: string;
  tabId: string;
  canEdit: boolean;
}) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [label, setLabel] = useState('');
  const [rate, setRate] = useState('');

  async function load() {
    const { data } = await supa
      .from('tab_roles')
      .select('id,label,rate')
      .eq('tab_id', tabId)
      .order('created_at', { ascending: true });
    setRows((data ?? []) as any);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tabId]);

  async function add() {
    if (!label.trim()) return;
    const { data: u } = await supa.auth.getUser();
    const userId = u.user?.id!;
    const { error } = await supa.from('tab_roles').insert({
      workspace_id: wsId, tab_id: tabId, label: label.trim(), rate: rate ? Number(rate) : 0, created_by: userId
    });
    if (error) { alert(error.message); return; }
    await supa.from('activities').insert({
      workspace_id: wsId, tab_id: tabId, actor_id: userId, type: 'role_added', meta: { label: label.trim(), rate: rate ? Number(rate) : 0 }
    });
    setLabel(''); setRate(''); await load();
  }

  async function remove(id: string) {
    const row = rows.find(r => r.id === id);
    const { data: u } = await supa.auth.getUser();
    const userId = u.user?.id!;
    const { error } = await supa.from('tab_roles').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await supa.from('activities').insert({
      workspace_id: wsId, tab_id: tabId, actor_id: userId, type: 'role_removed', meta: { id, label: row?.label ?? null, rate: row ? Number(row.rate) : null }
    });
    await load();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & rates</CardTitle>
        <CardDescription>Define billable roles for this tab</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {canEdit && (
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2">
            <Input placeholder="Role (e.g., Designer)" value={label} onChange={(e) => setLabel(e.target.value)} />
            <Input placeholder="Rate (€/h)" value={rate} onChange={(e) => setRate(e.target.value)} />
            <Button onClick={add}>Add</Button>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded border px-3 py-2">
              <div className="min-w-0 flex-1">
                <div className="text-sm break-words">{r.label}</div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-sm text-dim">€{Number(r.rate).toFixed(2)}/h</div>
                {canEdit && (
                  <Button variant="outline" className="h-8" onClick={() => remove(r.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && <div className="text-sm text-dim">No roles yet.</div>}
        </div>
      </CardContent>
    </Card>
  );
}
