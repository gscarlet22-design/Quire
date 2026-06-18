// Probe sci-fi/fantasy OPDS sources as Baen alternative
const CANDIDATES = [
  'https://standardebooks.org/feeds/opds/subjects/science-fiction',
  'https://standardebooks.org/feeds/opds/subjects/fantasy',
  'https://catalog.feedbooks.com/publicdomain/browse/top.atom?cat=FGSF&limit=5',
  'https://archive.org/services/opds',
  'https://manybooks.net/opds',
  'https://manybooks.net/api/opds',
];

export async function GET() {
  const results = await Promise.all(
    CANDIDATES.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
            Accept: 'application/atom+xml, application/xml, text/xml, */*',
          },
          cache: 'no-store',
        });
        const text = await res.text();
        return { url, status: res.status, contentType: res.headers.get('content-type'), preview: text.slice(0, 300) };
      } catch (e) {
        return { url, error: String(e) };
      }
    })
  );
  return Response.json(results);
}
