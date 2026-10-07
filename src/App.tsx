import { useCallback, useEffect, useRef, useState } from 'react';
import { STRINGS, type Lang } from './i18n';
import About from './About';
import { consumeSseStream } from './sse';
import type { ChatMessage } from './types';

const LS_MESSAGES = 'llm-chat:messages:v1';
const LS_LANG = 'llm-chat:lang';
const LS_THINKING = 'llm-chat:thinking';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type ChatError =
  | { kind: 'http'; status: number; detail?: string }
  | { kind: 'misconfigured' }
  | { kind: 'generic'; message: string };

function errorText(e: ChatError, t: (typeof STRINGS)['en']): string {
  switch (e.kind) {
    case 'misconfigured':
      return t.errorMisconfigured;
    case 'http':
      return `${t.errorPrefix} (HTTP ${e.status}${e.detail ? `: ${e.detail}` : ''})`;
    case 'generic':
      return e.message;
  }
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LS_MESSAGES);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() =>
    localStorage.getItem(LS_LANG) === 'es' ? 'es' : 'en',
  );
  const [thinkingMode, setThinkingMode] = useState<boolean>(
    () => localStorage.getItem(LS_THINKING) === '1',
  );
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [draft, setDraft] = useState('');
  const [waiting, setWaiting] = useState(false);
  const [streamed, setStreamed] = useState(false); // first token arrived
  const [error, setError] = useState<ChatError | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const waitingRef = useRef(false);

  const t = STRINGS[lang];

  useEffect(() => {
    localStorage.setItem(LS_LANG, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem(LS_THINKING, thinkingMode ? '1' : '0');
  }, [thinkingMode]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_MESSAGES, JSON.stringify(messages));
    } catch {
      /* storage full — ignore */
    }
  }, [messages]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || waitingRef.current) return;
    waitingRef.current = true;
    setWaiting(true);
    setStreamed(false);
    setError(null);
    setDraft('');

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, ts: Date.now() };
    const history = [...messages, userMsg];
    setMessages(history);

    // Placeholder for the assistant reply; tokens are appended as they stream in.
    const assistantId = uid();
    let firstTokenSeen = false;

    try {
      const apiMessages = [
        { role: 'system' as const, content: STRINGS[lang].systemPrompt },
        ...history.map((m) => ({ role: m.role, content: m.content })),
      ];
      // Thinking mode: let Qwen3 reason first (/think). Otherwise the gateway
      // already appends /no_think for fast direct answers.
      if (thinkingMode) {
        const last = apiMessages[apiMessages.length - 1];
        if (last && last.role === 'user' && !last.content.includes('/think')) {
          last.content += ' /think';
        }
      }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          max_tokens: 1024,
          temperature: 0.7,
          stream: true,
        }),
      });
      if (!res.ok) {
        let detail: string | undefined;
        try {
          const errJson = (await res.json()) as { error?: string };
          detail = errJson.error || undefined;
        } catch {
          /* ignore */
        }
        if (res.status === 500) {
          // api/chat.js only returns 500 when env vars are missing
          throw { kind: 'misconfigured' } as ChatError;
        }
        throw { kind: 'http', status: res.status, detail } as ChatError;
      }

      const contentType = res.headers.get('content-type') ?? '';
      if (!contentType.includes('text/event-stream') || !res.body) {
        // Fallback: the backend answered with a complete JSON body (non-streaming).
        const data = (await res.json()) as {
          choices?: { message?: { content?: string; reasoning_content?: string } }[];
        };
        const content =
          data.choices?.[0]?.message?.content ??
          data.choices?.[0]?.message?.reasoning_content ??
          '';
        setMessages((prev) => [
          ...prev,
          {
            id: assistantId,
            role: 'assistant',
            content: content.trim() || '…',
            ts: Date.now(),
          },
        ]);
        return;
      }

      // Streaming path: show the bubble immediately and append tokens live.
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', ts: Date.now() },
      ]);
      const appendToken = (token: string) => {
        if (!firstTokenSeen) {
          firstTokenSeen = true;
          setStreamed(true);
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: m.content + token } : m,
          ),
        );
      };
      await consumeSseStream(res, appendToken);
      // If the stream ended with no content at all, show a placeholder.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && !m.content.trim() ? { ...m, content: '…' } : m,
        ),
      );
    } catch (e) {
      if (e && typeof e === 'object' && 'kind' in e) {
        setError(e as ChatError);
      } else {
        setError({
          kind: 'generic',
          message: e instanceof Error ? e.message : STRINGS[lang].errorPrefix,
        });
      }
    } finally {
      waitingRef.current = false;
      setWaiting(false);
      inputRef.current?.focus();
    }
  }, [draft, messages, lang, thinkingMode]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const clearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm(t.clearConfirm)) setMessages([]);
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <button
            type="button"
            className="brand-avatar"
            onClick={() => setAboutOpen(true)}
            title={t.about}
            aria-label={t.about}
          >
            <img src="/author.jpg" alt={t.authorPhotoAlt} width={34} height={34} />
          </button>
          <div>
            <h1>{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
        </div>
        <div className="controls">
          <label className="toggle" title={t.thinkingModeHint}>
            <input
              type="checkbox"
              checked={thinkingMode}
              onChange={(e) => setThinkingMode(e.target.checked)}
            />
            <span>{t.thinkingMode}</span>
          </label>
          <div className="lang-toggle" role="group" aria-label="Language / Idioma">
            {(['en', 'es'] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                className={lang === l ? 'active' : ''}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button type="button" className="ghost-btn" onClick={() => setAboutOpen(true)}>
            {t.about}
          </button>
          <button type="button" className="ghost-btn" onClick={clearChat}>
            {t.clear}
          </button>
        </div>
      </header>

      <main className="chat" ref={listRef} aria-live="polite">
        {messages.length === 0 && !waiting && (
          <div className="empty">
            <div className="empty-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5z" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="empty-title">{t.emptyState}</p>
            <p className="empty-hint">{t.emptyStateHint}</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            <div className="bubble">{m.content}</div>
          </div>
        ))}
        {waiting && !streamed && (
          <div className="msg assistant">
            <div className="bubble thinking" aria-label={t.thinking}>
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        )}
      </main>

      {error && (
        <div className="errorbar" role="alert">
          <span>{errorText(error, t)}</span>
          <button type="button" onClick={() => setError(null)}>
            {t.dismiss}
          </button>
        </div>
      )}

      <footer className="composer-wrap">
        <div className="composer">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t.placeholder}
            rows={1}
            aria-label={t.title}
          />
          <button
            type="button"
            className="send-btn"
            onClick={() => void send()}
            disabled={!draft.trim() || waiting}
            aria-label={t.send}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 19V5m-7 7 7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <p className="foot">{t.footer}</p>
      </footer>

      {aboutOpen && <About lang={lang} onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
