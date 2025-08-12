import { createBrowserClient } from '@/lib/supabase';

export async function uploadToBucket(bucket: 'invoices'|'proofs', tabId: string, file: File) {
  const supa = createBrowserClient();
  const key = `${tabId}/${crypto.randomUUID()}_${file.name}`;
  const { error } = await supa.storage.from(bucket).upload(key, file, { upsert: false });
  if (error) throw error;
  return key;
}