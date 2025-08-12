// src/app/settings/profile/page.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import ProfileForm from '@/components/profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfileSettingsPage() {
  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supa
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h1 className="text-xl font-semibold">Profile</h1>
      <p className="text-sm text-dim mt-1">Update your name and avatar.</p>
      <div className="mt-6">
        <ProfileForm initialName={profile?.full_name ?? ''} initialAvatar={profile?.avatar_url ?? ''} />
      </div>
    </main>
  );
}
