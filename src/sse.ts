// Minimal SSE consumer for OpenAI-style chat completion streams.
// Reads `data: {...}` lines from the response body, calls onToken for each
// `choices[0].delta.content` token, and stops at `data: [DONE]`.

export interface SseDelta {
  choices?: { delta?: { content?: string } }[];
}

export async function consumeSseStream(
  res: Response,
  onToken: (token: string) => void,
): Promise<void> {
  if (!res.body) throw new Error('empty response body');
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      for (;;) {
        const nl = buffer.indexOf('\n');
        if (nl < 0) break;
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') return;
        let token = '';
        try {
          const chunk = JSON.parse(payload) as SseDelta;
          token = chunk.choices?.[0]?.delta?.content ?? '';
        } catch {
          continue; // skip malformed line
        }
        if (token) onToken(token);
      }
    }
  } finally {
    reader.releaseLock();
  }
}
