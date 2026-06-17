import { NextResponse } from 'next/server';
import { adapters } from '@/lib/adapters';
import type { BrowseSection } from '@/lib/types';

const BROWSE_LABELS: Record<string, string> = {
  'standard-ebooks': 'New from Standard Ebooks',
  gutenberg: 'Most Downloaded on Project Gutenberg',
};

export async function GET() {
  const sections = await Promise.all(
    adapters
      .filter((a) => a.browse)
      .map(async (a): Promise<BrowseSection> => ({
        id: a.id,
        title: BROWSE_LABELS[a.id] ?? a.name,
        entries: (await a.browse!()).slice(0, 8),
      }))
  );
  return NextResponse.json(sections);
}
