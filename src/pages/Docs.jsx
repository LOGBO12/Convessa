import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronRight, Menu, X } from 'lucide-react';

// ── Navigation structurée ──────────────────────────────────────────────────────
const NAV = [
  {
    groupId: 'overview',
    group: 'Vue d\'ensemble',
    items: [
      {
        id: 'introduction',
        label: 'Présentation',
        file: 'introduction.md',
      },
    ],
  },
  {
    groupId: 'gettingStarted',
    group: 'Démarrage',
    items: [
      {
        id: 'obtenir-cle-api',
        label: 'Obtenir votre clé API',
        file: 'obtenir-cle-api.md',
      },
      {
        id: 'connecter-whatsapp',
        label: 'Connecter WhatsApp',
        file: 'connecter-whatsapp.md',
      },
      {
        id: 'integration',
        label: 'Intégration',
        file: 'integration.md',
      },
    ],
  },
  {
    groupId: 'features',
    group: 'Fonctionnalités',
    items: [
      {
        id: 'envoyer-message',
        label: 'Envoi de messages',
        file: 'envoyer-message.md',
      },
      {
        id: 'groupes',
        label: 'Groupes WhatsApp',
        file: 'groupes.md',
      },
    ],
  },
  {
    groupId: 'reference',
    group: 'Référence',
    items: [
      {
        id: 'reference-api',
        label: 'Référence API',
        file: 'reference-api.md',
      },
      {
        id: 'tarifs-et-limites',
        label: 'Tarifs et limites',
        file: 'tarifs-et-limites.md',
      },
      {
        id: 'erreurs-limites',
        label: 'Erreurs et limites',
        file: 'erreurs-limites.md',
      },
      {
        id: 'depannage-faq',
        label: 'Dépannage & FAQ',
        file: 'depannage-faq.md',
      },
    ],
  },
  {
    groupId: 'legal',
    group: 'Légal',
    items: [
      {
        id: 'legal',
        label: 'Conditions d\'utilisation',
        file: 'legal.md',
      },
    ],
  },
];

// Aplatit NAV en liste d'items pour la navigation prev/next
const ALL_ITEMS = NAV.flatMap(g => g.items);

// ── Utilitaires ───────────────────────────────────────────────────────────────

function findItem(id) {
  return ALL_ITEMS.find(i => i.id === id) ?? ALL_ITEMS[0];
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function Docs() {
  const { t, i18n } = useTranslation();
  usePageTitle('pageTitles.docs');
  const location = useLocation();
  const navigate = useNavigate();

  const params      = new URLSearchParams(location.search);
  const initialId   = params.get('section') || 'introduction';
  const initialHash = location.hash.replace('#', '');

  const [activeId, setActiveId]         = useState(initialId);
  const [content, setContent]           = useState('');
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [copiedId, setCopiedId]         = useState(null);
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [activeAnchor, setActiveAnchor] = useState('');

  const contentRef = useRef(null);
  const pendingScrollRef = useRef(initialHash || null);

  // ── Extraire les ancres réelles (H1, H2, H3) depuis le Markdown ─────────────
  const dynamicAnchors = useMemo(() => {
    if (!content) return [];
    const lines = content.split('\n');
    const anchors = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 1. Titres Markdown: # Titre, ## Titre, ### Titre
      const mdMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (mdMatch) {
        const rawText = mdMatch[2].trim().replace(/<[^>]*>/g, '').replace(/[*_~`]/g, '');
        const id = slugify(rawText);
        if (id && rawText) {
          anchors.push({ id, label: rawText, level: mdMatch[1].length });
        }
        continue;
      }

      // 2. Titres HTML: <h1...>, <h2...>, <h3...>
      const htmlMatch = line.match(/<h([1-3])(?:[^>]*id=["']([^"']+)["'])?[^>]*>(.*?)<\/h\1>/i);
      if (htmlMatch) {
        const level = parseInt(htmlMatch[1], 10);
        const rawText = htmlMatch[3].replace(/<[^>]*>/g, '').trim();
        const id = htmlMatch[2] || slugify(rawText);
        if (id && rawText) {
          anchors.push({ id, label: rawText, level });
        }
      }
    }

    return anchors;
  }, [content]);

  // ── Charger le Markdown avec Fallback Robuste ──────────────────────────────

  const loadSection = useCallback(async (id, lang) => {
    const item = findItem(id);
    setLoading(true);
    setError('');
    try {
      const path = lang === 'fr' ? `/docs/${item.file}` : `/docs/${lang}/${item.file}`;
      let res = await fetch(path);
      let text = '';
      
      if (res.ok) {
        text = await res.text();
      }

      // Si le fichier traduit n'existe pas ou si la SPA retourne index.html (fallback Vite)
      if ((!res.ok || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) && lang !== 'fr') {
        const fallbackRes = await fetch(`/docs/${item.file}`);
        if (fallbackRes.ok) {
          text = await fallbackRes.text();
        }
      }

      if (!text || text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error(t('docsPage.notFound'));
      }

      setContent(text);
    } catch {
      setError(t('docsPage.loadError'));
      setContent('');
    } finally {
      setLoading(false);
    }
  }, [t]);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goTo = useCallback((id, anchor = '') => {
    setActiveId(id);
    setMobileOpen(false);
    pendingScrollRef.current = anchor || null;
    navigate(`/docs?section=${id}${anchor ? `#${anchor}` : ''}`, { replace: false });
    if (!anchor) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  // Sync avec l'URL & Changement de langue
  useEffect(() => {
    const p    = new URLSearchParams(location.search);
    const id   = p.get('section') || 'introduction';
    const hash = location.hash.replace('#', '');
    setActiveId(id);
    pendingScrollRef.current = hash || null;
    loadSection(id, i18n.language);
  }, [location.search, location.hash, loadSection, i18n.language]);

  // Scroll vers l'ancre après le rendu du Markdown
  useEffect(() => {
    if (loading) return;
    const anchor = pendingScrollRef.current;
    if (!anchor) return;
    pendingScrollRef.current = null;
    const timer = setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) {
        const navH = 64;
        const top  = el.getBoundingClientRect().top + window.scrollY - navH - 24;
        window.scrollTo({ top, behavior: 'smooth' });
        setActiveAnchor(anchor);
      }
    }, 80);
    return () => clearTimeout(timer);
  }, [loading]);

  // ── Surligner l'ancre active au scroll ──────────────────────────────────────
  useEffect(() => {
    if (loading || !dynamicAnchors.length) return;

    const NAV_HEIGHT = 64 + 32;

    function updateActiveAnchor() {
      const els = dynamicAnchors
        .map(a => ({ id: a.id, el: document.getElementById(a.id) }))
        .filter(({ el }) => el !== null);

      if (els.length === 0) return;

      const scrollY = window.scrollY;

      let active = els[0].id;
      for (const { id, el } of els) {
        const top = el.getBoundingClientRect().top + scrollY - NAV_HEIGHT;
        if (top <= scrollY + 10) {
          active = id;
        }
      }

      setActiveAnchor(active);
    }

    updateActiveAnchor();

    window.addEventListener('scroll', updateActiveAnchor, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveAnchor);
  }, [loading, dynamicAnchors]);

  // ── Prev / Next ───────────────────────────────────────────────────────────

  const currentIndex = ALL_ITEMS.findIndex(i => i.id === activeId);
  const prevItem     = currentIndex > 0 ? ALL_ITEMS[currentIndex - 1] : null;
  const nextItem     = currentIndex < ALL_ITEMS.length - 1 ? ALL_ITEMS[currentIndex + 1] : null;

  // ── Copie de code ─────────────────────────────────────────────────────────

  const handleCopy = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // ── Rendu Markdown ────────────────────────────────────────────────────────

  const markdownComponents = {
    code({ inline, className, children }) {
      const match  = /language-(\w+)/.exec(className || '');
      const code   = String(children).replace(/\n$/, '');
      const copyId = code.slice(0, 40);

      if (!inline && match) {
        return (
          <div className="relative group my-5">
            <button
              onClick={() => handleCopy(code, copyId)}
              className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-all duration-150"
              title={t('docsPage.copyTitle')}
            >
              {copiedId === copyId ? (
                <><Check size={13} /><span>{t('docsPage.copied')}</span></>
              ) : (
                <><Copy size={13} /><span>{t('docsPage.copy')}</span></>
              )}
            </button>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              customStyle={{ borderRadius: '10px', fontSize: '0.8125rem', lineHeight: '1.65' }}
            >
              {code}
            </SyntaxHighlighter>
          </div>
        );
      }

      return (
        <code className="bg-primary-50 text-primary-700 text-sm font-mono px-2 py-1 rounded-md border border-primary-100">
          {children}
        </code>
      );
    },

    h1: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h1 id={id} className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6 pb-6 border-b-2 border-gray-200 tracking-tight leading-tight">
          {children}
        </h1>
      );
    },
    h2: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h2 id={id} className="text-2xl sm:text-3xl font-bold text-gray-900 mt-16 mb-5 scroll-mt-24 pb-3 border-b border-gray-200">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h3 id={id} className="text-xl sm:text-2xl font-semibold text-gray-800 mt-10 mb-4 scroll-mt-24">
          {children}
        </h3>
      );
    },

    p: ({ children }) => (
      <p className="text-gray-700 leading-[1.8] mb-5 text-base sm:text-lg text-justify">{children}</p>
    ),

    a: ({ children, href }) => (
      <a
        href={href}
        onClick={e => {
          if (href?.startsWith('/docs?section=')) {
            e.preventDefault();
            const id = new URLSearchParams(href.split('?')[1]).get('section');
            if (id) goTo(id);
          }
        }}
        className="text-primary-600 hover:text-primary-700 font-medium underline underline-offset-2 decoration-primary-300 hover:decoration-primary-500 transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),

    table: ({ children }) => (
      <div className="overflow-x-auto my-8 rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-base">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
    th: ({ children }) => (
      <th className="px-5 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-5 py-4 text-gray-700 border-t border-gray-100 align-top leading-relaxed">
        {children}
      </td>
    ),

    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-amber-400 bg-amber-50 text-amber-900 pl-5 pr-5 py-4 my-6 rounded-r-lg text-base leading-[1.8] text-justify">
        {children}
      </blockquote>
    ),

    ul: ({ children }) => <ul className="my-5 space-y-3 list-none pl-6">{children}</ul>,
    ol: ({ children }) => <ol className="my-5 space-y-3 list-decimal list-outside pl-6 text-gray-700 text-base sm:text-lg">{children}</ol>,
    li: ({ children, ordered }) => {
      if (ordered) {
        return (
          <li className="pl-1 text-base sm:text-lg text-gray-700 leading-[1.8]">
            <span className="leading-[1.8] text-justify">{children}</span>
          </li>
        );
      }
      return (
        <li className="relative pl-6 text-base sm:text-lg text-gray-700 leading-[1.8]">
          <span className="absolute left-0 top-[0.6em] w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
          <span className="leading-[1.8] text-justify">{children}</span>
        </li>
      );
    },

    hr: () => <hr className="my-10 border-gray-200" />,
  };

  return (
    <div className="pt-16 flex-1 bg-gray-50">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0 lg:gap-8 min-h-[calc(100vh-64px)]">

          {/* ── SIDEBAR GAUCHE ──────────────────────────────────────────── */}
          <aside
            className={`
              ${mobileOpen ? 'fixed inset-0 z-40 bg-gray-50' : 'hidden lg:block'}
              lg:w-60 xl:w-64 flex-shrink-0
              lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-64px)]
              lg:overflow-y-auto lg:pb-12
            `}
          >
            <div className="lg:hidden flex items-center justify-between p-5 border-b border-gray-200 bg-white">
              <span className="font-bold text-gray-900 text-lg">{t('docsPage.documentation')}</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={22} />
              </button>
            </div>

            <nav className="py-6 pr-4 lg:pr-2 xl:pr-4 pl-4 lg:pl-0">
              {NAV.map((group) => (
                <div key={group.groupId} className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-3">
                    {t(`docsPage.groups.${group.groupId}`, group.group)}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = item.id === activeId;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => goTo(item.id)}
                            className={`
                              w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                              ${isActive
                                ? 'bg-primary-50 text-primary-700 font-semibold shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                            `}
                          >
                            {t(`docsPage.sections.${item.id}`, item.label)}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Overlay mobile */}
          {mobileOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/30 z-30"
              onClick={() => setMobileOpen(false)}
            />
          )}

          {/* ── CONTENU CENTRAL ─────────────────────────────────────────── */}
          <main
            ref={contentRef}
            className="flex-1 min-w-0 py-8 lg:py-10"
          >
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center gap-2.5 px-5 py-3 bg-white border-2 border-gray-200 rounded-xl text-base font-semibold text-gray-700 shadow-sm hover:border-primary-300 hover:bg-primary-50 transition-all"
              >
                <Menu size={18} />
                <span>{t('docsPage.navigation')}</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 sm:px-10 py-10 sm:py-12 lg:px-14 lg:py-14 max-w-none">

              {loading && (
                <div className="space-y-5 animate-pulse">
                  <div className="h-10 bg-gray-100 rounded-lg w-2/3" />
                  <div className="h-5 bg-gray-100 rounded w-4/5" />
                  <div className="h-5 bg-gray-100 rounded w-full" />
                  <div className="h-5 bg-gray-100 rounded w-5/6" />
                  <div className="h-40 bg-gray-100 rounded-xl mt-8" />
                  <div className="h-5 bg-gray-100 rounded w-3/4" />
                  <div className="h-5 bg-gray-100 rounded w-full" />
                </div>
              )}

              {!loading && error && (
                <div className="text-center py-20 text-gray-500">
                  <p className="text-lg">{error}</p>
                  <button
                    onClick={() => loadSection(activeId, i18n.language)}
                    className="mt-6 px-6 py-3 text-base text-primary-600 hover:text-primary-700 font-semibold hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    {t('docsPage.retry')}
                  </button>
                </div>
              )}

              {!loading && !error && (
                <div className="prose-docs">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={markdownComponents}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              )}

              {!loading && !error && (
                <div className="mt-16 pt-10 border-t-2 border-gray-200 flex items-center justify-between gap-6">
                  {prevItem ? (
                    <button
                      onClick={() => goTo(prevItem.id)}
                      className="flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 border-gray-200 text-base text-gray-700 font-semibold hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all shadow-sm hover:shadow-md"
                    >
                      <ChevronRight size={18} className="rotate-180 flex-shrink-0" />
                      <span>{t(`docsPage.sections.${prevItem.id}`, prevItem.label)}</span>
                    </button>
                  ) : <div />}

                  {nextItem ? (
                    <button
                      onClick={() => goTo(nextItem.id)}
                      className="flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 border-gray-200 text-base text-gray-700 font-semibold hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all shadow-sm hover:shadow-md"
                    >
                      <span>{t(`docsPage.sections.${nextItem.id}`, nextItem.label)}</span>
                      <ChevronRight size={18} className="flex-shrink-0" />
                    </button>
                  ) : <div />}
                </div>
              )}
            </div>
          </main>

          {/* ── TABLE DES MATIÈRES DROITE (DYNAMIC TOC) ────────────────── */}
          <aside className="hidden xl:block w-52 flex-shrink-0 sticky top-16 self-start max-h-[calc(100vh-64px)] overflow-y-auto py-8 pb-12">
            {dynamicAnchors.length > 0 && (
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  {t('docsPage.onThisPage')}
                </p>
                <ul className="space-y-1">
                  {dynamicAnchors.map((anchor) => {
                    const isActive = activeAnchor === anchor.id;
                    return (
                      <li key={anchor.id} style={{ paddingLeft: anchor.level === 3 ? '0.625rem' : '0' }}>
                        <a
                          href={`#${anchor.id}`}
                          onClick={e => {
                            e.preventDefault();
                            const el = document.getElementById(anchor.id);
                            if (el) {
                              const navH = 64 + 24;
                              const top  = el.getBoundingClientRect().top + window.scrollY - navH;
                              window.scrollTo({ top, behavior: 'smooth' });
                              setActiveAnchor(anchor.id);
                              window.history.replaceState(null, '', `/docs?section=${activeId}#${anchor.id}`);
                            }
                          }}
                          className={`
                            block text-[0.8125rem] py-1 pl-3 border-l-2 transition-all duration-150
                            ${isActive
                              ? 'border-primary-500 text-primary-700 font-medium'
                              : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}
                          `}
                        >
                          {anchor.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>

        </div>
      </div>
    </div>
  );
}
