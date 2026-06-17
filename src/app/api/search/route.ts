import { NextRequest, NextResponse } from 'next/server';
import { adapters } from '@/lib/adapters';
import type { CatalogEntry } from '@/lib/types';

function dedupeKey(e: CatalogEntry): string {
  return `${e.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${e.author.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q')?.trim();
  if (!query) return NextResponse.json([]);

  const results = await Promise.all(adapters.map((a) => a.search(query)));
  const merged = results.flat();

  const seen = new Set<string>();
  const deduped = merged.filter((e) => {
    const key = dedupeKey(e);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json(deduped);
}
