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

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const clinic_id = await verifyClinic(request, env);
    if (!clinic_id) return err('Unauthorized', 401);
    const { name, type, date, time, doctor, relation, teeth, checks, signature } = await request.json();
    if (!name || !type || !date) return err('Missing required fields');
    const now = new Date().toISOString();
    await env.DB.prepare(
      'INSERT INTO records (clinic_id, patient_name, type, date, time, doctor, relation, teeth, checks, signature, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      clinic_id, name, type, date, time || '',
      doctor || '', relation || '',
      JSON.stringify(teeth || []),
      JSON.stringify(checks || []),
      signature || '', now
    ).run();
    return json({ ok: true });
  } catch (e) {
    return err(e.message, 500);
  }
}
