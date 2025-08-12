// src/components/cards/InvoicesCard.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Invoice = {
  id: string;
  file_path: string;
  amount: number | null;
  description: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  uploaded_by: string;
};

export default function InvoicesCard({
  wsId,
  tabId,
  myRole,
}: {
  wsId: string;
  tabId: string;
  myRole: 'owner' | 'manager' | 'member';
}) {
  const supa = useMemo(() => createBrowserClient(), []);
  const r = useRouter();

  const [list, setList] = useState<Invoice[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  async function fetchList() {
    const { data, error } = await supa
      .from('invoices')
      .select('id,file_path,amount,description,status,created_at,uploaded_by')
      .eq('tab_id', tabId)
      .order('created_at', { ascending: false });
    if (!error && data) setList(data as any);
  }
  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [tabId]);

  async function upload() {
    if (!file) return;
    setBusy(true);

    const { data: u } = await supa.auth.getUser();
    const userId = u.user?.id!;
    const path = `${wsId}/${tabId}/${userId}/${Date.now()}-${file.name}`;

    const up = await supa.storage.from('invoices').upload(path, file);
    if (up.error) { alert(up.error.message); setBusy(false); return; }

    const ins = await supa
      .from('invoices')
      .insert({
        workspace_id: wsId,
        tab_id: tabId,
        uploaded_by: userId,
        file_path: path,
        amount: amount ? Number(amount) : null,
        description: desc || null,
      })
      .select('id')
      .single();

    if (ins.error) { alert(ins.error.message); setBusy(false); return; }

    await supa.from('activities').insert({
      workspace_id: wsId,
      tab_id: tabId,
      actor_id: userId,
      type: 'invoice_uploaded',
      meta: { path, amount: amount ? Number(amount) : null, description: desc || null },
    });

    setFile(null); setAmount(''); setDesc('');
    await fetchList(); setBusy(false); r.refresh();
  }

  async function setStatus(id: string, status: 'approved' | 'rejected') {
    const { error } = await supa.from('invoices').update({ status }).eq('id', id);
    if (error) { alert(error.message); return; }
    const { data: u } = await supa.auth.getUser();
    await supa.from('activities').insert({
      workspace_id: wsId, tab_id: tabId, actor_id: u.user?.id, type: 'invoice_status', meta: { id, status }
    });
    await fetchList(); r.refresh();
  }

  async function linkFor(path: string) {
    const { data } = await supa.storage.from('invoices').createSignedUrl(path, 60);
    return data?.signedUrl ?? '#';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Upload and track approvals</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload form: never clips, responsive */}
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {/* File + filename (takes full width on sm, 2 cols on lg) */}
          <div className="sm:col-span-2 lg:col-span-2">
            <FilePicker
              id="invoice-file"
              label="Select invoice"
              accept="*"
              file={file}
              onPick={setFile}
            />
          </div>

          {/* Amount (never clipped) */}
          <div className="min-w-0">
            <Input
              inputMode="decimal"
              placeholder="Amount (optional)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Description (full width) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <Textarea
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="min-h-24 resize-y"
            />
          </div>

          {/* Upload button (right on desktop, full width on mobile) */}
          <div className="sm:col-span-2 lg:col-span-3 flex">
            <Button onClick={upload} disabled={busy || !file} className="ml-auto">
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {list.map((item) => (
            <InvoiceRow
              key={item.id}
              item={item}
              onLink={linkFor}
              canModerate={myRole !== 'member'}
              onModerate={setStatus}
            />
          ))}
          {list.length === 0 && <div className="text-sm text-dim">No invoices yet.</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function FilePicker({
  id, label, accept, file, onPick,
}: { id: string; label: string; accept?: string; file: File | null; onPick: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <Button type="button" variant="outline" className="h-10" onClick={() => ref.current?.click()}>
          {label}
        </Button>
        <input
          ref={ref}
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        {/* filename: truncate within available space */}
        <label htmlFor={id} className="text-xs text-dim truncate flex-1 min-w-0">
          {file?.name ?? 'No file selected'}
        </label>
      </div>
    </div>
  );
}

function InvoiceRow({
  item,
  canModerate,
  onModerate,
  onLink,
}: {
  item: Invoice;
  canModerate: boolean;
  onModerate: (id: string, s: 'approved' | 'rejected') => void;
  onLink: (path: string) => Promise<string>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { onLink(item.file_path).then(setUrl); /* eslint-disable-next-line */ }, [item.file_path]);

  const badge =
    item.status === 'approved' ? (
      <Badge className="bg-emerald-900/50 text-emerald-200 border-emerald-800">approved</Badge>
    ) : item.status === 'rejected' ? (
      <Badge className="bg-rose-900/50 text-rose-200 border-rose-800">rejected</Badge>
    ) : (
      <Badge variant="secondary">pending</Badge>
    );

  return (
    <div className="flex items-start justify-between gap-3 rounded border px-3 py-2">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2 min-w-0">
          <a className="underline underline-offset-2 break-all" href={url ?? '#'} target="_blank" rel="noreferrer">
            {item.file_path.split('/').at(-1)}
          </a>
          {badge}
        </div>
        <div className="text-xs text-dim">
          {item.amount ? `€${Number(item.amount).toFixed(2)} · ` : ''}
          {new Date(item.created_at).toLocaleString()}
        </div>
        {item.description && <div className="text-sm break-words whitespace-pre-wrap">{item.description}</div>}
      </div>

      {canModerate && item.status === 'pending' && (
        <div className="flex-shrink-0 flex gap-2">
          <Button variant="outline" className="h-8" onClick={() => onModerate(item.id, 'approved')}>Approve</Button>
          <Button variant="outline" className="h-8" onClick={() => onModerate(item.id, 'rejected')}>Reject</Button>
        </div>
      )}
    </div>
  );
}
