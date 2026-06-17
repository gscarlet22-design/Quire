import { supabaseAdmin } from '@/lib/supabase';
import { ShelfItem } from '@/components/ShelfItem';

export const dynamic = 'force-dynamic';

export default async function ShelfPage() {
  const { data: rows } = await supabaseAdmin
    .from('shelf_items')
    .select('id, title, author, cover_url, sources(allowed_targets)')
    .eq('status', 'shelved')
    .order('added_at', { ascending: false });

  const items = (rows ?? []).map((r) => ({
    id: r.id as string,
    title: r.title as string,
    author: r.author as string,
    cover_url: (r.cover_url as string | null) ?? null,
    sources: Array.isArray(r.sources)
      ? (r.sources[0] as { allowed_targets: string[] } | null) ?? null
      : (r.sources as { allowed_targets: string[] } | null) ?? null,
  }));

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      {items.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          Your shelf is empty. Search for books and add them here.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <ShelfItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
