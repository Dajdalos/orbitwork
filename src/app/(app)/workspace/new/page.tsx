import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { CreateWorkspaceForm } from '@/components/create-workspace-form';

export const dynamic = 'force-dynamic';

export default async function NewWorkspacePage() {
  const supa = await createServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-dvh bg-[#0b0b0f] text-[#e6e6ea]">
      <div className="max-w-2xl mx-auto px-6 py-14">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Create a workspace</h1>
          <p className="text-sm text-dim mt-1">You’ll be the owner. Invite members and set roles later.</p>
        </div>
        <div className="bg-panel rounded-xl border">
          <CreateWorkspaceForm />
        </div>
        <p className="text-xs text-dim mt-4">You can delete workspaces anytime.</p>
      </div>
    </div>
  );
}
