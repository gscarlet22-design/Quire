import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Usage: /api/debug/download?id=<shelf_item_id>
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'missing id' });

  const { data: item } = await supabaseAdmin
    .from('shelf_items')
    .select('title, acquire_ref')
    .eq('id', id)
    .single();

  if (!item) return NextResponse.json({ error: 'item not found' });

  try {
    const upstream = await fetch(item.acquire_ref as string, {
      method: 'HEAD',
      headers: { 'User-Agent': 'Quire/1.0' },
    });
    return NextResponse.json({
      acquire_ref: item.acquire_ref,
      upstream_status: upstream.status,
      upstream_content_type: upstream.headers.get('content-type'),
      upstream_content_length: upstream.headers.get('content-length'),
    });
  } catch (e) {
    return NextResponse.json({ acquire_ref: item.acquire_ref, fetch_error: String(e) });
  }
}
