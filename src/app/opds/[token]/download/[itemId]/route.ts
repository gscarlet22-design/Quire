import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string; itemId: string } }
) {
  if (params.token !== process.env.OPDS_FEED_TOKEN) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const { data: item } = await supabaseAdmin
    .from('shelf_items')
    .select('title, acquire_ref, sources(allowed_targets)')
    .eq('id', params.itemId)
    .single();

  if (!item) return new NextResponse('Not Found', { status: 404 });

  const allowed: string[] = Array.isArray(item.sources)
    ? (item.sources[0] as { allowed_targets: string[] })?.allowed_targets ?? []
    : (item.sources as { allowed_targets: string[] } | null)?.allowed_targets ?? [];

  if (!allowed.includes('x4')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const upstream = await fetch(item.acquire_ref as string, {
    headers: { 'User-Agent': 'Quire/1.0' },
  });

  if (!upstream.ok) {
    return new NextResponse('Failed to fetch EPUB from source', { status: 502 });
  }

  const safeName = (item.title as string).replace(/[^a-z0-9 ._-]/gi, '_').slice(0, 80);

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': `attachment; filename="${safeName}.epub"`,
      'Cache-Control': 'no-store',
    },
  });
}
