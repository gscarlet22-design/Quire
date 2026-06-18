// Probe Internet Archive OPDS 2.0 endpoints for sci-fi/fantasy
const PROBES = [
  'https://archive.org/services/opds/catalog?query=subject%3Ascience+fiction+AND+mediatype%3Atexts+AND+licenseurl%3A*publicdomain*&sort=-downloads&limit=3',
  'https://archive.org/services/opds/catalog?query=subject%3A%22science+fiction%22+AND+mediatype%3Atexts&sort=-downloads&limit=3',
  'https://archive.org/services/opds/catalog?query=fantasy+mediatype%3Atexts&sort=-downloads&limit=3',
  'https://archive.org/services/opds/catalog?query=science+fiction+mediatype%3Atexts&sort=-downloads&limit=3',
];

export async function GET() {
  const results = await Promise.all(
    PROBES.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/opds+json, application/json' },
          cache: 'no-store',
        });
        const text = await res.text();
        return { url, status: res.status, contentType: res.headers.get('content-type'), preview: text.slice(0, 600) };
      } catch (e) {
        return { url, error: String(e) };
      }
    })
  );
  return Response.json(results);
}
