// src/components/app-shell.tsx
import type { ReactNode } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function AppShell({
  sidebar,
  children,
}: {
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#0b0b0f] text-[#e6e6ea]">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <main className="min-w-0">{children}</main>
          {sidebar ? <aside className="min-w-0">{sidebar}</aside> : null}
        </div>
      </div>
    </div>
  );
}

type MemberRole = 'owner' | 'manager' | 'member';
type Member = { id: string; role: MemberRole; name: string; avatar?: string };

export function RightSidebar({
  members,
  children,
}: {
  members: Member[];
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-5rem)] lg:overflow-auto">
      {/* Members */}
      <div className="bg-panel border rounded-xl p-4">
        <div className="font-medium mb-3">Members</div>
        <div className="space-y-2 max-h-64 overflow-auto pr-1">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={m.avatar ?? ''} alt={m.name} />
                  <AvatarFallback>{initials(m.name)}</AvatarFallback>
                </Avatar>
                <span className="truncate">{m.name}</span>
              </div>
              <div className="text-xs text-dim flex-shrink-0">{m.role}</div>
            </div>
          ))}
          {members.length === 0 && (
            <div className="text-sm text-dim">No members yet.</div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}

function initials(name?: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? 'U').toUpperCase() + (parts[1]?.[0] ?? '').toUpperCase();
}
