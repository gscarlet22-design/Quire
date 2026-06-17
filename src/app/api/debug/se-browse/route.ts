export async function GET() {
  const res = await fetch('https://standardebooks.org/feeds/opds/all', {
    headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
    cache: 'no-store',
  });
  const text = await res.text();
  return new Response(text.slice(0, 3000), {
    headers: { 'Content-Type': 'text/plain' },
  });
}
