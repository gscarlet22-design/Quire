// Probe Baen's custom AJAX catalog endpoints
export async function GET() {
  const BASE = 'https://www.baen.com';

  // Try extraSearch with various param combinations
  const probes = [
    { method: 'GET', url: `${BASE}/allbooks/category/extraSearch?category_id=2012&p=1&limit=5` },
    { method: 'GET', url: `${BASE}/allbooks/category/extraSearch?id=2012&page=1` },
    { method: 'POST', url: `${BASE}/allbooks/category/extraSearch`, body: JSON.stringify({ category_id: 2012, p: 1, limit: 5 }) },
    { method: 'POST', url: `${BASE}/allbooks/category/extraSearch`, body: 'category_id=2012&p=1&limit=5' },
    { method: 'GET', url: `${BASE}/allbooks/category/extraSearch?category=2012&p=1` },
  ];

  const results = await Promise.all(
    probes.map(async ({ method, url, body }) => {
      try {
        const headers: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)',
          Accept: 'application/json, text/html, */*',
          'X-Requested-With': 'XMLHttpRequest',
        };
        if (body && typeof body === 'string' && body.startsWith('{')) {
          headers['Content-Type'] = 'application/json';
        } else if (body) {
          headers['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        const res = await fetch(url, { method, headers, body, cache: 'no-store' } as RequestInit);
        const text = await res.text();
        return { method, url, status: res.status, contentType: res.headers.get('content-type'), preview: text.slice(0, 400) };
      } catch (e) {
        return { method, url, error: String(e) };
      }
    })
  );
  return Response.json(results);
}
