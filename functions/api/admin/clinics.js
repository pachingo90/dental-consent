import { json, err, verifyAdminToken } from '../../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    if (!await verifyAdminToken(request, env)) return err('Unauthorized', 401);

    const result = await env.DB.prepare(
      'SELECT id, name_zh, name_en, access_code, active, created_at FROM clinics ORDER BY created_at DESC'
    ).all();

    // 附上每間診所的記錄數
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
