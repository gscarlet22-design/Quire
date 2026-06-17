// Probes Baen Free Library HTML structure to identify book listing pattern
export async function GET() {
  try {
    const res = await fetch('https://www.baen.com/baen-free-library', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'text/html' },
      cache: 'no-store',
    });
    const text = await res.text();

    // Extract a sample around "epub" links to understand download URL structure
    const epubIdx = text.toLowerCase().indexOf('.epub');
    const epubCtx = epubIdx >= 0 ? text.slice(Math.max(0, epubIdx - 200), epubIdx + 200) : 'no .epub found';

    // Extract a sample around product/book links
    const hrefIdx = text.indexOf('href="/');
    const hrefCtx = hrefIdx >= 0 ? text.slice(hrefIdx, hrefIdx + 400) : 'no href found';

    return Response.json({
      status: res.status,
      contentType: res.headers.get('content-type'),
      pageLength: text.length,
      epubContext: epubCtx,
      hrefContext: hrefCtx,
      // Show a chunk of the middle of the page where book listings usually are
      midChunk: text.slice(3000, 4000),
    });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
