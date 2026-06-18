// Probe Gutenberg OPDS subject filtering for sci-fi/fantasy
const PROBES = [
  'https://www.gutenberg.org/ebooks/search.opds/?query=subject:Science+Fiction&sort_order=downloads',
  'https://www.gutenberg.org/ebooks/search.opds/?query=science+fiction&sort_order=downloads',
  'https://www.gutenberg.org/ebooks/search.opds/?subject=Science+Fiction&sort_order=downloads',
  'https://www.gutenberg.org/ebooks/subject/7849.opds',
];

export async function GET() {
  const results = await Promise.all(
    PROBES.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
          cache: 'no-store',
        });
        const text = await res.text();
        return { url, status: res.status, contentType: res.headers.get('content-type'), preview: text.slice(0, 400) };
      } catch (e) {
        return { url, error: String(e) };
      }
    })
  );
  return Response.json(results);
}
