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
    if (!id) return err('Missing clinic id');
    const fields = [], values = [];
    if (name_zh) { fields.push('name_zh = ?'); values.push(name_zh.trim()); }
    if (name_en !== undefined) { fields.push('name_en = ?'); values.push((name_en || '').trim()); }
    if (access_code) { fields.push('access_code = ?'); values.push(access_code.trim()); }
    if (!fields.length) return err('Nothing to update');
    values.push(id);
    await env.DB.prepare(`UPDATE clinics SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 500);
  }
}
