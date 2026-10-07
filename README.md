# LLM Chat — self-hosted Qwen3-4B

A small, elegant bilingual (EN/ES) chat web app. A window into your own model:
**Qwen3-4B** running on an Oracle Cloud ARM server via `llama.cpp`, exposed through a
token-protected Node gateway with an OpenAI-compatible API.

The browser never sees the gateway token. All LLM traffic goes through a
serverless `/api/chat` function that injects the `Authorization: Bearer` header
server-side.

## Stack

- Vite + React 19 + TypeScript
- Hand-written CSS (no framework)
- `vite-plugin-pwa` (installable, offline shell)
- Vercel serverless function (`api/chat.js`, Node runtime)

## How it works

```
browser ──POST /api/chat──▶ Vercel function ──POST /v1/chat/completions──▶ Cloudflare tunnel ──▶ gateway (:3902) ──▶ llama.cpp (:8081)
                                   ▲ adds Bearer token from env
```

- The gateway (on the Oracle server) requires `Authorization: Bearer <GATEWAY_TOKEN>`
  and forwards to `llama.cpp`'s OpenAI-compatible endpoint.
- The gateway appends `/no_think` to user messages by default for fast answers.
  The **Thinking mode** toggle in the UI appends `/think` instead, letting Qwen3
  reason before answering (slower).
- **Streaming**: the UI sends `stream: true`; the gateway pipes llama.cpp's SSE
  tokens through `api/chat.js` and the UI renders them word-by-word. The
  "Thinking…" indicator shows only until the first token arrives. If the
  backend answers with plain JSON instead of SSE, the UI falls back to the
  non-streaming path.

## Environment variables

| Variable         | Where                              | Purpose                                              |
| ---------------- | ---------------------------------- | ---------------------------------------------------- |
| `LLM_TUNNEL_URL` | Vercel dashboard (and local `.env`) | Public HTTPS URL of the Cloudflare tunnel → gateway |
| `GATEWAY_TOKEN`  | Vercel dashboard (and local `.env`) | Bearer token the gateway expects                     |

Never commit real values. For local dev: `cp .env.example .env` and fill it in
(`.env` is gitignored).

## Local development

```bash
npm install
cp .env.example .env   # set LLM_TUNNEL_URL + GATEWAY_TOKEN
npm run dev            # vite proxies /api/chat -> tunnel, injecting the token
```

## Build

```bash
npm run build   # tsc + vite build, output in dist/
```

## Deploy (Vercel) — done by Jon

1. Push this repo to GitHub (already done).
2. Vercel → Add New → Project → import `llm-chat`.
3. Settings → Environment Variables → add `LLM_TUNNEL_URL` (the
   `https://…trycloudflare.com` URL from the server) and `GATEWAY_TOKEN`
   (same value as the server's `.env`). Apply to Production.
4. Deploy. Open the site and send a message.
5. Optional: enable Web Analytics in the project dashboard.

Notes:

- `vercel.json` contains an SPA rewrite that excludes `/api/*`, so the
  serverless function keeps working on refresh/direct navigation.
- The serverless function caps `max_tokens` at 2048 and keeps the last 30
  messages of history. `maxDuration` is set to 60s (long answers on CPU take a
  while).
- The Cloudflare **quick** tunnel URL changes on every restart. For a stable
  URL, use a named tunnel later.

## Project structure

```
api/chat.js        # Vercel serverless function (token injection + forwarding, SSE passthrough)
src/App.tsx        # chat UI
src/sse.ts         # SSE stream consumer (data: lines -> tokens)
src/i18n.ts        # EN/ES strings
src/types.ts       # message types
public/            # PWA icons + manifest assets
```

## Security notes

- The token is only ever in server-side env vars (Vercel dashboard, server `.env`,
  local `.env`). It never appears in code, git history, or browser traffic.
- The chat backend has no authentication of its own — anyone with the Vercel URL
  can chat (and spend your server's CPU). Fine for personal use; add auth before
  sharing publicly.
