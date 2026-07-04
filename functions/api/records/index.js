import { json, err, verifyClinicToken } from '../../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const clinic_id = await verifyClinicToken(request, env);
    if (!clinic_id) return err('Unauthorized', 401);

    const url = new URL(request.url);
    const search = url.searchParams.get('q') || '';

    let stmt, results;
    if (search) {
      stmt = env.DB.prepare(
        'SELECT * FROM records WHERE clinic_id = ? AND patient_name LIKE ? ORDER BY date DESC, time DESC LIMIT 200'
      ).bind(clinic_id, '%' + search + '%');
    } else {
      stmt = env.DB.prepare(
        'SELECT * FROM records WHERE clinic_id = ? ORDER BY date DESC, time DESC LIMIT 200'
      ).bind(clinic_id);
    }
    results = await stmt.all();

    const records = (results.results || []).map(r => ({
      id:           r.id,
      name:         r.patient_name,
      type:         r.type,
      date:         r.date,
      time:         r.time,
      doctor:       r.doctor || '',
      relation:     r.relation || '',
      teeth:        JSON.parse(r.teeth || '[]'),
      checks:       JSON.parse(r.checks || '[]'),
      signature:    r.signature || ''
    }));

    return json(records);
  } catch (e) {
    return err(e.message, 500);
  }
}
