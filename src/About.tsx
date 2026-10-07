import { useEffect, useRef, type ReactNode } from 'react';
import { STRINGS, type Lang } from './i18n';

// Renders `inline code` spans inside a plain string as <code> elements.
function renderInlineCode(text: string): ReactNode[] {
  return text.split('`').map((part, i) =>
    i % 2 === 1 ? <code key={i}>{part}</code> : part,
  );
}

export default function About({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = STRINGS[lang];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="about-title">{t.aboutTitle}</h2>
          <button ref={closeRef} type="button" className="ghost-btn" onClick={onClose}>
            {t.aboutClose}
          </button>
        </div>
        <div className="modal-body">
          <section aria-labelledby="about-author">
            <h3 id="about-author">{t.authorTitle}</h3>
            <p className="author-name">
              {t.authorName} <span className="author-role">— {t.authorRole}</span>
            </p>
            <p className="author-links">
              <a href={`mailto:${t.authorEmail}`}>{t.authorEmail}</a>
              <span aria-hidden="true"> · </span>
              <a
                href={`https://${t.authorGithub}`}
                target="_blank"
                rel="noreferrer"
              >
                {t.authorGithub}
              </a>
            </p>
          </section>
          <section aria-labelledby="about-hosting">
            <h3 id="about-hosting">{t.hostingTitle}</h3>
            <p>{t.hostingIntro}</p>
            <ol className="steps">
              {t.hostingSteps.map((step, i) => (
                <li key={i}>
                  <strong>{step.title}</strong>
                  <p>{renderInlineCode(step.body)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
