import { json, err, verifyAdminToken } from '../../../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    if (!await verifyAdminToken(request, env)) return err('Unauthorized', 401);

    const { id, active } = await request.json();
    if (!id || active === undefined) return err('Missing fields');

    await env.DB.prepare(
      'UPDATE clinics SET active = ? WHERE id = ?'
    ).bind(active ? 1 : 0, id).run();

    return json({ ok: true });
  } catch (e) {
    return err(e.message, 500);
  }
}
