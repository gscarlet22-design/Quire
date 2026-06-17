import { XMLParser } from 'fast-xml-parser';
import type { SourceAdapter, CatalogEntry } from '@/lib/types';

const BASE = 'https://standardebooks.org';
const SEARCH_URL = `${BASE}/feeds/opds/all`;

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
  author?: { name?: string } | { name?: string }[];
  'dc:language'?: string;
  link?: OpdsLink[];
}

function pickLink(links: OpdsLink[] = [], rel: string): string {
  const found = links.find((l) => l['@_rel'] === rel);
  return found?.['@_href'] ?? '';
}

function authorName(raw: OpdsEntry['author']): string {
  if (!raw) return 'Unknown';
  const obj = Array.isArray(raw) ? raw[0] : raw;
  return obj?.name ?? 'Unknown';
}

export const standardEbooksAdapter: SourceAdapter = {
  id: 'standard-ebooks',
  name: 'Standard Ebooks',

  async search(query, page = 1): Promise<CatalogEntry[]> {
    const url = `${SEARCH_URL}?query=${encodeURIComponent(query)}&page=${page}`;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
        next: { revalidate: 300 },
      });
      if (!res.ok) return [];
      const xml = await res.text();
      const data = parser.parse(xml);
      const entries: OpdsEntry[] = data?.feed?.entry ?? [];

      return entries.map((e): CatalogEntry => {
        const links = e.link ?? [];
        const coverHref = pickLink(links, 'http://opds-spec.org/image');
        const acquireHref = pickLink(links, 'http://opds-spec.org/acquisition');
        return {
          sourceId: 'standard-ebooks',
          externalId: e.id ?? '',
          title: e.title ?? 'Untitled',
          author: authorName(e.author),
          language: e['dc:language'],
          coverUrl: coverHref ? `${BASE}${coverHref}` : undefined,
          acquire: { kind: 'url', url: acquireHref ? `${BASE}${acquireHref}` : '' },
        };
      });
    } catch {
      return [];
    }
  },
};
