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

async function verifyClinic(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const parsed = parseToken(token);
  if (!parsed || parsed.type !== 'clinic') return null;
  const clinic = await env.DB.prepare(
    'SELECT id FROM clinics WHERE id = ? AND active = 1'
  ).bind(parsed.id).first();
  return clinic ? parsed.id : null;
}

// GET /api/doctors — 取得醫師名單
export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const clinic_id = await verifyClinic(request, env);
    if (!clinic_id) return err('Unauthorized', 401);
    const data = await env.DENTAL_KV.get('doctors:' + clinic_id);
    const doctors = data ? JSON.parse(data) : [];
    return json(doctors);
  } catch (e) {
    return err(e.message, 500);
  }
}

// POST /api/doctors — 儲存醫師名單（整份覆蓋）
export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const clinic_id = await verifyClinic(request, env);
    if (!clinic_id) return err('Unauthorized', 401);
    const { doctors } = await request.json();
    if (!Array.isArray(doctors)) return err('Invalid format');
    await env.DENTAL_KV.put('doctors:' + clinic_id, JSON.stringify(doctors));
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 500);
  }
}
