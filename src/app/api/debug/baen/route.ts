// Probes candidate Baen OPDS URLs to find which one works
const CANDIDATES = [
  'https://www.baen.com/opds',
  'https://www.baen.com/opds/',
  'https://www.baen.com/opds/root.xml',
  'https://www.baen.com/catalog/catalog.atom',
];

export async function GET() {
  const results = await Promise.all(
    CANDIDATES.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
          cache: 'no-store',
        });
        const text = await res.text();
        return { url, status: res.status, contentType: res.headers.get('content-type'), preview: text.slice(0, 200) };
      } catch (e) {
        return { url, error: String(e) };
      }
    })
  );
  return Response.json(results, { headers: { 'Content-Type': 'application/json' } });
}
