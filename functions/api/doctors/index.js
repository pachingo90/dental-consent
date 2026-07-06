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

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const clinic_id = await verifyClinic(request, env);
    if (!clinic_id) return err('Unauthorized', 401);
    const url = new URL(request.url);
    const search = url.searchParams.get('q') || '';
    let stmt;
    if (search) {
      stmt = env.DB.prepare(
        'SELECT * FROM records WHERE clinic_id = ? AND patient_name LIKE ? ORDER BY date DESC, time DESC LIMIT 200'
      ).bind(clinic_id, '%' + search + '%');
    } else {
      stmt = env.DB.prepare(
        'SELECT * FROM records WHERE clinic_id = ? ORDER BY date DESC, time DESC LIMIT 200'
      ).bind(clinic_id);
    }
    const results = await stmt.all();
    const records = (results.results || []).map(r => ({
      id: r.id, name: r.patient_name, type: r.type,
      date: r.date, time: r.time, doctor: r.doctor || '',
      relation: r.relation || '',
      teeth: JSON.parse(r.teeth || '[]'),
      checks: JSON.parse(r.checks || '[]'),
      signature: r.signature || ''
    }));
    return json(records);
  } catch (e) {
    return err(e.message, 500);
  }
}
