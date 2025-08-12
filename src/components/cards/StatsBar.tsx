'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';

export default function StatsBar({ tabId }: { tabId: string }) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [pending, setPending] = useState(0);
  const [approved, setApproved] = useState(0);
  const [sum, setSum] = useState(0);
  const [proofs, setProofs] = useState(0);

  async function load() {
    const { data: inv } = await supa
      .from('invoices')
      .select('amount,status')
      .eq('tab_id', tabId);

    const { data: pf } = await supa
      .from('proofs')
      .select('id')
      .eq('tab_id', tabId);

    const list = inv ?? [];
    setPending(list.filter(i => i.status === 'pending').length);
    setApproved(list.filter(i => i.status === 'approved').length);
    setSum(list.filter(i => i.status === 'approved').reduce((a, b) => a + Number(b.amount ?? 0), 0));
    setProofs((pf ?? []).length);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tabId]);

  return (
    <div className="grid sm:grid-cols-4 gap-3">
      <Stat title="Approved (sum)" value={`€${sum.toFixed(2)}`} />
      <Stat title="Approved (count)" value={approved} />
      <Stat title="Pending invoices" value={pending} />
      <Stat title="Photo proofs" value={proofs} />
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-dim">{title}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </Card>
  );
}
