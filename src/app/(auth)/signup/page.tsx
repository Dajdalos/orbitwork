'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SignupPage() {
  const r = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setOkMsg(null); setLoading(true);
    const supa = createBrowserClient();
    const { data, error } = await supa.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/workspace/new` },
    });
    setLoading(false);
    if (error) { setErr(error.message); return; }

    // If your project requires email confirmation, there won't be a session:
    if (!data.session) {
      setOkMsg('Check your inbox to confirm your email, then log in.');
      return;
    }
    // Otherwise you’re signed in now:
    r.push('/workspace/new');
  }

  return (
    <div className="max-w-sm mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Sign up</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Input type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
        <Input type="password" placeholder="Choose a strong password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
        {err && <div className="text-sm text-red-600">{err}</div>}
        {okMsg && <div className="text-sm text-green-700">{okMsg}</div>}
      </form>
      <div className="text-sm">
        Already have an account? <a className="underline" href="/login">Log in</a>
      </div>
    </div>
  );
}
