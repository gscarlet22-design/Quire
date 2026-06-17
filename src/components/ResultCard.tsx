'use client';

import { useState } from 'react';
import type { CatalogEntry } from '@/lib/types';
import { addToShelf } from '@/lib/actions';

const SOURCE_LABELS: Record<string, string> = {
  'standard-ebooks': 'Standard Ebooks',
  gutenberg: 'Project Gutenberg',
};

type AddState = 'idle' | 'loading' | 'done' | 'error';

export function ResultCard({ entry }: { entry: CatalogEntry }) {
  const [state, setState] = useState<AddState>('idle');

  async function handleAdd() {
    setState('loading');
    const result = await addToShelf(entry);
    setState(result.error ? 'error' : 'done');
  }

  return (
    <div className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
        {entry.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={entry.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">No cover</div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{entry.title}</h3>
          <p className="mt-0.5 truncate text-xs text-zinc-500">{entry.author}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
            {SOURCE_LABELS[entry.sourceId] ?? entry.sourceId}
          </span>
          <button
            onClick={handleAdd}
            disabled={state === 'loading' || state === 'done'}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
              state === 'done'
                ? 'bg-green-600 text-white'
                : state === 'error'
                  ? 'bg-red-500 text-white'
                  : 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
            }`}
          >
            {state === 'loading' ? 'Adding…' : state === 'done' ? 'Added ✓' : state === 'error' ? 'Error' : 'Add to shelf'}
          </button>
        </div>
      </div>
    </div>
  );
}
