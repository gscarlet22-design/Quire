'use client';

import { useState } from 'react';
import { removeFromShelf } from '@/lib/actions';

const TARGET_LABELS: Record<string, string> = { x4: 'X4', kindle: 'Kindle', nook: 'Nook' };
const ALL_TARGETS = ['x4', 'kindle', 'nook'];

interface Props {
  item: {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    sources: { allowed_targets: string[] } | null;
  };
}

export function ShelfItem({ item }: Props) {
  const [removed, setRemoved] = useState(false);
  const [loading, setLoading] = useState(false);
  const allowed = item.sources?.allowed_targets ?? ALL_TARGETS;

  async function handleRemove() {
    setLoading(true);
    await removeFromShelf(item.id);
    setRemoved(true);
  }

  if (removed) return null;

  return (
    <div className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
        {item.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.cover_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">No cover</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{item.title}</h3>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{item.author}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {ALL_TARGETS.map((t) => (
              <span
                key={t}
                className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                  allowed.includes(t)
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800'
                }`}
              >
                {TARGET_LABELS[t]}
              </span>
            ))}
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-xs text-zinc-400 hover:text-red-500 disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
