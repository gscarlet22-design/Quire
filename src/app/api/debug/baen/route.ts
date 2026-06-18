// Inspect Baen Free Library page for Magento data patterns
export async function GET() {
  try {
    const res = await fetch('https://www.baen.com/allbooks/category/index/id/2012', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'text/html' },
      cache: 'no-store',
    });
    const text = await res.text();

    // Magento embeds product data in x-magento-init script tags
    const magentoIdx = text.indexOf('x-magento-init');
    const magentoCtx = magentoIdx >= 0 ? text.slice(magentoIdx, magentoIdx + 500) : 'not found';

    // Look for any JSON array with items/products
    const itemsIdx = text.indexOf('"items"');
    const itemsCtx = itemsIdx >= 0 ? text.slice(itemsIdx, itemsIdx + 400) : 'not found';

    // Look for catalog_product_entity or similar
    const catalogIdx = text.indexOf('catalog');
    const catalogCtx = catalogIdx >= 0 ? text.slice(catalogIdx, catalogIdx + 300) : 'not found';

    // Check for AJAX/API URL patterns
    const ajaxRe = /["'](https?:\/\/[^"']*(?:catalog|product|list|search)[^"']*)/g;
    const ajaxUrls: string[] = [];
    let m;
    while ((m = ajaxRe.exec(text)) !== null) ajaxUrls.push(m[1]);

    // Sample from near the end of the body where product grids usually render
    const bodyEnd = text.slice(Math.max(0, text.length - 8000), text.length - 6000);

    return Response.json({
      status: res.status,
      magentoInitContext: magentoCtx,
      itemsContext: itemsCtx,
      catalogContext: catalogCtx,
      ajaxUrls: Array.from(new Set(ajaxUrls)).slice(0, 8),
      bodyEndSample: bodyEnd.slice(0, 800),
    });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
