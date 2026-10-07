export type Lang = 'en' | 'es';

export interface HostingStep {
  title: string;
  body: string;
}

export interface Strings {
  title: string;
  subtitle: string;
  placeholder: string;
  send: string;
  clear: string;
  clearConfirm: string;
  thinking: string;
  thinkingMode: string;
  thinkingModeHint: string;
  errorPrefix: string;
  errorMisconfigured: string;
  emptyState: string;
  emptyStateHint: string;
  systemPrompt: string;
  footer: string;
  dismiss: string;
  about: string;
  aboutTitle: string;
  aboutClose: string;
  authorTitle: string;
  authorName: string;
  authorRole: string;
  authorEmail: string;
  authorGithub: string;
  hostingTitle: string;
  hostingIntro: string;
  hostingSteps: HostingStep[];
}

export const STRINGS: Record<Lang, Strings> = {
  en: {
    title: 'LLM Chat',
    subtitle: 'Self-hosted Qwen3-4B',
    placeholder: 'Type a message…  (Enter to send)',
    send: 'Send',
    clear: 'Clear',
    clearConfirm: 'Clear the whole conversation?',
    thinking: 'Thinking…',
    thinkingMode: 'Thinking mode',
    thinkingModeHint: 'Let the model reason before answering (slower)',
    errorPrefix: 'Something went wrong',
    errorMisconfigured:
      'The chat backend is not configured (missing LLM_TUNNEL_URL or GATEWAY_TOKEN).',
    emptyState: 'Ask anything.',
    emptyStateHint:
      'This is a window into your own model — Qwen3-4B running on your Oracle Cloud server.',
    systemPrompt: 'You are a helpful assistant. Reply in English.',
    footer: 'Qwen3-4B · llama.cpp · Oracle Cloud ARM',
    dismiss: 'Dismiss',
    about: 'About',
    aboutTitle: 'About this app',
    aboutClose: 'Close',
    authorTitle: 'Author',
    authorName: 'Jon Peciña',
    authorRole: 'AI Engineer',
    authorEmail: 'jpecina@gmail.com',
    authorGithub: 'github.com/jpecinagithub',
    hostingTitle: 'How this is hosted',
    hostingIntro:
      "This chatbot talks to a model running on Jon's own server — no third-party AI API involved. Here is the setup, step by step.",
    hostingSteps: [
      {
        title: 'The server',
        body: 'An Oracle Cloud VM running Ubuntu 24.04 on ARM (4 OCPUs, 24 GB RAM) with Docker. Everything runs CPU-only — a model this size needs no GPU.',
      },
      {
        title: 'The model',
        body: 'Qwen3-4B, quantized to Q4_K_M (`Qwen3-4B-Q4_K_M.gguf`, ~2.7 GB). It is the official GGUF build from `ggml-org/Qwen3-4B-GGUF` on Hugging Face, downloaded to `~/PROYECTOS/qwen/models`.',
      },
      {
        title: 'Inference with llama.cpp',
        body: 'The model is served by `llama.cpp` from the Docker image `ghcr.io/ggml-org/llama.cpp:server`, which exposes an OpenAI-compatible API. The container listens on loopback only (`127.0.0.1:8081`), capped at 3 CPUs / 10 GB RAM, on its own Docker network.',
      },
      {
        title: 'API gateway',
        body: 'A tiny Node.js service (`llm-gateway`, port 3902) sits in front of llama.cpp. It requires `Authorization: Bearer <GATEWAY_TOKEN>` (anything else gets a 401), appends `/no_think` automatically for fast direct answers, and streams tokens as server-sent events when the request includes `"stream": true`.',
      },
      {
        title: 'Public access via Cloudflare',
        body: 'A Cloudflare quick tunnel (`cloudflared tunnel --url http://127.0.0.1:3902`) exposes the gateway as a public `https://…trycloudflare.com` URL. Note: quick-tunnel URLs are ephemeral — they change if the tunnel restarts.',
      },
      {
        title: 'This frontend',
        body: 'Deployed on Vercel. Your browser only ever talks to `/api/chat`, a serverless function that injects the token server-side from the `GATEWAY_TOKEN` env var. The tunnel URL and the token live in the Vercel dashboard (`LLM_TUNNEL_URL` + `GATEWAY_TOKEN`) — never in the code.',
      },
    ],
  },
  es: {
    title: 'LLM Chat',
    subtitle: 'Qwen3-4B autoalojado',
    placeholder: 'Escribe un mensaje…  (Enter para enviar)',
    send: 'Enviar',
    clear: 'Limpiar',
    clearConfirm: '¿Borrar toda la conversación?',
    thinking: 'Pensando…',
    thinkingMode: 'Modo razonamiento',
    thinkingModeHint: 'Deja que el modelo razone antes de responder (más lento)',
    errorPrefix: 'Algo ha fallado',
    errorMisconfigured:
      'El backend del chat no está configurado (falta LLM_TUNNEL_URL o GATEWAY_TOKEN).',
    emptyState: 'Pregunta lo que quieras.',
    emptyStateHint:
      'Esto es una ventana a tu propio modelo — Qwen3-4B corriendo en tu servidor de Oracle Cloud.',
    systemPrompt: 'Eres un asistente útil. Responde en español.',
    footer: 'Qwen3-4B · llama.cpp · Oracle Cloud ARM',
    dismiss: 'Cerrar',
    about: 'Acerca de',
    aboutTitle: 'Acerca de esta app',
    aboutClose: 'Cerrar',
    authorTitle: 'Autor',
    authorName: 'Jon Peciña',
    authorRole: 'AI Engineer',
    authorEmail: 'jpecina@gmail.com',
    authorGithub: 'github.com/jpecinagithub',
    hostingTitle: 'Cómo está montado',
    hostingIntro:
      'Este chatbot habla con un modelo que corre en el propio servidor de Jon — sin APIs de IA de terceros. Así está montado, paso a paso.',
    hostingSteps: [
      {
        title: 'El servidor',
        body: 'Una máquina virtual de Oracle Cloud con Ubuntu 24.04 en ARM (4 OCPUs, 24 GB de RAM) y Docker. Todo corre en CPU — un modelo de este tamaño no necesita GPU.',
      },
      {
        title: 'El modelo',
        body: 'Qwen3-4B, cuantizado a Q4_K_M (`Qwen3-4B-Q4_K_M.gguf`, ~2,7 GB). Es la compilación GGUF oficial de `ggml-org/Qwen3-4B-GGUF` en Hugging Face, descargada en `~/PROYECTOS/qwen/models`.',
      },
      {
        title: 'Inferencia con llama.cpp',
        body: 'El modelo lo sirve `llama.cpp` desde la imagen Docker `ghcr.io/ggml-org/llama.cpp:server`, que expone una API compatible con OpenAI. El contenedor solo escucha en local (`127.0.0.1:8081`), limitado a 3 CPUs / 10 GB de RAM, en su propia red Docker.',
      },
      {
        title: 'Puerta de enlace (API gateway)',
        body: 'Un pequeño servicio Node.js (`llm-gateway`, puerto 3902) delante de llama.cpp. Exige `Authorization: Bearer <GATEWAY_TOKEN>` (sin él devuelve 401), añade `/no_think` automáticamente para respuestas rápidas y emite los tokens en streaming (server-sent events) cuando la petición incluye `"stream": true`.',
      },
      {
        title: 'Acceso público con Cloudflare',
        body: 'Un túnel rápido de Cloudflare (`cloudflared tunnel --url http://127.0.0.1:3902`) expone el gateway como una URL pública `https://…trycloudflare.com`. Nota: estas URLs son efímeras — cambian si el túnel se reinicia.',
      },
      {
        title: 'Este frontend',
        body: 'Desplegado en Vercel. Tu navegador solo habla con `/api/chat`, una función serverless que inyecta el token en el servidor desde la variable de entorno `GATEWAY_TOKEN`. La URL del túnel y el token viven en el panel de Vercel (`LLM_TUNNEL_URL` + `GATEWAY_TOKEN`) — nunca en el código.',
      },
    ],
  },
};
