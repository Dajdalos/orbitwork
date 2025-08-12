// src/components/profile-form.tsx
'use client';

import { useMemo, useRef, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfileForm({
  initialName,
  initialAvatar,
}: {
  initialName: string;
  initialAvatar: string;
}) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatar);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save() {
    setBusy(true);
    const { data: u } = await supa.auth.getUser();
    const userId = u.user?.id!;
    // Update name
    const { error: perr } = await supa.from('profiles').update({ full_name: name }).eq('id', userId);
    if (perr) { alert(perr.message); setBusy(false); return; }
    setBusy(false);
  }

  async function pickAvatar(file: File) {
    setBusy(true);
    const { data: u } = await supa.auth.getUser();
    const userId = u.user?.id!;
    const ext = file.name.split('.').pop() || 'png';
    const path = `${userId}.${ext}`;

    // upsert avatar
    const up = await supa.storage.from('avatars').upload(path, file, { upsert: true });
    if (up.error) { alert(up.error.message); setBusy(false); return; }

    // public URL
    const { data: pub } = supa.storage.from('avatars').getPublicUrl(path);
    const url = pub.publicUrl;

    const { error: perr } = await supa.from('profiles').update({ avatar_url: url }).eq('id', userId);
    if (perr) { alert(perr.message); setBusy(false); return; }

    setAvatarUrl(url);
    setBusy(false);
  }

  return (
    <div className="bg-panel border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarImage src={avatarUrl} alt={name || 'Avatar'} />
          <AvatarFallback>{initials(name || 'User')}</AvatarFallback>
        </Avatar>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => {
            const f = e.target.files?.[0]; if (f) pickAvatar(f);
          }} />
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? 'Uploading…' : 'Change avatar'}
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-2">
        <Input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
        />
        <Button onClick={save} disabled={busy || !name.trim()}>
          Save
        </Button>
      </div>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}
