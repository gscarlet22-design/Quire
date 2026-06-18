// Inspect product grid section of Baen Free Library page
export async function GET() {
  try {
    const res = await fetch('https://www.baen.com/allbooks/category/index/id/2012', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'text/html' },
      cache: 'no-store',
    });
    const text = await res.text();

    // The product grid is in the middle of the page — sample chunks
    const chunk1 = text.slice(40000, 41500);
    const chunk2 = text.slice(60000, 61500);
    const chunk3 = text.slice(80000, 81500);

    // Look for any href containing a book slug (not allbooks, not media)
    const hrefRe = /href="(\/[a-z][a-z0-9-]+\/[a-z][a-z0-9-]+[^"]*)"/g;
    const hrefs: string[] = [];
    let m;
    while ((m = hrefRe.exec(text)) !== null) {
      const h = m[1];
      if (!h.startsWith('/allbooks') && !h.startsWith('/media') && !h.startsWith('/customer') && !h.startsWith('/checkout'))
        hrefs.push(h);
    }

    return Response.json({
      chunk1,
      chunk2,
      chunk3,
      nonNavHrefs: Array.from(new Set(hrefs)).slice(0, 15),
    });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
