// src/components/cards/A1DocsCard.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select';
import { format } from 'date-fns';

type A1Doc = {
  id: string;
  file_path: string;
  note: string | null;
  created_at: string;
  uploaded_by: string;
  expires_on: string | null; // YYYY-MM-DD
  country: string | null;    // 2-letter code
};

export default function A1DocsCard({ wsId, tabId }: { wsId: string; tabId: string }) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [list, setList] = useState<A1Doc[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [dateVal, setDateVal] = useState<Date | undefined>(undefined);
  const [country, setCountry] = useState<string>(''); // code only
  const [busy, setBusy] = useState(false);

  async function fetchList() {
    const { data, error } = await supa
      .from('a1_docs')
      .select('id,file_path,note,created_at,uploaded_by,expires_on,country')
      .eq('tab_id', tabId)
      .order('created_at', { ascending: false });
    if (!error) setList((data ?? []) as any);
  }

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [tabId]);

  async function upload() {
    if (!file) return;
    setBusy(true);
    const { data: u } = await supa.auth.getUser();
    const userId = u.user?.id!;
    const path = `${wsId}/${tabId}/${userId}/${Date.now()}-${file.name}`;

    const up = await supa.storage.from('a1docs').upload(path, file);
    if (up.error) { alert(up.error.message); setBusy(false); return; }

    const payload: any = {
      workspace_id: wsId,
      tab_id: tabId,
      uploaded_by: userId,
      file_path: path,
      note: note || null,
    };
    if (dateVal) payload.expires_on = toYMD(dateVal);
    if (country) payload.country = country;

    const ins = await supa.from('a1_docs').insert(payload);
    if (ins.error) { alert(ins.error.message); setBusy(false); return; }

    setFile(null); setNote(''); setDateVal(undefined); setCountry('');
    await fetchList(); setBusy(false);
  }

  async function signed(path: string) {
    const { data } = await supa.storage.from('a1docs').createSignedUrl(path, 120);
    return data?.signedUrl ?? '#';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>A1 Documents</CardTitle>
        <CardDescription>Upload official A1 forms and track expiry.</CardDescription>
      </CardHeader>

      {/* allow overlays to escape; also enables Select/Calendar to show above */}
      <CardContent className="space-y-4 overflow-visible">
        {/* ↑ increased grid gap from gap-3 -> gap-4 to give a little more space between File and Expiration */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* File */}
          <div className="min-w-0">
            <FieldLabel>File</FieldLabel>
            <FilePicker id="a1-file" label="Choose file" accept=".pdf,image/*" file={file} onPick={setFile} />
          </div>

          {/* Expiration (centered text) */}
          <div className="min-w-0">
            <FieldLabel>Expiration date</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  // centered content; keep truncate to avoid overflow
                  className="w-full h-10 justify-center text-center truncate tabular-nums"
                  title={dateVal ? format(dateVal, 'yyyy-MM-dd') : 'Pick a date'}
                >
                  {dateVal ? format(dateVal, 'yyyy-MM-dd') : <span className="text-dim">Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                side="bottom"
                sideOffset={8}
                className="w-auto p-0 z-[120] bg-[#0f1014] border border-white/10 text-white shadow-lg"
              >
                <Calendar mode="single" selected={dateVal} onSelect={setDateVal} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          {/* Country (code only + truncate) */}
          <div className="min-w-0">
            <FieldLabel>Country</FieldLabel>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-10 w-full truncate">
                <SelectValue placeholder="Code (e.g., ES)" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                side="bottom"
                sideOffset={8}
                collisionPadding={12}
                className="z-[120] bg-[#0f1014] text-white border border-white/10 shadow-lg max-h-64 overflow-auto"
              >
                {EU_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code} title={c.name}>
                    {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Note (full width) */}
          <div className="md:col-span-2 lg:col-span-3">
            <FieldLabel>Note</FieldLabel>
            <Textarea
              placeholder="Add an optional note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-24 resize-y"
            />
          </div>

          {/* Upload */}
          <div className="md:col-span-2 lg:col-span-3 flex justify-end">
            <Button onClick={upload} disabled={busy || !file} className="w-full sm:w-auto">
              {busy ? 'Uploading…' : 'Upload'}
            </Button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2">
          {list.map((d) => (
            <A1Row key={d.id} item={d} onLink={signed} />
          ))}
          {list.length === 0 && <div className="text-sm text-dim">No A1 documents yet.</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <div className="block text-xs text-dim mb-1">{children}</div>;
}

function FilePicker({
  id, label, accept, file, onPick,
}: { id: string; label: string; accept?: string; file: File | null; onPick: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <Button type="button" variant="outline" className="h-10 flex-shrink-0" onClick={() => ref.current?.click()}>
          {label}
        </Button>
        <input ref={ref} id={id} type="file" accept={accept} className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
        <label htmlFor={id} className="text-xs text-dim truncate flex-1 min-w-0 max-w-full"
          title={file?.name ?? 'No file selected'}>
          {file?.name ?? 'No file selected'}
        </label>
      </div>
    </div>
  );
}

function A1Row({ item, onLink }: { item: A1Doc; onLink: (p: string) => Promise<string> }) {
  const [url, setUrl] = useState<string>('#');
  useEffect(() => { onLink(item.file_path).then(setUrl); /* eslint-disable-next-line */ }, [item.file_path]);

  const name = item.file_path.split('/').at(-1);
  const status = computeStatus(item.expires_on);

  return (
    <div className="flex items-start justify-between gap-3 rounded border px-3 py-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <a href={url} target="_blank" rel="noreferrer" className="underline underline-offset-2 break-all">
            {name}
          </a>
          {status.badge}
        </div>
        <div className="text-xs text-dim mt-1 flex flex-wrap gap-x-3 gap-y-1">
          {item.country && <span>Country: {item.country}</span>}
          {item.expires_on && <span>Expires: {fmtDate(item.expires_on)}</span>}
          <span>Uploaded: {new Date(item.created_at).toLocaleString()}</span>
        </div>
        {item.note && <div className="text-sm break-words whitespace-pre-wrap mt-1">{item.note}</div>}
      </div>
    </div>
  );
}

function computeStatus(expiresISO: string | null) {
  if (!expiresISO) return { badge: <Badge variant="secondary">no expiry</Badge> };
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(expiresISO + 'T00:00:00');
  const diff = d.getTime() - today.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { badge: <Badge className="bg-rose-900/50 text-rose-100 border-rose-800">expired</Badge> };
  if (days <= 30) return { badge: <Badge className="bg-amber-900/50 text-amber-100 border-amber-800">expiring soon</Badge> };
  return { badge: <Badge className="bg-emerald-900/50 text-emerald-100 border-emerald-800">valid</Badge> };
}

function fmtDate(iso: string) {
  try { return new Date(iso + 'T00:00:00').toLocaleDateString(); } catch { return iso; }
}
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const EU_COUNTRIES = [
  { code: 'AT', name: 'Austria' }, { code: 'BE', name: 'Belgium' },
  { code: 'BG', name: 'Bulgaria' }, { code: 'HR', name: 'Croatia' },
  { code: 'CY', name: 'Cyprus' },   { code: 'CZ', name: 'Czechia' },
  { code: 'DK', name: 'Denmark' },  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },  { code: 'FR', name: 'France' },
  { code: 'DE', name: 'Germany' },  { code: 'GR', name: 'Greece' },
  { code: 'HU', name: 'Hungary' },  { code: 'IE', name: 'Ireland' },
  { code: 'IT', name: 'Italy' },    { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },{ code: 'LU', name: 'Luxembourg' },
  { code: 'MT', name: 'Malta' },    { code: 'NL', name: 'Netherlands' },
  { code: 'PL', name: 'Poland' },   { code: 'PT', name: 'Portugal' },
  { code: 'RO', name: 'Romania' },  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' }, { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },   { code: 'NO', name: 'Norway' },
  { code: 'IS', name: 'Iceland' },  { code: 'LI', name: 'Liechtenstein' },
  { code: 'CH', name: 'Switzerland' },
];
