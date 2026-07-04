function parseToken(token) {
  try { const p = atob(token).split(':'); return p.length >= 3 ? { type: p[0], id: p[1] } : null; }
  catch { return null; }
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
function err(msg, status = 400) { return json({ error: msg }, status); }

async function verifyAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return false;
  const parsed = parseToken(token);
  if (!parsed || parsed.type !== 'admin') return false;
  const stored = await env.DENTAL_KV.get('admin_token_valid:' + token);
  return stored === '1';
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!await verifyAdmin(request, env)) return err('Unauthorized', 401);
    const { id, active } = await request.json();
    if (!id || active === undefined) return err('Missing fields');
    await env.DB.prepare('UPDATE clinics SET active = ? WHERE id = ?').bind(active ? 1 : 0, id).run();
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 500);
  }
}
