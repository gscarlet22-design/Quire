// Probe Baen bookdata API and Magento REST API for free library catalog
const PROBES = [
  'https://www.baen.com/bookdata/getbooks?category=2012&page=1&limit=5',
  'https://www.baen.com/bookdata/getbooks?filter=free&page=1&limit=5',
  'https://www.baen.com/bookdata/catalog?category=2012',
  'https://www.baen.com/bookdata/search?category=2012&page=1',
  'https://www.baen.com/rest/V1/products?searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bfield%5D=category_id&searchCriteria%5BfilterGroups%5D%5B0%5D%5Bfilters%5D%5B0%5D%5Bvalue%5D=2012&searchCriteria%5BpageSize%5D=3',
];

export async function GET() {
  const results = await Promise.all(
    PROBES.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'application/json, text/html' },
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
