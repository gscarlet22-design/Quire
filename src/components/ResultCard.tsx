import type { CatalogEntry } from '@/lib/types';
import Image from 'next/image';

const SOURCE_LABELS: Record<string, string> = {
  'standard-ebooks': 'Standard Ebooks',
  gutendex: 'Project Gutenberg',
};

export function ResultCard({ entry }: { entry: CatalogEntry }) {
  return (
    <div className="flex gap-3 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
        {entry.coverUrl ? (
          <Image
            src={entry.coverUrl}
            alt={`Cover of ${entry.title}`}
            fill
            className="object-cover"
            sizes="64px"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-400">
            No cover
          </div>
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
            disabled
            className="rounded bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white disabled:opacity-40 dark:bg-white dark:text-zinc-900"
          >
            Add to shelf
          </button>
        </div>
      </div>
    </div>
  );
}
