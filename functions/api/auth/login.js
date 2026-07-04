function makeToken(type, id) {
  return btoa(`${type}:${id}:${Date.now()}`);
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' }
  });
}
function err(msg, status = 400) { return json({ error: msg }, status); }

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { clinic_id, access_code } = await request.json();
    if (!clinic_id || !access_code) return err('Missing fields');
    const row = await env.DB.prepare(
      'SELECT id, name_zh, name_en FROM clinics WHERE id = ? AND access_code = ? AND active = 1'
    ).bind(clinic_id.trim().toLowerCase(), access_code.trim()).first();
    if (!row) return err('診所代碼或密碼錯誤', 401);
    const token = makeToken('clinic', row.id);
    return json({ ok: true, token, clinic: row });
  } catch (e) {
    return err(e.message, 500);
  }
}
