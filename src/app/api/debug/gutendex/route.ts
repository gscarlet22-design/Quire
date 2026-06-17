export async function GET() {
  try {
    const res = await fetch('https://gutendex.com/books/?search=frankenstein', {
      headers: { 'User-Agent': 'Quire/1.0' },
      cache: 'no-store',
    });
    const body = await res.text();
    return Response.json({ status: res.status, bodyPreview: body.slice(0, 500) });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
