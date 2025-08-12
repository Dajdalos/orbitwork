'use client';
import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

export function SubmitButton({
  children,
  className,
}: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium disabled:opacity-60',
        className
      )}
    >
      {pending ? 'Creating…' : children}
    </button>
  );
}
