import type { SourceAdapter, CatalogEntry } from '@/lib/types';

const BASE = 'https://gutendex.com';

interface GutendexBook {
  id: number;
  title: string;
  authors: { name: string }[];
  languages: string[];
  formats: Record<string, string>;
}

function formatAuthor(name: string): string {
  // Gutendex returns "Last, First" — normalize to "First Last"
  const parts = name.split(', ');
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}

export const gutendexAdapter: SourceAdapter = {
  id: 'gutendex',
  name: 'Project Gutenberg',

  async search(query, page = 1): Promise<CatalogEntry[]> {
    const url = `${BASE}/books/?search=${encodeURIComponent(query)}&page=${page}`;
    try {
      const res = await fetch(url, { next: { revalidate: 300 } });
      if (!res.ok) return [];
      const data = await res.json();
      const books: GutendexBook[] = data.results ?? [];

      return books.map((b): CatalogEntry => {
        const epubUrl = b.formats['application/epub+zip'] ?? '';
        const coverUrl = b.formats['image/jpeg'] ?? undefined;
        const author = b.authors[0] ? formatAuthor(b.authors[0].name) : 'Unknown';
        return {
          sourceId: 'gutendex',
          externalId: String(b.id),
          title: b.title,
          author,
          language: b.languages[0],
          coverUrl,
          acquire: { kind: 'url', url: epubUrl },
        };
      });
    } catch {
      return [];
    }
  },
};
