'use client';
import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createWorkspaceAction } from '@/actions/workspace';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/submit-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const initial = { ok: false } as any;

export function CreateWorkspaceForm() {
  const [state, formAction] = useActionState(createWorkspaceAction, initial);
  const router = useRouter();

  useEffect(() => {
    if (state?.ok && state.id) router.push(`/workspace/${state.id}`);
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace details</CardTitle>
        <CardDescription>Give it a name — you can change it anytime.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="e.g., Nova Studio" required />
          </div>
          <div className="flex items-center gap-2">
            <input id="initialTab" name="initialTab" type="checkbox" className="size-4" defaultChecked />
            <Label htmlFor="initialTab">Create a tab for the current month</Label>
          </div>
          <SubmitButton className="rounded-md bg-black text-white px-4 py-2 text-sm font-medium hover:bg-black/90 transition">
            Create workspace
          </SubmitButton>
          {state?.error && <div className="text-sm text-red-600">{state.error}</div>}
        </form>
      </CardContent>
    </Card>
  );
}
