// src/components/InviteButton.tsx
'use client';

import { useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

function genToken(bytes = 24) {
  const a = new Uint8Array(bytes); crypto.getRandomValues(a);
  return btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}

export default function InviteButton({ wsId }: { wsId: string }) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<'manager' | 'member'>('member');
  const [days, setDays] = useState(7);
  const [link, setLink] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createInvite() {
    setBusy(true);
    const token = genToken();
    const expires_at = new Date(Date.now() + days * 86400000).toISOString();
    const { data: me } = await supa.auth.getUser();
    const created_by = me.user?.id;

    const { error } = await supa.from('invites').insert({
      token, workspace_id: wsId, role, created_by, expires_at
    });
    if (error) { alert(error.message); setBusy(false); return; }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setLink(`${origin}/join/${token}`);
    setBusy(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button>Invite</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite to workspace</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Expires (days)</Label>
              <Input type="number" className="mt-1" min={1} max={90}
                     value={days} onChange={e => setDays(parseInt(e.target.value || '7', 10))}/>
            </div>
          </div>

          {!link ? (
            <Button onClick={createInvite} disabled={busy}>{busy ? 'Creating…' : 'Create invite'}</Button>
          ) : (
            <div className="space-y-2">
              <Label>Invite link</Label>
              <div className="flex gap-2">
                <Input readOnly value={link} />
                <Button type="button" onClick={() => navigator.clipboard.writeText(link!)}>Copy</Button>
              </div>
              <div className="text-xs text-muted-foreground">Share this link with the person you’re inviting.</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
