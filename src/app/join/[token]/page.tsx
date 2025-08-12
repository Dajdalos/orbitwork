// app/join/[token]/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export default function JoinPage({ params }: { params: { token: string } }) {
  const supa = useMemo(() => createBrowserClient(), []);
  const router = useRouter();
  const [status, setStatus] = useState<'idle'|'checking'|'need-auth'|'ok'|'error'>('idle');
  const [msg, setMsg] = useState<string>('Preparing…');

  useEffect(() => {
    (async () => {
      setStatus('checking'); setMsg('Checking invite…');

      const { data: sess } = await supa.auth.getSession();
      if (!sess.session) { setStatus('need-auth'); setMsg('Please sign in to continue.'); return; }

      const { data, error } = await supa.rpc('accept_invite', { p_token: params.token });
      if (error) { setStatus('error'); setMsg(error.message); return; }

      setStatus('ok'); setMsg('Joined! Redirecting…');
      const wsId = data as string;
      router.replace(`/${wsId}/dashboard`);
    })();
  }, [params.token, router, supa]);

  async function signIn() {
    // redirect to your sign-in page (adjust route)
    router.push('/login?next=' + encodeURIComponent(`/join/${params.token}`));
  }

  return (
    <div className="max-w-md mx-auto py-12 space-y-4 text-center">
      <h1 className="text-xl font-semibold">Join workspace</h1>
      <div className="text-sm text-muted-foreground">{msg}</div>
      {status === 'need-auth' && (
        <Button onClick={signIn}>Sign in</Button>
      )}
      {status === 'error' && (
        <Button variant="outline" onClick={() => location.reload()}>Try again</Button>
      )}
    </div>
  );
}
