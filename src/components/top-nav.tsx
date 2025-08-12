// src/components/top-nav.tsx
import Link from 'next/link';
import { createServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default async function TopNav() {
  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();

  async function signOut() {
    'use server';
    const supa = await createServerClient();
    await supa.auth.signOut();
  }

  let displayName = 'Profile';
  let avatarUrl = '';
  if (user) {
    const { data: prof } = await supa
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    displayName = prof?.full_name || user.email || 'Profile';
    avatarUrl = prof?.avatar_url || '';
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b0b0f]/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-12 flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-semibold">OrbitWork</Link>
          <nav className="hidden sm:flex items-center gap-3 text-dim">
            <Link href="/workspaces" className="hover:text-white">Workspaces</Link>
            <Link href="/workspace/new" className="hover:text-white">Create</Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/settings/profile"
                className="flex items-center gap-2 rounded-md border border-white/15 px-2 py-1 hover:bg-white/10"
                title="Profile"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={avatarUrl} alt={displayName} />
                  <AvatarFallback>{initials(displayName)}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline truncate max-w-[12rem]">{displayName}</span>
                <span className="sm:hidden">Profile</span>
              </Link>

              <form action={signOut}>
                <Button type="submit" variant="outline" className="h-8">Sign out</Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="outline" className="h-8">Log in</Button></Link>
              <Link href="/signup"><Button className="h-8">Sign up</Button></Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function initials(name: string) {
  const p = (name || 'User').trim().split(/\s+/);
  return (p[0]?.[0] ?? 'U').toUpperCase() + (p[1]?.[0] ?? '').toUpperCase();
}
