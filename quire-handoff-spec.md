# Quire — Claude Code Handoff Spec

> **Quire** — named for the bookbinding term: a gathering of folded sheets sewn into one section of a book (from Latin *quaternum*). The app gathers many sources into one.
>
> A personal, $0-to-run PWA that aggregates multiple ebook sources into one searchable
> catalog, lets you curate a shelf, and dispatches books to three different e-reader
> targets through swappable delivery adapters.
>
> **Primary, fully-built path:** Xteink X4 running CrossPoint, via an OPDS feed the
> device subscribes to and pulls from over WiFi.
> **Secondary adapters (defined, built incrementally):** wife's Kindle (Send-to-Kindle
> email dispatch) and mother's Nook (USB export batch).

---

## 1. Goals & non-goals

**Goals**
- One pleasant search/curation surface (phone or desktop) across many public-domain sources.
- A single OPDS feed endpoint that CrossPoint treats as a saved server and downloads from directly.
- Push-style delivery to a Kindle (email) and a Nook (export batch) without changing those devices.
- Per-source rules controlling which targets a given source is allowed to reach.
- Zero operational cost; PWA-installable.

**Non-goals (v1)**
- No DRM handling of any kind. DRM-locked / library-loan sources (Libby etc.) are out of scope, permanently.
- No heavy server-side format conversion. CrossPoint optimizes EPUBs on-device; Amazon converts on ingest; Nook reads EPUB natively. We only do light cover/metadata normalization for the Nook export.
- No fully-automated price/availability scraping.
- **No audiobooks.** The X4 has no audio output. Audiobook servers (Plex, Audiobookshelf, etc.) are unrelated to this project and handled by separate phone apps.
- The personal Calibre library is **not** served through the public deployment (see §7). Deferred entirely for v1 — see §9.

---

## 2. Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind**.
- **Vercel** hosting (Hobby tier, $0). PWA manifest + service worker, installable.
- **Supabase** (free tier) for persistence: source registry, shelf items, targets, dispatch log.
- **Email provider** for the Kindle adapter: **Resend** (free tier) or Gmail SMTP. API key in Vercel env.
- No Docker required. No local toolchain beyond Node. CI/build via Vercel (or GitHub Actions if preferred, mirroring your ACAP workflow).

---

## 3. Core data model (Supabase)

Keep it minimal; this is a single-user tool.

```
sources
  id            uuid pk
  name          text                      -- "Standard Ebooks"
  adapter       text                      -- 'opds' | 'gutendex' | 'custom'
  config        jsonb                     -- { baseUrl, ... } adapter-specific
  enabled       bool default true
  allowed_targets text[] default '{x4,kindle,nook}'  -- per-source permission rules

targets
  id            uuid pk
  kind          text                      -- 'x4' | 'kindle' | 'nook'
  label         text                      -- "Garrett's X4", "Wife's Kindle", "Mom's Nook"
  config        jsonb                     -- e.g. { kindleEmail } for kindle
  enabled       bool default true

shelf_items
  id            uuid pk
  source_id     uuid fk -> sources
  external_id   text                      -- source's own id
  title         text
  author        text
  language      text
  cover_url     text
  acquire_ref   text                      -- source download URL or internal ref
  added_at      timestamptz default now()
  status        text default 'shelved'    -- 'shelved' | 'archived'

dispatch_log
  id            uuid pk
  shelf_item_id uuid fk -> shelf_items
  target_id     uuid fk -> targets
  status        text                      -- 'queued' | 'sent' | 'error'
  error         text
  dispatched_at timestamptz default now()
```

---

## 4. Source adapter framework

Each source is an adapter that normalizes results into a common `CatalogEntry`:

```ts
type CatalogEntry = {
  sourceId: string;
  externalId: string;
  title: string;
  author: string;
  language?: string;
  coverUrl?: string;
  acquire: { kind: 'url'; url: string } | { kind: 'proxy'; ref: string }; // EPUB acquisition
};

interface SourceAdapter {
  id: string;
  search(query: string, page?: number): Promise<CatalogEntry[]>;
  // optional browse(category) for feeds that support it
}
```

**v1 adapters**
- **Standard Ebooks** — native OPDS feed. Parse the OPDS (Atom) acquisition feed; map entries to `CatalogEntry`. Cleanest input for e-ink (already lean), so favor it in default browse.
- **Project Gutenberg** — via **Gutendex** (`https://gutendex.com/books/?search=...`), a JSON API over Gutenberg metadata. Map to `CatalogEntry`, picking the EPUB format download URL from each book's `formats`.

**Future adapters (stubs only in v1)**
- **Private ebook club** — pending invite. Add as `adapter: 'opds'` or `'custom'` once its access pattern is known. **Default `allowed_targets = '{x4}'`** (see §7).
- **Calibre** (personal library) — only on a private/LAN deployment, not public Vercel (see §7).

Adding a source later = implement the interface + insert a `sources` row. No core changes.

---

## 5. Search / curation UI

- Single search box → fan out to all enabled adapters in parallel → merge results.
- De-dupe by normalized `title + author`.
- Result card: cover, title, author, source badge, "Add to shelf".
- Shelf view: list of `shelf_items`, each with target toggles (X4 / Kindle / Nook) that respect the source's `allowed_targets` (disabled + tooltip if not permitted).
- "Dispatch" action per item or batch → writes `dispatch_log` rows and invokes the relevant delivery adapter(s).
- Mobile-first; this is mostly used from a phone.

---

## 6. Delivery adapters

### 6a. X4 / CrossPoint — OPDS feed (PRIMARY, build first)

Serve a standards-compliant **OPDS 1.2 (Atom)** acquisition feed of the curated shelf.

- **Catalog root:** `GET /opds/<feed-token>` → OPDS navigation/acquisition feed.
  - Content type: `application/atom+xml;profile=opds-catalog;kind=acquisition`.
  - Each shelf item becomes an `<entry>` with an acquisition link
    `rel="http://opds-spec.org/acquisition"` `type="application/epub+zip"`.
- **Acquisition endpoint:** `GET /opds/<feed-token>/download/<shelf_item_id>` →
  streams the EPUB. Implementation: fetch from the source's `acquire` URL on demand and
  stream through (no need to pre-store). Optionally cache to Supabase Storage if a source
  is slow/rate-limited.
- **Pagination:** OPDS `rel="next"` links; page size ~20.
- **Search (optional):** OpenSearch description doc so CrossPoint's in-feed search works.
- **Auth:** protect the feed with an unguessable `<feed-token>` in the path. The feed only
  ever contains public-domain content (see §7), so a path token is sufficient; do not put
  restricted-source content in any publicly reachable feed.

**On-device:** CrossPoint → OPDS browser → add saved server → paste
`https://<app>/opds/<feed-token>` → browse → download. The device's built-in EPUB
optimizer handles e-ink tuning, so **no server-side optimization needed** here.

### 6b. Wife's Kindle — Send-to-Kindle email (push)

- Dispatch = email the EPUB as an attachment to her `@kindle.com` address.
- **From** an address on her Amazon approved-sender list (one-time setup on her account).
- Constraints: **DRM-free EPUB only**, **≤ 200 MB/file**. Amazon converts EPUB → Kindle
  format on arrival and syncs across her devices. Her native reader is untouched.
- Implementation: server action fetches the EPUB → emails via Resend with attachment →
  logs result. Surface a clear error if file > 200 MB.
- Config in `targets.config`: `{ kindleEmail }`. Sender + API key in Vercel env.

### 6c. Mom's Nook — USB export batch (manual, non-invasive)

- Dispatch = generate a downloadable **ZIP** of selected EPUBs, ready to drag into the
  Nook's `My Files/Books` folder over USB. Her device and reading app never change.
- **Cover/metadata normalization:** sideloaded Nook books otherwise show blank covers.
  In the export step, ensure each EPUB has an embedded cover + correct title/author
  metadata. v1: do this in JS by rewriting the EPUB zip's OPF metadata + cover reference
  (the EPUB is a zip; no Calibre needed). *Optional later:* a small self-hosted Node
  worker on home infra wrapping Calibre's `ebook-meta` for higher-fidelity fixes.
- Output: `GET /export/nook?items=...` → streams `nook-batch-<date>.zip`.

---

## 7. Privacy, permissions & deployment separation

- **Public Vercel deployment serves public-domain sources only.** Never serve the personal
  Calibre library or any copyrighted/membership content through the public app or the
  public OPDS feed.
- **Per-source `allowed_targets`** is enforced server-side at dispatch time, not just in the
  UI. The private ebook club source defaults to `{x4}` — i.e. it can reach your own device
  but is blocked from the Kindle/Nook adapters unless the club's terms clearly permit
  sharing to others' devices. Make this a single config value so it's easy to widen later.
- **Personal Calibre library** — **deferred for v1.** This is a first e-reader for a
  primarily-physical-book reader; there is no personal ebook library to manage yet. When
  one accumulates, two options: a *separate private deployment* reachable on LAN / via
  WireGuard (behind auth) to fold it into unified search, OR CrossPoint's native Calibre
  wireless connect on the X4 directly with no app involvement. Until then, do not build it.
- Secrets (Supabase keys, email API key, approved sender, kindle address) live in Vercel
  env vars, never in the repo.

---

## 8. Suggested build phases

0. **Scaffold** — Next.js 14 + TS + Tailwind, Vercel deploy, PWA manifest/service worker, Supabase project + schema (§3).
1. **Adapters + search** — `SourceAdapter` framework, Standard Ebooks (OPDS) + Gutendex adapters, unified search UI.
2. **Shelf** — add/remove shelf items, shelf view, target toggles gated by `allowed_targets`.
3. **OPDS feed (X4)** — §6a end to end; test by adding the feed in CrossPoint and downloading a book. *This is the milestone that delivers the core value.*
4. **Kindle email adapter** — §6b.
5. **Nook export adapter** — §6c, incl. JS cover/metadata embedding.
6. **Permissions + log + polish** — server-side `allowed_targets` enforcement, dispatch log view, PWA install polish.

*Future:* club-source adapter (on invite), optional private Calibre deployment, optional Calibre worker for Nook fidelity.

---

## 9. Open items

**Decided**
- Calibre / personal library: **deferred** — no personal library yet (§7).
- Audiobooks: **out of scope** — X4 has no audio (§1).

**Still open**
- Final app name.
- Email provider choice (Resend vs Gmail SMTP) — only blocks the Kindle adapter (Phase 4), not the core build.
- Club source access pattern — fill in once the invite arrives; default `allowed_targets = {x4}`.

---

## Appendix A — Flashing your X4 to CrossPoint (do this when the device arrives)

This part is for **you**, not Claude Code — it's a one-time, ~2-minute, no-solder job.

**Before it ships:** buy the X4 **directly from xteink.com**. Units from third-party
stores (e.g. AliExpress) can ship with USB flashing locked from the factory and need a
separate "Xteink Unlocker" tool first; units bought direct from xteink.com are not locked.

**You'll need:** the X4, a computer, a **data-capable USB-C cable** (not charge-only), and
**Chrome or Edge** (the web flasher uses Web Serial; Safari and Firefox won't work).

**Steps**
1. Plug the X4 into the computer via USB-C and **wake the device** (the screen must be on/active, not timed out).
2. In Chrome or Edge, go to **`https://crosspointreader.com/#flash-tools`**.
3. Select device **X4**, choose the latest official CrossPoint release, and start the flash.
4. When the browser's serial device picker appears, select the X4 and let it complete.

**First-time setup on the device**
5. Join your WiFi: CrossPoint → WiFi → **STA mode** (join existing network); there are QR helpers to make this easier.
6. Add your feed: CrossPoint → **OPDS browser → add saved server →** paste
   `https://<your-app>/opds/<feed-token>`. Browse and download — done.
7. (Optional) For your own Calibre library, use CrossPoint's **Calibre wireless connect**.

**If the device doesn't appear in the serial picker:** try a different USB port, a different
data cable, and make sure the screen is awake. Only if it still won't appear *and* it's a
third-party unit should you suspect a factory USB lock (then use the Xteink Unlocker).

**To revert to stock:** re-flash the official firmware from the same `#flash-tools` page.

---

*Scope note: this spec deliberately avoids DRM circumvention and keeps membership/personal
content off public endpoints. Keep the club source scoped to your own device unless its
terms permit otherwise.*
