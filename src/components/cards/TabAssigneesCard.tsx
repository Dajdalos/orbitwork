'use client';

import { useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

type MemberRow = { user_id: string; role: 'owner' | 'manager' | 'member' };
type ProfileRow = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };
type Person = { id: string; name: string; avatar?: string; role: 'owner'|'manager'|'member' };

export default function TabAssigneesCard({
  wsId,
  tabId,
  canEdit,
}: {
  wsId: string;
  tabId: string;
  canEdit: boolean; // pass (myRole !== 'member') from the page
}) {
  const supa = useMemo(() => createBrowserClient(), []);
  const [available, setAvailable] = useState<Person[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    // 1) Who belongs to the workspace?
    const { data: wmRows, error: wmErr } = await supa
      .from('workspace_members')
      .select('user_id, role')
      .eq('workspace_id', wsId);
    if (wmErr) {
      // Owner-only RLS means non-owners may see nothing; that's okay.
      setAvailable([]);
      setAssignedIds(new Set());
      return;
    }
    const members = (wmRows ?? []) as MemberRow[];
    const ids = members.map((m) => m.user_id);
    // 2) Profiles for those users
    let profiles: ProfileRow[] = [];
    if (ids.length > 0) {
      const { data: profs } = await supa
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', ids);
      profiles = (profs ?? []) as ProfileRow[];
    }
    const byId = new Map(profiles.map((p) => [p.id, p]));
    const avail: Person[] = members.map((m) => {
      const p = byId.get(m.user_id);
      return {
        id: m.user_id,
        name: p?.full_name || p?.email || shortId(m.user_id),
        avatar: p?.avatar_url || undefined,
        role: (m.role as Person['role']) ?? 'member',
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
    setAvailable(avail);

    // 3) Who is assigned to this tab?
    const { data: tmRows } = await supa
      .from('tab_members')
      .select('user_id')
      .eq('tab_id', tabId);
    const assigned = new Set((tmRows ?? []).map((r: any) => String(r.user_id)));
    setAssignedIds(assigned);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsId, tabId]);

  async function toggle(userId: string, shouldAssign: boolean) {
    if (!canEdit) return;
    setBusy(userId);
    if (shouldAssign) {
      const { error } = await supa
        .from('tab_members')
        .insert({ workspace_id: wsId, tab_id: tabId, user_id: userId });
      if (!error) {
        const next = new Set(assignedIds);
        next.add(userId);
        setAssignedIds(next);
      }
    } else {
      const { error } = await supa
        .from('tab_members')
        .delete()
        .eq('tab_id', tabId)
        .eq('user_id', userId);
      if (!error) {
        const next = new Set(assignedIds);
        next.delete(userId);
        setAssignedIds(next);
      }
    }
    setBusy(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab visibility</CardTitle>
        <CardDescription>Choose who in this workspace can access this tab.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {available.length === 0 && (
            <div className="text-sm text-dim">No members to show.</div>
          )}

          {available.map((p) => {
            const isAssigned = assignedIds.has(p.id);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded border px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={p.avatar ?? ''} alt={p.name} />
                    <AvatarFallback>{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate">{p.name}</div>
                    <div className="text-xs text-dim">{p.role}</div>
                  </div>
                </div>

                {canEdit ? (
                  isAssigned ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      disabled={busy === p.id}
                      onClick={() => toggle(p.id, false)}
                    >
                      Remove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={busy === p.id}
                      onClick={() => toggle(p.id, true)}
                    >
                      Add
                    </Button>
                  )
                ) : (
                  <div className="text-xs text-dim">{isAssigned ? 'Has access' : 'No access'}</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function initials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}

function shortId(id: string) {
  return id.length > 10 ? `${id.slice(0, 4)}…${id.slice(-4)}` : id;
}
