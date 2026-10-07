export type Lang = 'en' | 'es';

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
  },
};
