import { NextResponse } from 'next/server';
import { adapters } from '@/lib/adapters';
import type { BrowseSection } from '@/lib/types';

const BROWSE_LABELS: Record<string, string> = {
  'standard-ebooks': 'New from Standard Ebooks',
  gutenberg: 'Most Downloaded on Project Gutenberg',
};

export async function GET(req: Request) {
  const sourcesParam = new URL(req.url).searchParams.get('sources');
  const allowed = sourcesParam ? new Set(sourcesParam.split(',')) : null;
  const active = adapters.filter((a) => a.browse && (!allowed || allowed.has(a.id)));

  const sections = await Promise.all(
    active.map(async (a): Promise<BrowseSection> => ({
      id: a.id,
      title: BROWSE_LABELS[a.id] ?? a.name,
      entries: (await a.browse!()).slice(0, 8),
    }))
  );
  return NextResponse.json(sections);
}
