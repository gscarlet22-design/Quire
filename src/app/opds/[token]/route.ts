import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const PAGE_SIZE = 20;

function esc(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  if (params.token !== process.env.OPDS_FEED_TOKEN) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { data: rows, count } = await supabaseAdmin
    .from('shelf_items')
    .select('id, title, author, cover_url, acquire_ref, added_at, sources(allowed_targets)', {
      count: 'exact',
    })
    .eq('status', 'shelved')
    .order('added_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const items = (rows ?? []).filter((r) => {
    const allowed: string[] = Array.isArray(r.sources)
      ? (r.sources[0] as { allowed_targets: string[] })?.allowed_targets ?? []
      : (r.sources as { allowed_targets: string[] } | null)?.allowed_targets ?? [];
    return allowed.includes('x4');
  });

  const host = req.headers.get('host') ?? '';
  const proto = host.startsWith('localhost') ? 'http' : 'https';
  const base = `${proto}://${host}`;
  const feedUrl = `${base}/opds/${params.token}`;
  const hasNext = offset + PAGE_SIZE < (count ?? 0);
  const updated = new Date().toISOString();

  const entries = items
    .map(
      (r) => `
  <entry>
    <id>urn:quire:shelf-item:${r.id}</id>
    <title>${esc(r.title as string)}</title>
    <author><name>${esc(r.author as string)}</name></author>
    <updated>${r.added_at}</updated>
    ${r.cover_url ? `<link rel="http://opds-spec.org/image" type="image/jpeg" href="${esc(r.cover_url as string)}"/>` : ''}
    <link rel="http://opds-spec.org/acquisition"
          type="application/epub+zip"
          href="${feedUrl}/download/${r.id}"/>
  </entry>`
    )
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom"
      xmlns:opds="http://opds-spec.org/2010/catalog"
      xmlns:dc="http://purl.org/dc/terms/">
  <id>${feedUrl}</id>
  <title>Quire Shelf</title>
  <updated>${updated}</updated>
  <author><name>Quire</name></author>
  <link rel="self"
        type="application/atom+xml;profile=opds-catalog;kind=acquisition"
        href="${feedUrl}?page=${page}"/>
  <link rel="start"
        type="application/atom+xml;profile=opds-catalog;kind=acquisition"
        href="${feedUrl}"/>
  ${hasNext ? `<link rel="next" type="application/atom+xml;profile=opds-catalog;kind=acquisition" href="${feedUrl}?page=${page + 1}"/>` : ''}
  ${entries}
</feed>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/atom+xml;profile=opds-catalog;kind=acquisition',
      'Cache-Control': 'no-store',
    },
  });
}
