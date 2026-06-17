// Probes candidate Baen free library URLs to find the working one
const CANDIDATES = [
  'https://www.baen.com/free-library',
  'https://www.baen.com/free',
  'https://www.baen.com/free-reads',
  'https://www.baen.com/catalog/category/view/id/2',
  'https://www.baen.com/catalog/category/view/id/74',
];

export async function GET() {
  const results = await Promise.all(
    CANDIDATES.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'text/html' },
          cache: 'no-store',
          redirect: 'follow',
        });
        const text = await res.text();
        // Look for epub or download links in the page
        const epubIdx = text.toLowerCase().indexOf('.epub');
        const epubCtx = epubIdx >= 0 ? text.slice(Math.max(0, epubIdx - 150), epubIdx + 100) : null;
        const freeIdx = text.toLowerCase().indexOf('free');
        const bookCtx = freeIdx >= 0 ? text.slice(freeIdx, freeIdx + 200) : null;
        return {
          url,
          status: res.status,
          finalUrl: res.url,
          pageLength: text.length,
          epubContext: epubCtx,
          freeContext: bookCtx,
        };
      } catch (e) {
        return { url, error: String(e) };
      }
    })
  );
  return Response.json(results);
}
