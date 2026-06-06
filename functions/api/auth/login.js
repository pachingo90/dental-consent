import { json, err, makeToken } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { clinic_id, access_code } = await request.json();
    if (!clinic_id || !access_code) return err('Missing fields');

    const clinic = await env.DB.prepare(
      'SELECT id, name_zh, name_en FROM clinics WHERE id = ? AND access_code = ? AND active = 1'
    ).bind(clinic_id.trim().toLowerCase(), access_code.trim()).first();

    if (!clinic) return err('診所代碼或密碼錯誤', 401);

    const token = makeToken('clinic', clinic.id);
    return json({ ok: true, token, clinic });
  } catch (e) {
    return err(e.message, 500);
  }
}
