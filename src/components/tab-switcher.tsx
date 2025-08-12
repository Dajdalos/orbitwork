// src/components/tab-switcher.tsx
import Link from 'next/link';
import { deleteTabAction } from '@/actions/tabs';

export function TabSwitcher({
  wsId,
  tabs,
  activeId,
  canDelete = false, // pass true if user is owner
}: {
  wsId: string;
  tabs: { id: string; label: string }[];
  activeId?: string;
  canDelete?: boolean;
}) {
  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const isActive = t.id === activeId;
        const chipBase =
          'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition pr-2';
        const chipActive = 'bg-white text-black border-white';
        const chipIdle = 'bg-transparent text-white/90 border-white/20 hover:bg-white/10';

        return (
          <div key={t.id} className="flex items-center gap-1">
            <Link
              href={`/workspace/${wsId}?tab=${t.id}`}
              className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
              title={t.label}
            >
              <span className="truncate max-w-[10rem]">{t.label}</span>
            </Link>

            {canDelete && (
              <form action={deleteTabAction.bind(null, wsId, t.id)}>
                <button
                  type="submit"
                  title="Delete tab"
                  className="inline-flex h-7 w-7 items-center justify-center rounded border border-white/20 text-white/70 hover:text-white hover:bg-red-900/30 hover:border-red-700 transition"
                >
                  {/* small "x" icon */}
                  <svg viewBox="0 0 20 20" width="12" height="12" aria-hidden>
                    <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="sr-only">Delete tab</span>
                </button>
              </form>
            )}
          </div>
        );
      })}
    </div>
  );
}
