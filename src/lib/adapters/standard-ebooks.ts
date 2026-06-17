import { XMLParser } from 'fast-xml-parser';
import type { SourceAdapter, CatalogEntry } from '@/lib/types';

const BASE = 'https://standardebooks.org';
const OPDS_SEARCH_URL = `${BASE}/feeds/opds/all`;
const ATOM_NEW_RELEASES_URL = `${BASE}/feeds/atom/new-releases`;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name: string) => ['entry', 'link', 'category'].includes(name),
});

// ── OPDS types (used for search) ────────────────────────────────────────────

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

function pickOpdsLink(links: OpdsLink[] = [], rel: string): string {
  const found = links.find((l) => l['@_rel']?.startsWith(rel));
  return found?.['@_href'] ?? '';
}

function opdsAuthorName(raw: OpdsEntry['author']): string {
  if (!raw) return 'Unknown';
  const obj = Array.isArray(raw) ? raw[0] : raw;
  return obj?.name ?? 'Unknown';
}

function toAbsolute(href: string) {
  return href.startsWith('http') ? href : `${BASE}${href}`;
}

async function fetchOpdsFeed(url: string): Promise<CatalogEntry[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = parser.parse(await res.text());
    const entries: OpdsEntry[] = data?.feed?.entry ?? [];
    return entries.map((e): CatalogEntry => {
      const links = e.link ?? [];
      const coverHref = pickOpdsLink(links, 'http://opds-spec.org/image');
      const acquireHref = pickOpdsLink(links, 'http://opds-spec.org/acquisition');
      return {
        sourceId: 'standard-ebooks',
        externalId: e.id ?? '',
        title: e.title ?? 'Untitled',
        author: opdsAuthorName(e.author),
        language: e['dc:language'],
        coverUrl: coverHref ? toAbsolute(coverHref) : undefined,
        acquire: { kind: 'url', url: acquireHref ? toAbsolute(acquireHref) : '' },
      };
    });
  } catch {
    return [];
  }
}

// ── Atom types (used for browse / new-releases) ──────────────────────────────

interface AtomLink {
  '@_rel'?: string;
  '@_href'?: string;
  '@_type'?: string;
  '@_title'?: string;
}

interface AtomEntry {
  id?: string;
  title?: string;
  author?: { name?: string };
  link?: AtomLink[];
  'media:thumbnail'?: { '@_url'?: string };
}

function pickEpubEnclosure(links: AtomLink[]): string {
  const epub = links.filter(
    (l) => l['@_rel'] === 'enclosure' && l['@_type'] === 'application/epub+zip'
  );
  // Prefer the "Recommended compatible epub" — not advanced/kepub
  const recommended = epub.find((l) =>
    l['@_title']?.toLowerCase().includes('recommended')
  );
  return (recommended ?? epub[0])?.['@_href'] ?? '';
}

async function fetchAtomFeed(url: string): Promise<CatalogEntry[]> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = parser.parse(await res.text());
    const entries: AtomEntry[] = data?.feed?.entry ?? [];
    return entries.map((e): CatalogEntry => {
      const links: AtomLink[] = e.link ?? [];
      const thumbnail = e['media:thumbnail'] as { '@_url'?: string } | undefined;
      return {
        sourceId: 'standard-ebooks',
        externalId: e.id ?? '',
        title: e.title ?? 'Untitled',
        author: e.author?.name ?? 'Unknown',
        coverUrl: thumbnail?.['@_url'] ?? undefined,
        acquire: { kind: 'url', url: pickEpubEnclosure(links) },
      };
    });
  } catch {
    return [];
  }
}

// ── Adapter ──────────────────────────────────────────────────────────────────

export const standardEbooksAdapter: SourceAdapter = {
  id: 'standard-ebooks',
  name: 'Standard Ebooks',

  async search(query, page = 1) {
    return fetchOpdsFeed(
      `${OPDS_SEARCH_URL}?query=${encodeURIComponent(query)}&page=${page}`
    );
  },

  async browse() {
    return fetchAtomFeed(ATOM_NEW_RELEASES_URL);
  },
};
