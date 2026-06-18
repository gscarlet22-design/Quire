import { XMLParser } from 'fast-xml-parser';
import type { SourceAdapter, CatalogEntry } from '@/lib/types';

const BASE = 'https://www.gutenberg.org';
const SEARCH_URL = `${BASE}/ebooks/search.opds/`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) => ['entry', 'link'].includes(name),
});

interface OpdsLink {
  '@_rel'?: string;
  '@_href'?: string;
  '@_type'?: string;
}

interface OpdsEntry {
  id?: string;
  title?: string;
  author?: { name?: string } | { name?: string }[] | string;
  link?: OpdsLink[];
}

function pickLink(links: OpdsLink[] = [], rel: string): string {
  const found = links.find((l) => l['@_rel']?.startsWith(rel));
  return found?.['@_href'] ?? '';
}

function pickType(links: OpdsLink[] = [], type: string): string {
  const found = links.find((l) => l['@_type'] === type);
  return found?.['@_href'] ?? '';
}

function authorName(raw: OpdsEntry['author']): string {
  if (!raw) return 'Unknown';
  const name =
    typeof raw === 'string'
      ? raw
      : Array.isArray(raw)
        ? (raw[0]?.name ?? 'Unknown')
        : (raw.name ?? 'Unknown');
  const parts = name.split(', ');
  return parts.length === 2 ? `${parts[1]} ${parts[0]}` : name;
}

async function fetchFeed(url: string): Promise<CatalogEntry[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const data = parser.parse(xml);
    const entries: OpdsEntry[] = data?.feed?.entry ?? [];
    return entries.map((e): CatalogEntry => {
      const links = e.link ?? [];
      const coverUrl =
        pickLink(links, 'http://opds-spec.org/image/thumbnail') ||
        pickLink(links, 'http://opds-spec.org/image') ||
        pickType(links, 'image/jpeg') ||
        undefined;
      const epubUrl =
        pickLink(links, 'http://opds-spec.org/acquisition') ||
        pickType(links, 'application/epub+zip') ||
        '';
      return {
        sourceId: 'gutenberg',
        externalId: e.id ?? '',
        title: e.title ?? 'Untitled',
        author: authorName(e.author),
        coverUrl: coverUrl || undefined,
        acquire: { kind: 'url', url: epubUrl },
      };
    });
  } catch {
    return [];
  }
}

export const gutenbergAdapter: SourceAdapter = {
  id: 'gutenberg',
  name: 'Project Gutenberg',

  async search(query, page = 1) {
    const start = (page - 1) * 25 + 1;
    return fetchFeed(`${SEARCH_URL}?query=${encodeURIComponent(query)}&start_index=${start}`);
  },

  async browse() {
    return fetchFeed(`${SEARCH_URL}?sort_order=downloads`);
  },

  async browseSections() {
    const [top, scifi, fantasy] = await Promise.all([
      fetchFeed(`${SEARCH_URL}?sort_order=downloads`),
      fetchFeed(`${SEARCH_URL}?query=subject%3A%22Science+Fiction%22&sort_order=downloads`),
      fetchFeed(`${SEARCH_URL}?query=subject%3AFantasy&sort_order=downloads`),
    ]);
    return [
      { id: 'gutenberg-top', title: 'Most Downloaded on Project Gutenberg', entries: top.slice(0, 8) },
      { id: 'gutenberg-scifi', title: 'Sci-Fi on Project Gutenberg', entries: scifi.slice(0, 8) },
      { id: 'gutenberg-fantasy', title: 'Fantasy on Project Gutenberg', entries: fantasy.slice(0, 8) },
    ];
  },
};
