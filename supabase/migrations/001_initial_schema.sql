create table public.sources (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  adapter        text not null,
  config         jsonb not null default '{}',
  enabled        bool not null default true,
  allowed_targets text[] not null default '{x4,kindle,nook}'
);

create table public.targets (
  id      uuid primary key default gen_random_uuid(),
  kind    text not null,
  label   text not null,
  config  jsonb not null default '{}',
  enabled bool not null default true
);

create table public.shelf_items (
  id          uuid primary key default gen_random_uuid(),
  source_id   uuid not null references public.sources(id),
  external_id text not null,
  title       text not null,
  author      text not null,
  language    text,
  cover_url   text,
  acquire_ref text not null,
  added_at    timestamptz not null default now(),
  status      text not null default 'shelved'
);

create table public.dispatch_log (
  id            uuid primary key default gen_random_uuid(),
  shelf_item_id uuid not null references public.shelf_items(id),
  target_id     uuid not null references public.targets(id),
  status        text not null default 'queued',
  error         text,
  dispatched_at timestamptz not null default now()
);

-- Required for PostgREST (supabase-js) — explicit grants mandatory after Oct 30 2026
grant select, insert, update, delete on public.sources       to authenticated;
grant select, insert, update, delete on public.targets       to authenticated;
grant select, insert, update, delete on public.shelf_items   to authenticated;
grant select, insert, update, delete on public.dispatch_log  to authenticated;
