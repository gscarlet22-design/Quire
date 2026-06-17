-- Add a stable lookup key to sources
ALTER TABLE public.sources ADD COLUMN key text unique;

-- Seed the two v1 sources
INSERT INTO public.sources (key, name, adapter, config, allowed_targets) VALUES
  ('standard-ebooks', 'Standard Ebooks', 'opds',
   '{"baseUrl": "https://standardebooks.org/feeds/opds"}',
   '{x4,kindle,nook}'),
  ('gutenberg', 'Project Gutenberg', 'opds',
   '{"baseUrl": "https://www.gutenberg.org"}',
   '{x4,kindle,nook}');

-- Seed the three delivery targets
INSERT INTO public.targets (kind, label, config) VALUES
  ('x4',     'Garrett''s X4',  '{}'),
  ('kindle', 'Wife''s Kindle', '{"kindleEmail": ""}'),
  ('nook',   'Mom''s Nook',    '{}');

-- Unique constraint so re-shelving an archived book upserts cleanly
ALTER TABLE public.shelf_items
  ADD CONSTRAINT shelf_items_source_external_unique UNIQUE (source_id, external_id);
