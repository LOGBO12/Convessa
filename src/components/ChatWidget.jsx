/**
 * ChatWidget.jsx — Widget de chat flottant, affiché uniquement si :
 *   1. L'utilisateur est connecté (useAuth)
 *   2. Le service chatbot répond (ping /api/v1/chatbot/health toutes les 30s)
 * Draggable, fermable, isolé du reste de l'application.
 * Les erreurs du chatbot n'affectent jamais le reste du projet.
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Minus, Copy, Check, Search, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

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

function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative my-2 max-w-full rounded-xl bg-gray-900 p-3 font-mono text-xs text-emerald-400 border border-gray-800 shadow-inner overflow-hidden">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-gray-800/90 px-2 py-1 text-[11px] font-sans font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-all shadow-xs z-10"
        aria-label="Copier le code"
      >
        {copied ? (
          <>
            <Check size={12} className="text-emerald-400" />
            <span className="text-emerald-400">Copié !</span>
          </>
        ) : (
          <>
            <Copy size={12} />
            <span>Copier</span>
          </>
        )}
      </button>
      <pre className="whitespace-pre-wrap break-all max-w-full overflow-x-auto pr-14 leading-relaxed font-mono">{code}</pre>
    </div>
  );
}

const AUTOCOMPLETE_QUESTIONS = [
  "Comment connecter mon numero WhatsApp ?",
  "Ou trouver ma cle API ?",
  "Comment envoyer un message texte ?",
  "Comment envoyer un document PDF ou une image ?",
  "Comment envoyer un message a plusieurs destinataires ?",
  "Quels sont les headers HTTP obligatoires ?",
  "Comment configurer un Webhook pour les retours d'envoi ?",
  "Quelle est la limite de destinataires par appel ?",
  "Comment révoquer ou renouveler ma clé API ?",
  "Que faire si le QR code a expiré ?",
  "Comment contacter le support technique ?",
  "Quels sont les tarifs et forfaits ?",
  "Comment creer un groupe WhatsApp ?",
  "Que signifie l'erreur 401 ?",
  "Comment suivre le statut d'un message ?",
  "Comment ajouter des membres a un groupe ?",
  "Quelles sont les limites de taille des fichiers ?",
  "Comment securiser ma cle API dans un fichier .env ?",
];

/** Normalise une chaîne : supprime accents, met en minuscule */
const normalize = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

function ChatWidgetInner() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { session } = useSession();

  // ── État principal (avec persistance sessionStorage) ──────────────────────
  const [open, setOpen]         = useState(false);
  const [minimized, setMin]     = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('convessa_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sauvegarde automatique de la discussion
  useEffect(() => {
    try {
      if (messages.length > 0) {
        sessionStorage.setItem('convessa_chat_messages', JSON.stringify(messages));
      }
    } catch {
      // Ignorer
    }
  }, [messages]);

  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);

  // ── Notifications et Proactivité ───────────────────────────────────────────
  const [hasUnread, setHasUnread]           = useState(false);
  const [showTooltip, setShowTooltip]       = useState(false);
  const [tooltipMessage, setTooltipMessage] = useState('');
  const chatOpenedOnce                      = useRef(false);

  useEffect(() => {
    if (open) {
      chatOpenedOnce.current = true;
      setHasUnread(false);
      setShowTooltip(false);
      return;
    }

    let timeout1, timeout2;

    if (!chatOpenedOnce.current) {
      // 1ère connexion : message après 5s
      timeout1 = setTimeout(() => {
        if (!open) {
          setTooltipMessage("Besoin d'aide pour demarrer avec l'API ?");
          setShowTooltip(true);
          setHasUnread(true);
        }
      }, 5000);
    } else {
      // Chat déjà fermé : inactivité longue (90s)
      timeout2 = setTimeout(() => {
        if (!open) {
          setTooltipMessage("Vous semblez chercher une information. L'assistant peut vous guider.");
          setShowTooltip(true);
          setHasUnread(true);
        }
      }, 90000);
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [open]);

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
  const dragDistance = useRef(0);

  const onMouseDown = useCallback((e) => {
    if (e.target.closest('button') && e.target.getAttribute('data-nodrag') === 'true') return;
    dragging.current = true;
    dragDistance.current = 0;
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      px: pos.x,
      py: pos.y,
    };
  }, [pos]);

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      dragDistance.current += Math.abs(dx) + Math.abs(dy);
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

  // ── Envoi du message avec Streaming & Historique ───────────────────────────
  const sendQuery = useCallback(async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    // Prépare l'historique des 6 derniers messages
    const historyPayload = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));

    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'bot', text: '' } // Message bot vide en attente des chunks
    ]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('firebaseToken');
      const res = await fetch('/api/v1/chatbot', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          lang: i18n.language,
          history: historyPayload,
          stream: true
        }),
      });

      if (!res.ok || !res.body) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'bot', text: t('chatbot.error') };
          return updated;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let streamText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkStr = decoder.decode(value, { stream: true });
        const lines = chunkStr.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (dataStr === '[DONE]') break;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                streamText += parsed.chunk;
                setMessages(prev => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  copy[lastIdx] = { ...copy[lastIdx], role: 'bot', text: streamText };
                  return copy;
                });
              }
              if (parsed.suggestions) {
                const currentSuggestions = parsed.suggestions;
                setMessages(prev => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  copy[lastIdx] = { ...copy[lastIdx], suggestions: currentSuggestions };
                  return copy;
                });
              }
            } catch {
              continue;
            }
          }
        }
      }

      if (!streamText.trim()) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'bot', text: t('chatbot.error') };
          return copy;
        });
      }
    } catch {
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: 'bot', text: t('chatbot.error') };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, i18n.language, t]);

  const sendMessage = () => sendQuery();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Formateur Markdown léger pour les réponses avec Bouton Copier ────────────
  const renderBotMessage = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let content = line;

      // Code inline, bloc inline, ou lien markdown
      const parts = content.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\))/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          const inlineCode = part.slice(1, -1);
          // Si le code contient du JSON ou une commande curl, rendu en CodeBlock
          if (inlineCode.length > 25 || inlineCode.includes('http') || inlineCode.includes('pk_convessa')) {
            return <CodeBlock key={pIdx} code={inlineCode} />;
          }
          return <code key={pIdx} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-primary-700 font-medium">{inlineCode}</code>;
        }
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          return (
            <button
              key={pIdx}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(false); navigate(linkUrl); }}
              className="inline-flex items-center gap-1.5 my-1.5 mx-0.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/60 text-primary-700 hover:from-primary-100 hover:to-primary-200/80 border border-primary-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer group"
            >
              <span>{linkText}</span>
              <span className="text-primary-600 font-bold transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </button>
          );
        }
        return part;
      });

      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 break-words [word-break:break-word]">
            <span className="text-primary-500 font-bold flex-shrink-0">•</span>
            <span className="break-words [word-break:break-word]">{renderedParts}</span>
          </div>
        );
      }
      return <div key={idx} className={line.trim() === '' ? 'h-2' : 'my-0.5 break-words [word-break:break-word]'}>{renderedParts}</div>;
    });
  };

  // ── Position du widget ─────────────────────────────────────────────────────
  const style = {
    position: 'fixed',
    bottom:   Math.max(16, 20 + pos.y),
    right:    Math.max(16, 20 + pos.x),
    zIndex:   9999,
    userSelect: dragging.current ? 'none' : 'auto',
  };

  const CHAT_SUGGESTIONS = [
    "Comment connecter WhatsApp ?",
    "Où trouver ma clé API ?",
    "Statut de ma session et quota"
  ];

  return (
    <div ref={widgetRef} style={style}>
      {/* ── Fenêtre de chat ────────────────────────────────────────────────── */}
      {open && (
        <div
          className="mb-3 flex flex-col overflow-hidden rounded-2xl border border-primary-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl transition-all"
          style={{ width: 350, height: minimized ? 'auto' : 480 }}
        >
          {/* Header — draggable */}
          <div
            className="flex items-center justify-between gap-2 bg-primary-500 px-4 py-3 cursor-grab select-none shadow-sm"
            onMouseDown={onMouseDown}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center bg-white/20 rounded h-6 w-6">
                <span className="font-bold text-white text-sm">C</span>
              </span>
              <span className="text-sm font-semibold text-white">
                Assistant Convessa
              </span>
            </div>
            <div className="flex items-center gap-1">
              {/* Réinitialiser la conversation */}
              <button
                onClick={() => {
                  setMessages([]);
                  sessionStorage.removeItem('convessa_chat_messages');
                }}
                className="rounded-md p-1 text-primary-100 hover:bg-primary-400 hover:text-white transition-colors cursor-pointer"
                title="Réinitialiser la discussion"
                aria-label="Réinitialiser la discussion"
              >
                <RotateCcw size={14} />
              </button>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/70">
                {messages.length === 0 && (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-sm text-gray-500 px-2 font-medium">
                      {t('chatbot.welcome')}
                    </p>
                    <div className="flex flex-col gap-1.5 pt-2">
                      {CHAT_SUGGESTIONS.map((sugg, i) => (
                        <button
                          key={i}
                          onClick={() => sendQuery(sugg)}
                          className="text-left text-xs bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 text-gray-700 hover:text-primary-700 px-3 py-2 rounded-xl shadow-2xs transition-all"
                        >
                          {sugg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className="space-y-2">
                    <div
                      className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <span
                        className={`inline-block max-w-[85%] break-words overflow-hidden [word-break:break-word] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.role === 'user'
                            ? 'bg-primary-500 text-white rounded-br-sm shadow-sm whitespace-pre-wrap'
                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {m.role === 'user' ? m.text : renderBotMessage(m.text)}
                      </span>
                    </div>

                    {/* Suggestions de suivi contextuelles sous la réponse du bot */}
                    {m.role === 'bot' && m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && !loading && (
                      <div className="flex flex-col gap-1.5 pl-2 pt-1 animate-in fade-in duration-300">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Suggestions :</p>
                        {m.suggestions.map((sugg, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => sendQuery(sugg)}
                            className="text-left text-xs bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 text-gray-700 hover:text-primary-700 px-3 py-1.5 rounded-xl shadow-2xs transition-all w-fit"
                          >
                            {sugg}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <span className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-400 shadow-sm">
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

              {/* Banner de Diagnostic Statut WhatsApp */}
              {session && (session.status === 'DISCONNECTED' || session.status === 'pending_qr') && (
                <div className="mx-3 my-1.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-medium truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
                    <span className="truncate">Session WhatsApp déconnectée</span>
                  </div>
                  <button
                    onClick={() => { setOpen(false); navigate('/sessions'); }}
                    className="px-2 py-1 text-[11px] font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex-shrink-0 cursor-pointer"
                  >
                    Scanner QR →
                  </button>
                </div>
              )}

              {/* Saisie & Auto-complétion */}
              <div className="relative border-t border-gray-100 bg-white px-3 py-2.5">
                {/* Menu d'auto-complétion dynamique lors de la frappe */}
                {input.trim().length >= 2 && (() => {
                  const normalizedInput = normalize(input.trim());
                  const inputWords = normalizedInput.split(/\s+/).filter(w => w.length >= 2);
                  if (inputWords.length === 0) return null;

                  // Exclure les suggestions naturelles du chat et les suggestions du dernier message bot
                  const chatSuggsNorm = new Set(CHAT_SUGGESTIONS.map(normalize));
                  const lastBotMsg = messages.length > 0 ? messages[messages.length - 1] : null;
                  const botSuggs = (lastBotMsg?.role === 'bot' && lastBotMsg?.suggestions) || [];
                  const botSuggsNorm = new Set(botSuggs.map(normalize));

                  const filtered = AUTOCOMPLETE_QUESTIONS.filter(q => {
                    const normQ = normalize(q);
                    // Ne pas proposer si identique à l'input
                    if (normQ === normalizedInput) return false;
                    // Ne pas proposer si c'est une des suggestions déjà visibles dans le chat
                    if (chatSuggsNorm.has(normQ)) return false;
                    if (botSuggsNorm.has(normQ)) return false;
                    // Chaque mot saisi doit être présent dans la question
                    return inputWords.every(w => normQ.includes(w));
                  }).slice(0, 2);

                  if (filtered.length === 0) return null;

                  return (
                    <div className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 flex flex-col gap-0.5">
                      <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Search size={10} />
                        <span>Questions suggérées</span>
                      </div>
                      {filtered.map((item, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => {
                            setInput('');
                            sendQuery(item);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{item}</span>
                          <span className="text-gray-400 text-[10px]">Cliquer</span>
                        </button>
                      ))}
                    </div>
                  );
                })()}

                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => {
                      setInput(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('chatbot.placeholder')}
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-primary-400 focus:bg-white transition-colors"
                    style={{ maxHeight: 120 }}
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
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bouton flottant et Notification (Draggable) ───────────────────────── */}
      <div 
        className="flex justify-end relative cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
      >
        {/* Infobulle de notification (Tooltip) */}
        {!open && showTooltip && (
          <div 
            className="absolute bottom-[4.5rem] right-0 mb-1 w-64 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-3.5 flex flex-col gap-2 z-50 cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ animation: 'chatTooltipIn 0.3s ease-out both' }}
            onClick={() => { setOpen(true); setHasUnread(false); setShowTooltip(false); }}
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[13px] font-medium text-gray-800 leading-snug">{tooltipMessage}</span>
              <button 
                data-nodrag="true"
                onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }} 
                className="text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-200 p-1 transition-colors flex-shrink-0"
                aria-label="Fermer"
              >
                <X size={14} />
              </button>
            </div>
            {/* Flèche vers le bouton */}
            <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
          </div>
        )}

        {/* Bouton Bulle de Discussion C */}
        <button
          onClick={() => {
            if (dragDistance.current > 5) return; // Ne pas ouvrir si on glissait le bouton
            setOpen(v => !v);
            setMin(false);
            setHasUnread(false);
            setShowTooltip(false);
          }}
          className="relative flex h-14 w-14 items-center justify-center rounded-2xl rounded-br-xs bg-primary-500 text-white shadow-xl hover:bg-primary-600 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
          aria-label="Assistant Convessa"
        >
          {!open && hasUnread && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}
          
          {open ? (
            <X size={24} />
          ) : (
            <div className="relative flex items-center justify-center">
              {/* Forme de bulle de message SVG */}
              <svg className="w-8 h-8 text-white drop-shadow-xs" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
              {/* Lettre C stylisée au centre de la bulle */}
              <span className="absolute text-primary-600 font-extrabold text-base font-sans tracking-tight mb-1" style={{ fontFamily: 'Inter, sans-serif' }}>
                C
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
