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
    const { id, name_zh, name_en, access_code } = await request.json();
    if (!id || !name_zh || !access_code) return err('診所代碼、中文名稱、密碼為必填');
    const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanId) return err('診所代碼只能包含英文小寫、數字、連字號');
    const exists = await env.DB.prepare('SELECT id FROM clinics WHERE id = ?').bind(cleanId).first();
    if (exists) return err('診所代碼已存在');
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO clinics (id, name_zh, name_en, access_code, active, created_at) VALUES (?, ?, ?, ?, 1, ?)'
    ).bind(cleanId, name_zh.trim(), (name_en || '').trim(), access_code.trim(), now).run();
    return json({ ok: true, id: cleanId });
  } catch (e) {
    return err(e.message, 500);
  }
}
