/**
 * ChatWidget.jsx — Widget de chat flottant, affiché uniquement si :
 *   1. L'utilisateur est connecté (useAuth)
 *   2. Le service chatbot répond (ping /api/v1/chatbot/health toutes les 30s)
 * Draggable, fermable, isolé du reste de l'application.
 * Les erreurs du chatbot n'affectent jamais le reste du projet.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, X, Send, Minus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();
  const [available, setAvailable] = useState(false);

  // Ping le backend toutes les 30s pour savoir si le chatbot est actif
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    async function check() {
      try {
        const res = await fetch('/api/v1/chatbot/health', {
          method: 'GET',
          signal: AbortSignal.timeout(4000),
        });
        if (!cancelled) setAvailable(res.ok);
      } catch {
        if (!cancelled) setAvailable(false);
      }
    }

    check();
    const interval = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  // Pas rendu si non connecté ou chatbot indisponible
  if (!isAuthenticated || !available) return null;

  return <ChatWidgetInner />;
}

function ChatWidgetInner() {
  const { t, i18n } = useTranslation();

  // ── État principal ─────────────────────────────────────────────────────────
  const [open, setOpen]         = useState(false);
  const [minimized, setMin]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Draggable ──────────────────────────────────────────────────────────────
  const [pos, setPos]     = useState({ x: 0, y: 0 }); // offset depuis bottom-right
  const dragging          = useRef(false);
  const dragStart         = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const widgetRef         = useRef(null);
  const bottomRef         = useRef(null);
  const inputRef          = useRef(null);

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, minimized]);

  // ── Draggable handlers ─────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    // Drag uniquement sur la barre de titre, pas les boutons
    if (e.target.closest('button')) return;
    dragging.current = true;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      px: pos.x,
      py: pos.y,
    };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      setPos({ x: dragStart.current.px - dx, y: dragStart.current.py - dy });
    }
    function onMouseUp() { dragging.current = false; }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // ── Envoi du message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('firebaseToken');
      const res = await fetch('/api/v1/chatbot', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: text, lang: i18n.language }),
      });
      const data = await res.json();
      const answer = data?.success ? data.answer : t('chatbot.error');
      setMessages(prev => [...prev, { role: 'bot', text: answer }]);
    } catch {
      // Erreur réseau ou service indisponible — n'affecte pas le reste de l'app
      setMessages(prev => [...prev, { role: 'bot', text: t('chatbot.error') }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, i18n.language, t]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Position du widget ─────────────────────────────────────────────────────
  const style = {
    position: 'fixed',
    bottom:   Math.max(16, 20 + pos.y),
    right:    Math.max(16, 20 + pos.x),
    zIndex:   9999,
    userSelect: dragging.current ? 'none' : 'auto',
  };

  return (
    <div ref={widgetRef} style={style}>
      {/* ── Fenêtre de chat ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="mb-3 flex flex-col overflow-hidden rounded-2xl border border-primary-100 bg-white shadow-2xl"
          style={{ width: 340, height: minimized ? 'auto' : 460 }}
        >
          {/* Header — draggable */}
          <div
            className="flex items-center justify-between gap-2 bg-primary-500 px-4 py-3 cursor-grab select-none"
            onMouseDown={onMouseDown}
          >
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-white" />
              <span className="text-sm font-semibold text-white">
                {t('chatbot.title')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Réduire */}
              <button
                onClick={() => setMin(v => !v)}
                className="rounded-md p-1 text-primary-100 hover:bg-primary-400 hover:text-white transition-colors"
                aria-label="Réduire"
              >
                <Minus size={15} />
              </button>
              {/* Fermer */}
              <button
                onClick={() => { setOpen(false); setMin(false); }}
                className="rounded-md p-1 text-primary-100 hover:bg-primary-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Corps — masqué si minimized */}
          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.length === 0 && (
                  <p className="text-center text-sm text-gray-400 mt-6">
                    {t('chatbot.welcome')}
                  </p>
                )}
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <span
                      className={`inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-primary-500 text-white rounded-br-sm'
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                      }`}
                    >
                      {m.text}
                    </span>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 shadow-sm">
                      <span className="flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Saisie */}
              <div className="flex items-end gap-2 border-t border-gray-100 bg-white px-3 py-2.5">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('chatbot.placeholder')}
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-400 focus:bg-white transition-colors"
                  style={{ maxHeight: 80 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  className="flex-shrink-0 rounded-xl bg-primary-500 p-2.5 text-white hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label={t('chatbot.send')}
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bouton flottant ────────────────────────────────────────────────── */}
      <div className="flex justify-end">
        <button
          onClick={() => { setOpen(v => !v); setMin(false); }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 hover:shadow-xl active:scale-95 transition-all duration-150"
          aria-label={t('chatbot.title')}
        >
          {open
            ? <X size={22} />
            : <MessageCircle size={24} />
          }
        </button>
      </div>
    </div>
  );
}
