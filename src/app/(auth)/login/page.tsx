'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const supa = createBrowserClient();
    const { error } = await supa.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setErr(error.message); return; }
    r.push('/workspace/new'); // go straight to create page
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Log in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <Input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Logging in…' : 'Log in'}</Button>
        {err && <div className="text-sm text-red-600">{err}</div>}
      </form>
      <div className="text-sm">
        No account? <a className="underline" href="/signup">Sign up</a>
      </div>
    </div>
  );
}
