/**
 * ChatWidget.jsx — Widget de chat flottant, affiché en permanence dès que
 * l'utilisateur est connecté (useAuth). Le service chatbot peut être :
 *   - Disponible (point de statut vert) : toutes les fonctionnalités actives.
 *   - En mode limité (point de statut ambre) : les réponses FAQ (100% côté
 *     client, 0 appel réseau) restent utilisables ; les questions nécessitant
 *     le LLM affichent un message d'indisponibilité temporaire plutôt qu'un
 *     appel réseau voué à l'échec.
 * Pas de vérification périodique en arrière-plan : la disponibilité est
 * revérifiée au moment où ça compte (ouverture du panneau, tentative d'appel
 * réel), jamais en boucle silencieuse.
 * Draggable, fermable, isolé du reste de l'application.
 * Totalement multilingue (FR / EN / ES) et réactif aux changements de langue.
 * Réponses de FAQ fréquentes gérées en surface sur le Frontend (0ms latency, 0 LLM call).
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Send, Minus, Copy, Check, Search, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSession } from '../contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

export default function ChatWidget() {
  const { isAuthenticated } = useAuth();

  // Pas rendu si non connecté. Plus de blocage sur la disponibilité du
  // service : le widget reste affiché en permanence, avec un indicateur
  // d'état géré à l'intérieur (voir ChatWidgetInner).
  if (!isAuthenticated) return null;

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

/** Normalise une chaîne : supprime accents, met en minuscule */
const normalize = (s) => (s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase() : '');

/** Mots-clés pour détection d'intention (Intent Matching) instantanée en Frontend */
const INTENT_RULES = [
  {
    key: 'apiKey',
    keywords: ['cle api', 'api key', 'find api key', 'trouver ma cle', 'donde esta mi clave', 'obtener clave api', 'recuperer cle', 'cle d\'authentification']
  },
  {
    key: 'connectWhatsapp',
    keywords: ['connecter whatsapp', 'connect whatsapp', 'conectar whatsapp', 'qr code', 'scanner qr', 'scan qr', 'vincular', 'associer numero']
  },
  {
    key: 'pricing',
    keywords: ['tarif', 'tarifs', 'prix', 'forfait', 'forfaits', 'pricing', 'plan', 'planes', 'cuota', 'cost', 'abonnement']
  },
  {
    key: 'docs',
    keywords: ['documentation', 'docs', 'documentacion', 'exemples', 'examples', 'ejemplos', 'sdk', 'api rest']
  },
  {
    key: 'groups',
    keywords: ['groupe', 'groupes', 'group', 'groups', 'grupos', 'creer un groupe', 'create group']
  },
  {
    key: 'webhooks',
    keywords: ['webhook', 'webhooks', 'callback', 'notification http']
  },
  {
    key: 'mediaLimits',
    keywords: ['limite media', 'media limit', 'taille fichier', 'file size', 'limite archivo', 'pdf', 'image', 'video', 'taille des fichiers']
  },
  {
    key: 'support',
    keywords: ['support', 'contact', 'aide', 'help', 'contacto', 'soporte']
  }
];

function detectIntent(text) {
  const norm = normalize(text);
  for (const rule of INTENT_RULES) {
    if (rule.keywords.some(kw => norm.includes(normalize(kw)))) {
      return rule.key;
    }
  }
  return null;
}

// Backoff des nouvelles tentatives automatiques (mode limité, panneau ouvert) :
// 15s, 30s, 60s, 60s puis arrêt (4 essais). Constante module-level pour une
// référence stable — évite de la recréer (et donc de redéclencher l'effet
// qui l'utilise) à chaque rendu.
const RETRY_DELAYS = [15, 30, 60, 60];

function ChatWidgetInner() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { session } = useSession();

  // Questions suggérées dynamiques : objet {intentKey → text} traduit par langue active
  // Chaque suggestion porte son intentKey → zéro appel LLM au clic
  const suggestedQuestions = useMemo(() => {
    const raw = t('chatbot.suggestedQuestions', { returnObjects: true });
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      return Object.entries(raw).map(([intentKey, text]) => ({ intentKey, text }));
    }
    // Fallback si ancienne structure tableau
    if (Array.isArray(raw)) {
      return raw.map(text => ({ intentKey: null, text }));
    }
    return [];
  }, [t]);

  const defaultChatSuggestions = useMemo(() => {
    return suggestedQuestions.slice(0, 4);
  }, [suggestedQuestions]);

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

  // ── Révélation mot-par-mot (jamais d'affichage instantané d'un message bot) ─
  // Anime le DERNIER message de la liste (qui doit déjà être un placeholder
  // { role: 'bot', text: '' }) : délai de réflexion (~800-1200ms, variable
  // pour ne pas paraître mécanique) puis révélation mot par mot, vitesse
  // légèrement variable selon la longueur du mot. Utilisé pour TOUT message
  // affiché par le bot — réponse locale, mode limité, erreurs, retour en
  // ligne — pour qu'aucun message n'apparaisse jamais de façon statique.
  //
  // IMPORTANT : les champs "extraFields" (ex: intentKey) ne sont posés que
  // sur le TOUT DERNIER setMessages, une fois le texte final atteint.
  // Ne jamais les poser sur le placeholder initial dans sendQuery, sinon
  // renderBotMessage() (qui fait de la traduction réactive pour les
  // messages FAQ déjà terminés) se déclenche dès le premier mot streamé et
  // écrase le snapshot partiel par la réponse complète → effet de bloc
  // statique au lieu du mot par mot.
  const revealBotMessageWords = useCallback(async (finalText, extraFields = {}) => {
    setLoading(true);
    const thinkDelay = 800 + Math.random() * 400;
    await new Promise(r => setTimeout(r, thinkDelay));

    const words = finalText.split(' ');
    let streamed = '';
    for (let i = 0; i < words.length; i++) {
      streamed += (i === 0 ? '' : ' ') + words[i];
      const snapshot = streamed;
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { ...copy[copy.length - 1], role: 'bot', text: snapshot };
        return copy;
      });
      const delay = words[i].length > 6 ? 35 : 22;
      await new Promise(r => setTimeout(r, delay));
    }

    setMessages(prev => {
      const copy = [...prev];
      copy[copy.length - 1] = { ...copy[copy.length - 1], role: 'bot', text: finalText, ...extraFields };
      return copy;
    });
    setLoading(false);
  }, []);

  // ── Disponibilité du service (sans polling en arrière-plan) ────────────────
  // Optimiste par défaut (true) pour ne pas afficher un flash ambre avant la
  // toute première vérification — corrigé en un instant si c'est faux.
  // Revérifié : au montage, à l'ouverture du panneau, et après chaque
  // tentative réelle d'appel réseau (piggyback sur l'usage normal plutôt
  // qu'un ping dédié qui tournerait pour rien en arrière-plan).
  const [available, setAvailable]   = useState(true);
  const [justRecovered, setJustRecovered] = useState(false);
  const availableRef = useRef(true);

  const applyAvailability = useCallback((next) => {
    const wasAvailable = availableRef.current;
    availableRef.current = next;
    setAvailable(next);
    if (!wasAvailable && next) {
      // Transition indisponible -> disponible : déclenche le micro-rebond,
      // une seule fois, puis on le désarme après l'animation.
      setJustRecovered(true);
      setTimeout(() => setJustRecovered(false), 700);
    }
  }, []);

  const checkAvailability = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/chatbot/health', {
        method: 'GET',
        signal: AbortSignal.timeout(4000),
      });
      applyAvailability(res.ok);
    } catch {
      applyAvailability(false);
    }
  }, [applyAvailability]);

  // Vérification unique au montage
  useEffect(() => { checkAvailability(); }, [checkAvailability]);

  // ── Nouvelles tentatives automatiques (panneau ouvert + mode limité) ───────
  // Volontairement bornée : ça ne tourne QUE quand le panneau est ouvert et
  // le service indisponible, avec un backoff qui s'allonge (15s, 30s, 60s,
  // 60s), et s'arrête après 4 essais pour ne pas marteler un service qui a
  // une vraie panne longue sur un onglet resté ouvert. Passé ce point, le
  // comportement de base reprend (revérification à la prochaine vraie
  // interaction) — jamais de retour au polling permanent.
  const retryAttemptRef = useRef(0);
  const wasLimitedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      retryAttemptRef.current = 0;
    }
  }, [open]);

  useEffect(() => {
    if (available) {
      retryAttemptRef.current = 0;
    } else if (open) {
      wasLimitedRef.current = true;
    }
  }, [available, open]);

  useEffect(() => {
    if (available && wasLimitedRef.current) {
      wasLimitedRef.current = false;
      setMessages(prev => [...prev, { role: 'bot', text: '' }]);
      revealBotMessageWords(t('chatbot.recovered', "C'est revenu — vous pouvez reposer votre question."));
    }
  }, [available, t, revealBotMessageWords]);

  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    if (!open || available || retryAttemptRef.current >= RETRY_DELAYS.length) {
      return;
    }

    const delay = RETRY_DELAYS[retryAttemptRef.current];

    const retryTimeout = setTimeout(async () => {
      retryAttemptRef.current += 1;
      await checkAvailability();
      setRetryTick(v => v + 1); // force la ré-évaluation même si available reste false
    }, delay * 1000);

    return () => {
      clearTimeout(retryTimeout);
    };
  }, [open, available, checkAvailability, retryTick]);

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
      checkAvailability();
      return;
    }

    let timeout1, timeout2;

    if (!chatOpenedOnce.current) {
      timeout1 = setTimeout(() => {
        if (!open) {
          setTooltipMessage(t('chatbot.tooltipFirst'));
          setShowTooltip(true);
          setHasUnread(true);
        }
      }, 5000);
    } else {
      timeout2 = setTimeout(() => {
        if (!open) {
          setTooltipMessage(t('chatbot.tooltipIdle'));
          setShowTooltip(true);
          setHasUnread(true);
        }
      }, 90000);
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [open, t, checkAvailability]);

  // ── Draggable ──────────────────────────────────────────────────────────────
  const [pos, setPos]     = useState({ x: 0, y: 0 });
  const dragging          = useRef(false);
  const dragStart         = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const widgetRef         = useRef(null);
  const bottomRef         = useRef(null);
  const inputRef          = useRef(null);

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open, minimized]);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, minimized]);

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

  // ── Envoi du message avec Intent Matching Frontend & LLM Fallback ──────────
  // intentKey optionnel : si fourni (clic suggestion), réponse locale instantanée SANS LLM
  const sendQuery = useCallback(async (textToSend, intentKey = null) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    if (!textToSend) setInput('');

    // Résoudre l'intentKey : soit passé directement, soit détecté par mots-clés
    const resolvedIntent = intentKey || detectIntent(text);

    if (resolvedIntent) {
      // Ajouter message utilisateur + placeholder bot vide.
      // NB : intentKey n'est PAS posé ici volontairement — voir le
      // commentaire au-dessus de revealBotMessageWords. Il est ajouté
      // uniquement dans extraFields, donc seulement une fois le texte
      // final atteint, une fois le mot-par-mot terminé.
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        { role: 'bot', text: '' }
      ]);

      const fullAnswer = t(`chatbot.quickAnswers.${resolvedIntent}`, '');
      const followUpSuggestions = suggestedQuestions
        .filter(s => s.intentKey !== resolvedIntent)
        .slice(0, 3)
        .map(s => s.text);

      await revealBotMessageWords(fullAnswer, { intentKey: resolvedIntent, suggestions: followUpSuggestions });
      return;
    }

    // Question complexe / hors FAQ -> Appel au LLM backend
    const historyPayload = messages.slice(-6).map(m => ({ role: m.role, text: m.text }));

    setMessages(prev => [
      ...prev,
      { role: 'user', text },
      { role: 'bot', text: '' }
    ]);

    // Mode limité connu : inutile de tenter un appel voué à l'échec — on
    // répond avec un message clair (animé comme toute réponse, jamais
    // instantané), et on invite vers ce qui marche déjà (suggestions FAQ).
    if (!available) {
      await revealBotMessageWords(
        t('chatbot.limitedMode', 'Notre assistant prend une courte pause pour les questions les plus poussées. En attendant, je peux déjà vous aider sur ces sujets :'),
        { suggestions: suggestedQuestions.slice(0, 3).map(s => s.text) }
      );
      return;
    }

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
          systemHint: t('chatbot.systemHint'),
          history: historyPayload,
          stream: true
        }),
      });

      if (!res.ok || !res.body) {
        const isRateLimited = res.status === 429;
        // 429 = trop de requêtes, pas un signe d'indisponibilité du service.
        // 502/503 = le service ia ou le backend est réellement en difficulté.
        if (!isRateLimited && (res.status === 502 || res.status === 503)) {
          applyAvailability(false);
        }
        const errText = isRateLimited
          ? t('chatbot.rateLimited', 'Vous avez atteint la limite de messages. Merci de patienter une minute avant de réessayer.')
          : t('chatbot.error');
        await revealBotMessageWords(errText);
        return;
      }

      applyAvailability(true);

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
              if (parsed.sources) {
                const currentSources = parsed.sources;
                setMessages(prev => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  copy[lastIdx] = { ...copy[lastIdx], sources: currentSources };
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
        await revealBotMessageWords(t('chatbot.error'));
      }
    } catch {
      // Échec réseau complet (pas juste une réponse HTTP d'erreur) : le
      // service est probablement injoignable, on met à jour le statut.
      applyAvailability(false);
      await revealBotMessageWords(t('chatbot.error'));
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, i18n.language, t, available, applyAvailability, suggestedQuestions, revealBotMessageWords]);

  const sendMessage = () => sendQuery();

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Formateur Markdown léger & Rendu réactif au changement de langue ──────
  const renderBotMessage = (messageObj) => {
    if (!messageObj) return null;

    let text = typeof messageObj === 'string' ? messageObj : messageObj.text;

    // Traduction réactive en surface lors d'un changement de langue
    // uniquement sur les messages FAQ déjà terminés (intentKey présent)
    // Le texte streamé est déjà en cours d'écriture dans `text`, on ne le remplace pas
    if (typeof messageObj === 'object' && messageObj.intentKey && messageObj.text) {
      const translated = t(`chatbot.quickAnswers.${messageObj.intentKey}`, { defaultValue: '' });
      // On remplace seulement si la traduction est disponible (changement de langue)
      if (translated) text = translated;
    }

    if (!text) return null;
    // Couvre les deux fautes explicitement mentionnées côté prompt système
    // (Convassa ET Convaza) — l'ancien filtre ne couvrait que la première.
    const fixedText = text.replace(/Conv(?:assa|aza)/gi, 'Convessa');

    const lines = fixedText.split('\n');
    return lines.map((line, idx) => {
      const trimmedLine = line.trim();
      const bulletMatch = trimmedLine.match(/^[-*]\s+(.*)$/);
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);

      // Le contenu inline (gras, code, liens...) est extrait du texte SANS
      // le préfixe de puce/numéro, pour que ce préfixe soit rendu séparément
      // et alignement comme les puces, au lieu de rester du texte brut.
      const content = bulletMatch ? bulletMatch[1] : (numberedMatch ? numberedMatch[2] : line);

      const parts = content.split(/(\*\*.*?\*\*|`.*?`|\[.*?\]\(.*?\)|(?:\/docs\?[^\s\)`"']+|\/pricing|\/sessions|\/dashboard|\/contact|\/send-message|\/faq))/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (!part) return null;

        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
        }

        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
          const [, linkText, linkUrl] = linkMatch;
          return (
            <button
              key={pIdx}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(linkUrl); }}
              className="inline-flex items-center gap-1.5 my-1.5 mx-0.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/60 text-primary-700 hover:from-primary-100 hover:to-primary-200/80 border border-primary-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer group"
            >
              <span>{linkText}</span>
              <span className="text-primary-600 font-bold transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </button>
          );
        }

        if (part.startsWith('/docs') || part === '/pricing' || part === '/sessions' || part === '/dashboard' || part === '/contact' || part === '/send-message' || part === '/faq') {
          const cleanUrl = part.trim().replace(/[.,;:]$/, '');
          const labelMap = {
            '/pricing': t('chatbot.routes.pricing'),
            '/sessions': t('chatbot.routes.sessions'),
            '/dashboard': t('chatbot.routes.dashboard'),
            '/contact': t('chatbot.routes.contact'),
            '/send-message': t('chatbot.routes.sendMessage'),
            '/faq': t('chatbot.routes.faq'),
          };
          const label = labelMap[cleanUrl] || t('chatbot.routes.docs');
          return (
            <button
              key={pIdx}
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(cleanUrl); }}
              className="inline-flex items-center gap-1.5 my-1.5 mx-0.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/60 text-primary-700 hover:from-primary-100 hover:to-primary-200/80 border border-primary-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer group"
            >
              <span>{label}</span>
              <span className="text-primary-600 font-bold transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </button>
          );
        }

        if (part.startsWith('`') && part.endsWith('`')) {
          const inlineCode = part.slice(1, -1);
          if (inlineCode.startsWith('/docs') || inlineCode.startsWith('/pricing') || inlineCode.startsWith('/sessions')) {
            return (
              <button
                key={pIdx}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); navigate(inlineCode); }}
                className="inline-flex items-center gap-1.5 my-1.5 mx-0.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-primary-50 to-primary-100/60 text-primary-700 hover:from-primary-100 hover:to-primary-200/80 border border-primary-200/80 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 cursor-pointer group"
              >
                <span>{inlineCode}</span>
                <span className="text-primary-600 font-bold transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </button>
            );
          }
          if (inlineCode.length > 25 || inlineCode.includes('http') || inlineCode.includes('pk_convessa')) {
            return <CodeBlock key={pIdx} code={inlineCode} />;
          }
          return <code key={pIdx} className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-primary-700 font-medium">{inlineCode}</code>;
        }

        return part;
      });

      if (bulletMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 break-words [word-break:break-word]">
            <span className="text-primary-500 font-bold flex-shrink-0">•</span>
            <span className="break-words [word-break:break-word]">{renderedParts}</span>
          </div>
        );
      }

      if (numberedMatch) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5 break-words [word-break:break-word]">
            <span className="text-primary-600 font-semibold flex-shrink-0 tabular-nums">{numberedMatch[1]}.</span>
            <span className="break-words [word-break:break-word]">{renderedParts}</span>
          </div>
        );
      }

      return <div key={idx} className={trimmedLine === '' ? 'h-2' : 'my-0.5 break-words [word-break:break-word]'}>{renderedParts}</div>;
    });
  };

  const style = {
    position: 'fixed',
    bottom:   Math.max(16, 20 + pos.y),
    right:    Math.max(16, 20 + pos.x),
    zIndex:   9999,
    userSelect: dragging.current ? 'none' : 'auto',
  };

  return (
    <div ref={widgetRef} style={style}>
      {open && (
        <div
          className="mb-3 flex flex-col overflow-hidden rounded-2xl border border-primary-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-2xl transition-all"
          style={{ width: 350, height: minimized ? 'auto' : 480 }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between gap-2 bg-primary-500 px-4 py-3 cursor-grab select-none shadow-sm"
            onMouseDown={onMouseDown}
          >
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center bg-white/20 rounded h-6 w-6">
                <span className="font-bold text-white text-sm">C</span>
              </span>
              <span className="text-sm font-semibold text-white">
                {t('chatbot.title')}
              </span>
            </div>
            <div className="flex items-center gap-1">
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
              <button
                onClick={() => setMin(v => !v)}
                className="rounded-md p-1 text-primary-100 hover:bg-primary-400 hover:text-white transition-colors"
                aria-label="Réduire"
              >
                <Minus size={15} />
              </button>
              <button
                onClick={() => { setOpen(false); setMin(false); }}
                className="rounded-md p-1 text-primary-100 hover:bg-primary-400 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {!available && (
            <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-100 px-4 py-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0" aria-hidden="true" />
              <p className="text-[11px] text-amber-800 leading-snug">
                {t('chatbot.limitedBanner', 'Notre assistant répond à vos questions les plus fréquentes.')}
              </p>
            </div>
          )}

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/70">
                {messages.length === 0 && (
                  <div className="text-center py-4 space-y-3">
                    <p className="text-sm text-gray-500 px-2 font-medium">
                      {t('chatbot.status')}
                    </p>
                    <div className="flex flex-col gap-1.5 pt-2">
                      {defaultChatSuggestions.map((sugg, i) => (
                        <button
                          key={i}
                          onClick={() => sendQuery(sugg.text, sugg.intentKey)}
                          className="text-left text-xs bg-white border border-gray-200 hover:border-primary-400 hover:bg-primary-50/50 text-gray-700 hover:text-primary-700 px-3 py-2 rounded-xl shadow-2xs transition-all"
                        >
                          {sugg.text}
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
                        {m.role === 'user' ? m.text : renderBotMessage(m)}
                      </span>
                    </div>

                    {m.role === 'bot' && m.sources && m.sources.length > 0 && (
                      <p className="pl-2 text-[10px] text-gray-400 italic">
                        {t('chatbot.sourceLabel', 'Source')} : {m.sources.join(', ')}
                      </p>
                    )}

                    {m.role === 'bot' && m.suggestions && m.suggestions.length > 0 && i === messages.length - 1 && !loading && (
                      <div className="flex flex-col gap-1.5 pl-2 pt-1 animate-in fade-in duration-300">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          {t('chatbot.suggestedQuestionsTitle')}
                        </p>
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

              {/* Status Banner */}
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
                {input.trim().length >= 2 && (() => {
                  const normalizedInput = normalize(input.trim());
                  const inputWords = normalizedInput.split(/\s+/).filter(w => w.length >= 2);
                  if (inputWords.length === 0) return null;

                  const chatSuggsNorm = new Set(defaultChatSuggestions.map(s => normalize(s.text)));

                  const filtered = suggestedQuestions.filter(s => {
                    const normQ = normalize(s.text);
                    if (normQ === normalizedInput) return false;
                    if (chatSuggsNorm.has(normQ)) return false;
                    return inputWords.every(w => normQ.includes(w));
                  }).slice(0, 2);

                  if (filtered.length === 0) return null;

                  return (
                    <div className="absolute bottom-full left-2 right-2 mb-1 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 z-50 flex flex-col gap-0.5">
                      <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <Search size={10} />
                        <span>{t('chatbot.suggestedQuestionsTitle')}</span>
                      </div>
                      {filtered.map((item, fIdx) => (
                        <button
                          key={fIdx}
                          onClick={() => {
                            setInput('');
                            sendQuery(item.text, item.intentKey);
                          }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-gray-700 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-between"
                        >
                          <span className="truncate">{item.text}</span>
                          <span className="text-gray-400 text-[10px]">{t('docsPage.copy', 'Cliquer')}</span>
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

      {/* Floating button */}
      <div 
        className="flex justify-end relative cursor-grab active:cursor-grabbing select-none"
        onMouseDown={onMouseDown}
      >
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
            <div className="absolute -bottom-2 right-5 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
          </div>
        )}

        <button
          onClick={() => {
            if (dragDistance.current > 5) return;
            setOpen(v => !v);
            setMin(false);
            setHasUnread(false);
            setShowTooltip(false);
          }}
          className={`relative flex h-14 w-14 items-center justify-center rounded-2xl rounded-br-xs bg-primary-500 text-white shadow-xl hover:bg-primary-600 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 ${justRecovered ? 'animate-bounce' : ''}`}
          aria-label={available ? t('chatbot.title') : t('chatbot.titleLimited', `${t('chatbot.title')} (mode limité)`)}
          title={available ? undefined : t('chatbot.titleLimited', 'Réponses personnalisées temporairement indisponibles — FAQ toujours accessible')}
        >
          {!open && hasUnread && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 z-20">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
            </span>
          )}

          {/* Point de statut (disjoint du badge "nouveau message" ci-dessus,
              coin opposé, pour ne jamais créer d'ambiguïté). Vert = toutes
              les fonctionnalités actives. Ambre = FAQ seulement, le LLM est
              temporairement indisponible — pas "rouge = en panne", puisque
              le widget répond quand même à beaucoup de questions. */}
          <span
            className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white z-20 transition-colors duration-500 ${available ? 'bg-emerald-500' : 'bg-amber-500'}`}
            aria-hidden="true"
          />

          {open ? (
            <X size={24} />
          ) : (
            <div className="relative flex items-center justify-center">
              <svg className="w-8 h-8 text-white drop-shadow-xs" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
              </svg>
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