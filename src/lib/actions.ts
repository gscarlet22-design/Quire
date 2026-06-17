'use server';

import { supabaseAdmin } from '@/lib/supabase';
import type { CatalogEntry } from '@/lib/types';

export async function addToShelf(entry: CatalogEntry): Promise<{ error?: string }> {
  const { data: source, error: srcErr } = await supabaseAdmin
    .from('sources')
    .select('id')
    .eq('key', entry.sourceId)
    .single();

  if (srcErr || !source) return { error: 'Source not found' };

  const { error } = await supabaseAdmin.from('shelf_items').upsert(
    {
      source_id: source.id,
      external_id: entry.externalId,
      title: entry.title,
      author: entry.author,
      language: entry.language ?? null,
      cover_url: entry.coverUrl ?? null,
      acquire_ref: entry.acquire.kind === 'url' ? entry.acquire.url : entry.acquire.ref,
      status: 'shelved',
    },
    { onConflict: 'source_id,external_id' }
  );

  return error ? { error: error.message } : {};
}

export async function removeFromShelf(shelfItemId: string): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin
    .from('shelf_items')
    .update({ status: 'archived' })
    .eq('id', shelfItemId);

  return error ? { error: error.message } : {};
}
