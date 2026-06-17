'use client';

import { useState, FormEvent, useEffect } from 'react';
import type { BrowseSection, CatalogEntry } from '@/lib/types';
import { ResultCard } from './ResultCard';

type State = 'idle' | 'loading' | 'done' | 'error';

export function SearchInterface() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogEntry[]>([]);
  const [state, setState] = useState<State>('idle');
  const [browse, setBrowse] = useState<BrowseSection[]>([]);

  useEffect(() => {
    fetch('/api/browse')
      .then((r) => r.json())
      .then(setBrowse)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setState('loading');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error();
      setResults(await res.json());
      setState('done');
    } catch {
      setState('error');
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books by title or author…"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:ring-zinc-800"
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
        >
          {state === 'loading' ? 'Searching…' : 'Search'}
        </button>
      </form>

      {state === 'error' && (
        <p className="mt-4 text-center text-sm text-red-500">Something went wrong. Try again.</p>
      )}

      {state === 'done' && results.length === 0 && (
        <p className="mt-4 text-center text-sm text-zinc-500">No results found.</p>
      )}

      {state === 'done' && results.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {results.map((entry) => (
            <ResultCard key={`${entry.sourceId}:${entry.externalId}`} entry={entry} />
          ))}
        </div>
      )}

      {state === 'idle' && browse.length > 0 && (
        <div className="mt-8 flex flex-col gap-8">
          {browse.map((section) => (
            <div key={section.id}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {section.title}
              </h2>
              <div className="flex flex-col gap-3">
                {section.entries.map((entry) => (
                  <ResultCard key={`${entry.sourceId}:${entry.externalId}`} entry={entry} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
