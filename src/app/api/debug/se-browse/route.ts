export async function GET() {
  const res = await fetch('https://standardebooks.org/feeds/opds/new-releases', {
    headers: { 'User-Agent': 'Quire/1.0', Accept: 'application/atom+xml' },
    cache: 'no-store',
  });
  const text = await res.text();
  return new Response(`STATUS: ${res.status}\nCONTENT-TYPE: ${res.headers.get('content-type')}\n\n${text.slice(0, 2000)}`, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
