import { json, err, verifyClinicToken } from '../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const clinic_id = await verifyClinicToken(request, env);
    if (!clinic_id) return err('Unauthorized', 401);

    const { name, type, date, time, doctor, relation, teeth, checks, signature } = await request.json();
    if (!name || !type || !date) return err('Missing required fields');

    const now = new Date().toISOString();
    await env.DB.prepare(`
      INSERT INTO records (clinic_id, patient_name, type, date, time, doctor, relation, teeth, checks, signature, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
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
