export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { name, type, date, time } = body;

    if (!name || !type || !date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Read existing records
    const existing = await env.DENTAL_KV.get('records');
    const records = existing ? JSON.parse(existing) : [];

    // Prepend new record
    records.unshift({
      id: Date.now(),
      name,
      type,
      date,
      time
    });

    // Save back to KV
    await env.DENTAL_KV.put('records', JSON.stringify(records));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
