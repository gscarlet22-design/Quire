// Find product listings in Baen Free Library page HTML (82-150KB range)
export async function GET() {
  try {
    const res = await fetch('https://www.baen.com/allbooks/category/index/id/2012', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'text/html' },
      cache: 'no-store',
    });
    const text = await res.text();

    // Sample four chunks across the product area
    const c1 = text.slice(82000, 83500);
    const c2 = text.slice(100000, 101500);
    const c3 = text.slice(120000, 121500);
    const c4 = text.slice(140000, 141500);

    // Also try to find the actual AJAX endpoint from inline JS
    const fetchRe = /fetch\(['"`]([^'"`]+)['"`]/g;
    const xhrRe = /(?:url|URL|endpoint)['":\s]+['"]([^'"]+)['"]/g;
    const apiUrls: string[] = [];
    let m;
    while ((m = fetchRe.exec(text)) !== null) apiUrls.push(m[1]);
    while ((m = xhrRe.exec(text)) !== null) apiUrls.push(m[1]);

    return Response.json({ c1, c2, c3, c4, apiUrls: apiUrls.slice(0, 10) });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
