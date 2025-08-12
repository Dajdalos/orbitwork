'use client';
import { createBrowserClient } from '@/lib/supabase';

export default function SignOutButton(){
  const supa = createBrowserClient();
  return (
    <button className="border rounded px-3 py-2" onClick={async ()=>{
      await supa.auth.signOut();
      window.location.href = '/login';
    }}>Sign out</button>
  );
}