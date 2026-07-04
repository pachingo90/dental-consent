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

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    if (!await verifyAdmin(request, env)) return err('Unauthorized', 401);
    const result = await env.DB.prepare(
      'SELECT id, name_zh, name_en, access_code, active, created_at FROM clinics ORDER BY created_at DESC'
    ).all();
    const clinics = await Promise.all((result.results || []).map(async c => {
      const cnt = await env.DB.prepare(
        'SELECT COUNT(*) as n FROM records WHERE clinic_id = ?'
      ).bind(c.id).first();
      return { ...c, record_count: cnt?.n || 0 };
    }));
    return json(clinics);
  } catch (e) {
    return err(e.message, 500);
  }
}
