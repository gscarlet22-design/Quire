// Temporary debug endpoint — remove before final deploy
export async function GET() {
  return Response.json({ status: 'debug endpoint active' });
}
