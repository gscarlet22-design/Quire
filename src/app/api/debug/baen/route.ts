// Find Baen Free Library category URL by scanning nav links
export async function GET() {
  try {
    const res = await fetch('https://www.baen.com', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'text/html' },
      cache: 'no-store',
    });
    const text = await res.text();

    // Find the Free Library nav link
    const freeLibIdx = text.indexOf('Free Library');
    const freeLibCtx = freeLibIdx >= 0 ? text.slice(Math.max(0, freeLibIdx - 150), freeLibIdx + 50) : 'not found';

    // Extract all /allbooks/ hrefs
    const allbooksLinks: string[] = [];
    const re = /href="(\/allbooks\/[^"]+)"/g;
    let m;
    while ((m = re.exec(text)) !== null) allbooksLinks.push(m[1]);

    return Response.json({ freeLibContext: freeLibCtx, allbooksLinks: [...new Set(allbooksLinks)] });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
