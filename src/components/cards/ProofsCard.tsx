'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type Proof = { id: string; file_path: string; note: string | null; created_at: string };

export default function ProofsCard({ wsId, tabId }: { wsId: string; tabId: string }) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [list, setList] = useState<Proof[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function fetchList() {
    const { data } = await supa
      .from('proofs')
      .select('id,file_path,note,created_at')
      .eq('tab_id', tabId)
      .order('created_at', { ascending: false });
    setList((data ?? []) as any);
  }
  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [tabId]);

  async function signed(path: string) {
    const { data } = await supa.storage.from('proofs').createSignedUrl(path, 120);
    return data?.signedUrl ?? '#';
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    const { data: u } = await supa.auth.getUser();
    const userId = u.user?.id!;
    const path = `${wsId}/${tabId}/${userId}/${Date.now()}-${file.name}`;
    const up = await supa.storage.from('proofs').upload(path, file);
    if (up.error) { alert(up.error.message); setBusy(false); return; }
    const ins = await supa.from('proofs').insert({
      workspace_id: wsId, tab_id: tabId, uploaded_by: userId, file_path: path, note: note || null
    });
    if (ins.error) { alert(ins.error.message); setBusy(false); return; }
    await supa.from('activities').insert({
      workspace_id: wsId, tab_id: tabId, actor_id: userId, type: 'proof_uploaded', meta: { path, note: note || null }
    });
    setFile(null); setNote(''); await fetchList(); setBusy(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo proofs</CardTitle>
        <CardDescription>Upload and preview images</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <FilePicker
              id="proof-file"
              label="Select image"
              accept="image/*"
              file={file}
              onPick={setFile}
            />
            <div className="sm:col-span-2">
              <Textarea
                placeholder="Note (optional)"
                value={note}
                onChange={(e)=>setNote(e.target.value)}
                className="min-h-24 resize-y"
              />
            </div>
          </div>
          <div className="flex md:flex-col gap-2">
            <Button onClick={upload} disabled={busy || !file} className="w-full md:w-auto">
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {list.map((p) => <ProofThumb key={p.id} item={p} signed={signed} />)}
          {list.length === 0 && <div className="text-sm text-dim">No proofs yet.</div>}
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
      <div className="flex items-center gap-2">
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
        <label htmlFor={id} className="text-xs text-dim truncate max-w-[18rem]">
          {file?.name ?? 'No file selected'}
        </label>
      </div>
    </div>
  );
}

function ProofThumb({ item, signed }: { item: Proof; signed: (p: string) => Promise<string> }) {
  const [url, setUrl] = useState<string>('#');
  useEffect(() => { signed(item.file_path).then(setUrl); /* eslint-disable-next-line */ }, [item.file_path]);

  return (
    <a href={url} target="_blank" rel="noreferrer" className="block rounded border overflow-hidden bg-black/20">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={item.file_path} className="aspect-square object-cover w-full" />
      {item.note && <div className="px-2 py-1 text-xs text-dim break-words">{item.note}</div>}
    </a>
  );
}
