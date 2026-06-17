'use client';

import { useState, FormEvent } from 'react';
import type { CatalogEntry } from '@/lib/types';
import { ResultCard } from './ResultCard';

type State = 'idle' | 'loading' | 'done' | 'error';

export function SearchInterface() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogEntry[]>([]);
  const [state, setState] = useState<State>('idle');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setState('loading');
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error('Search failed');
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

      {results.length > 0 && (
        <div className="mt-4 flex flex-col gap-3">
          {results.map((entry) => (
            <ResultCard key={`${entry.sourceId}:${entry.externalId}`} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
