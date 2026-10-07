// Vercel serverless function: POST /api/chat
// Forwards the chat-completion request to Jon's self-hosted LLM gateway.
// The gateway token lives ONLY in Vercel env vars (GATEWAY_TOKEN) —
// it is never sent to, or visible in, the browser.

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { LLM_TUNNEL_URL, GATEWAY_TOKEN } = process.env;
  if (!LLM_TUNNEL_URL || !GATEWAY_TOKEN) {
    return res.status(500).json({ error: 'server_misconfigured' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'invalid_json' });
    }
  }
  if (!body || !Array.isArray(body.messages)) {
    return res.status(400).json({ error: 'messages_required' });
  }

  // Basic sanity limits (this is a personal demo, not a public API)
  const safeBody = {
    messages: body.messages.slice(-30),
    max_tokens: Math.min(Number(body.max_tokens) || 1024, 2048),
    temperature: Math.min(Math.max(Number(body.temperature) || 0.7, 0), 2),
  };

  try {
    const upstream = await fetch(`${LLM_TUNNEL_URL.replace(/\/$/, '')}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GATEWAY_TOKEN}`,
      },
      body: JSON.stringify(safeBody),
    });
    const text = await upstream.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(502).json({
      error: 'upstream_unreachable',
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
