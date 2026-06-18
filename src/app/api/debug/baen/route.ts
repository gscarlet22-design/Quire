// Inspect Baen Free Library listing page structure
export async function GET() {
  try {
    const res = await fetch('https://www.baen.com/allbooks/category/index/id/2012', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Quire/1.0)', Accept: 'text/html' },
      cache: 'no-store',
    });
    const text = await res.text();

    // Find product/book links
    const bookLinks: string[] = [];
    const bookRe = /href="(https?:\/\/www\.baen\.com\/[a-z0-9_-]+\/[a-z0-9_-]+[^"]*\.html[^"]*)"/gi;
    let m;
    while ((m = bookRe.exec(text)) !== null) bookLinks.push(m[1]);

    // Look for JSON product data (Magento often embeds it)
    const jsonIdx = text.indexOf('"sku"');
    const jsonCtx = jsonIdx >= 0 ? text.slice(jsonIdx, jsonIdx + 300) : 'no sku found';

    // Sample chunk where book cards would appear
    const productIdx = text.indexOf('product-item');
    const productCtx = productIdx >= 0 ? text.slice(productIdx, productIdx + 600) : 'no product-item found';

    return Response.json({
      status: res.status,
      pageLength: text.length,
      bookLinks: Array.from(new Set(bookLinks)).slice(0, 10),
      skuContext: jsonCtx,
      productContext: productCtx,
    });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
