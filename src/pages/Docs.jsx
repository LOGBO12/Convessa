import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, ChevronRight, Menu, X } from 'lucide-react';

// ── Navigation structurée ──────────────────────────────────────────────────────
// Chaque item pointe vers un fichier Markdown dans /public/docs/
// et déclare ses ancres (titres h2/h3) pour la table des matières de droite.
// Les IDs d'ancres doivent correspondre EXACTEMENT à ce que slugify() produit
// à partir des titres h2/h3 des fichiers Markdown.
const NAV = [
  {
    group: 'Vue d\'ensemble',
    items: [
      {
        id: 'introduction',
        label: 'Présentation',
        file: 'introduction.md',
        anchors: [
          { id: 'ce-que-vous-pouvez-faire', label: 'Ce que vous pouvez faire' },
          { id: 'fonctionnement-general',   label: 'Fonctionnement général'   },
          { id: 'avant-de-commencer',       label: 'Avant de commencer'       },
        ],
      },
    ],
  },
  {
    group: 'Démarrage',
    items: [
      {
        id: 'obtenir-cle-api',
        label: 'Obtenir votre clé API',
        file: 'obtenir-cle-api.md',
        anchors: [
          { id: '1-creer-un-compte',         label: 'Créer un compte'          },
          { id: '2-connecter-votre-numero',  label: 'Connecter votre numéro'   },
          { id: '3-recuperer-votre-cle-api', label: 'Récupérer votre clé'      },
          { id: 'conservation-de-la-cle',    label: 'Conservation'             },
          { id: 'duree-de-validite',         label: 'Durée de validité'        },
          { id: 'renouveler-ou-revoquer',    label: 'Renouveler ou révoquer'   },
        ],
      },
      {
        id: 'integration',
        label: 'Intégration',
        file: 'integration.md',
        anchors: [
          { id: 'authentification',           label: 'Authentification'           },
          { id: 'verifier-votre-session',     label: 'Vérifier votre session'     },
          { id: 'variables-d-environnement',  label: 'Variables d\'environnement' },
          { id: 'exemples-par-langage',       label: 'Exemples par langage'       },
        ],
      },
    ],
  },
  {
    group: 'Fonctionnalités',
    items: [
      {
        id: 'envoyer-message',
        label: 'Envoi de messages',
        file: 'envoyer-message.md',
        anchors: [
          { id: 'message-texte',                        label: 'Message texte'          },
          { id: 'diffusion-a-plusieurs-destinataires',  label: 'Diffusion multiple'     },
          { id: 'envoyer-dans-un-groupe',               label: 'Envoyer dans un groupe' },
          { id: 'envoi-avec-media',                     label: 'Envoi avec média'       },
          { id: 'suivi-du-statut',                      label: 'Suivi du statut'        },
          { id: 'historique-des-envois',                label: 'Historique'             },
        ],
      },
      {
        id: 'groupes',
        label: 'Groupes WhatsApp',
        file: 'groupes.md',
        anchors: [
          { id: 'creer-un-groupe',            label: 'Créer un groupe'          },
          { id: 'lister-vos-groupes',         label: 'Lister les groupes'       },
          { id: 'detail-d-un-groupe',         label: 'Détail d\'un groupe'      },
          { id: 'lien-d-invitation',          label: 'Lien d\'invitation'       },
          { id: 'ajouter-des-participants',   label: 'Ajouter des participants' },
          { id: 'envoyer-dans-un-groupe',     label: 'Envoyer dans un groupe'   },
        ],
      },
    ],
  },
  {
    group: 'Référence',
    items: [
      {
        id: 'reference-api',
        label: 'Référence API',
        file: 'reference-api.md',
        anchors: [
          { id: 'envoi',   label: 'Envoi'   },
          { id: 'groupes', label: 'Groupes' },
          { id: 'session', label: 'Session' },
          { id: 'plans',   label: 'Plans'   },
        ],
      },
      {
        id: 'erreurs-limites',
        label: 'Erreurs et limites',
        file: 'erreurs-limites.md',
        anchors: [
          { id: 'codes-d-erreur',     label: 'Codes d\'erreur'   },
          { id: 'limites-de-debit',   label: 'Limites de débit'  },
          { id: 'limites-des-medias', label: 'Limites des médias'},
          { id: 'bonnes-pratiques',   label: 'Bonnes pratiques'  },
        ],
      },
    ],
  },
  {
    group: 'Légal',
    items: [
      {
        id: 'legal',
        label: 'Conditions d\'utilisation',
        file: 'legal.md',
        anchors: [
          { id: '2-absence-d-affiliation',   label: 'Absence d\'affiliation'  },
          { id: '3-risque-de-bannissement',  label: 'Risque de bannissement'  },
          { id: '5-usages-autorises',        label: 'Usages autorisés'        },
          { id: '6-usages-interdits',        label: 'Usages interdits'        },
        ],
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
  const location = useLocation();
  const navigate = useNavigate();

  const params      = new URLSearchParams(location.search);
  const initialId   = params.get('section') || 'introduction';
  const initialHash = location.hash.replace('#', '');

  const [activeId, setActiveId]       = useState(initialId);
  const [content, setContent]         = useState('');
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [copiedId, setCopiedId]       = useState(null);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [activeAnchor, setActiveAnchor] = useState('');

  const contentRef = useRef(null);
  const pendingScrollRef = useRef(initialHash || null);

  // ── Charger le Markdown ───────────────────────────────────────────────────

  const loadSection = useCallback(async (id) => {
    const item = findItem(id);
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/docs/${item.file}`);
      if (!res.ok) throw new Error('Document introuvable');
      setContent(await res.text());
    } catch {
      setError('Impossible de charger cette section.');
      setContent('');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Navigation ────────────────────────────────────────────────────────────

  const goTo = useCallback((id, anchor = '') => {
    setActiveId(id);
    setMobileOpen(false);
    pendingScrollRef.current = anchor || null;
    navigate(`/docs?section=${id}${anchor ? `#${anchor}` : ''}`, { replace: false });
    if (!anchor) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  // Sync avec l'URL
  useEffect(() => {
    const p    = new URLSearchParams(location.search);
    const id   = p.get('section') || 'introduction';
    const hash = location.hash.replace('#', '');
    setActiveId(id);
    pendingScrollRef.current = hash || null;
    loadSection(id);
  }, [location.search, location.hash, loadSection]);

  // Scroll vers l'ancre après le rendu du Markdown
  useEffect(() => {
    if (loading) return;
    const anchor = pendingScrollRef.current;
    if (!anchor) return;
    pendingScrollRef.current = null;
    // Petit délai pour laisser le DOM s'hydrater
    const t = setTimeout(() => {
      const el = document.getElementById(anchor);
      if (el) {
        const navH = 64;
        const top  = el.getBoundingClientRect().top + window.scrollY - navH - 24;
        window.scrollTo({ top, behavior: 'smooth' });
        setActiveAnchor(anchor);
      }
    }, 80);
    return () => clearTimeout(t);
  }, [loading]);

  // ── Surligner l'ancre active au scroll (scroll listener — plus fiable qu'IntersectionObserver) ──
  useEffect(() => {
    if (loading) return;
    const item = findItem(activeId);
    if (!item?.anchors?.length) return;

    const NAV_HEIGHT = 64 + 32; // navbar + marge

    function updateActiveAnchor() {
      // Collecte les éléments ancres présents dans le DOM
      const els = item.anchors
        .map(a => ({ id: a.id, el: document.getElementById(a.id) }))
        .filter(({ el }) => el !== null);

      if (els.length === 0) return;

      const scrollY = window.scrollY;

      // Trouve l'ancre la plus proche au-dessus de la ligne de référence
      let active = els[0].id;
      for (const { id, el } of els) {
        const top = el.getBoundingClientRect().top + scrollY - NAV_HEIGHT;
        if (top <= scrollY + 10) {
          active = id;
        }
      }

      setActiveAnchor(active);
    }

    // Initialiser immédiatement
    updateActiveAnchor();

    window.addEventListener('scroll', updateActiveAnchor, { passive: true });
    return () => window.removeEventListener('scroll', updateActiveAnchor);
  }, [activeId, content, loading]);

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
    // Blocs de code avec bouton copier
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
              title="Copier"
            >
              {copiedId === copyId ? (
                <><Check size={13} /><span>Copié</span></>
              ) : (
                <><Copy size={13} /><span>Copier</span></>
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
        <code className="bg-gray-100 text-primary-700 text-[0.8125rem] font-mono px-1.5 py-0.5 rounded">
          {children}
        </code>
      );
    },

    // Titres avec ancre cliquable
    h1: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h1 id={id} className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 pb-5 border-b border-gray-200 tracking-tight">
          {children}
        </h1>
      );
    },
    h2: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h2 id={id} className="text-xl font-semibold text-gray-900 mt-12 mb-4 scroll-mt-24 pb-2 border-b border-gray-100">
          {children}
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = slugify(String(children));
      return (
        <h3 id={id} className="text-base font-semibold text-gray-800 mt-8 mb-3 scroll-mt-24">
          {children}
        </h3>
      );
    },

    // Paragraphe
    p: ({ children }) => (
      <p className="text-gray-700 leading-relaxed mb-4 text-[0.9375rem]">{children}</p>
    ),

    // Liens
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

    // Tableaux
    table: ({ children }) => (
      <div className="overflow-x-auto my-6 rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-gray-700 border-t border-gray-100 align-top">
        {children}
      </td>
    ),

    // Blockquote
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-amber-400 bg-amber-50 text-amber-900 pl-4 pr-4 py-3 my-5 rounded-r-lg text-sm leading-relaxed">
        {children}
      </blockquote>
    ),

    // Listes
    ul: ({ children }) => <ul className="my-4 space-y-1.5 list-none pl-0">{children}</ul>,
    ol: ({ children }) => <ol className="my-4 space-y-1.5 list-decimal list-inside text-gray-700">{children}</ol>,
    li: ({ children }) => (
      <li className="flex items-start gap-2.5 text-[0.9375rem] text-gray-700">
        <span className="mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500" />
        <span>{children}</span>
      </li>
    ),

    // hr
    hr: () => <hr className="my-8 border-gray-200" />,
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  const currentItem = findItem(activeId);

  return (
    /*
     * pt-16 : compense la navbar fixe (h-16 = 64px)
     * Le wrapper extérieur est un flex-column naturel (App.jsx).
     * On utilise flex-1 pour que Docs occupe tout l'espace disponible
     * entre la Navbar et le Footer — le footer monte naturellement
     * quand on atteint la fin du contenu.
     */
    <div className="pt-16 flex-1 bg-gray-50">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0 lg:gap-8 min-h-[calc(100vh-64px)]">

          {/* ── SIDEBAR GAUCHE ──────────────────────────────────────────── */}
          {/*
           * sticky + top-16 + height calculée = défile INDÉPENDAMMENT du
           * contenu central. Quand le bas du contenu est atteint, tout
           * le layout (sidebar + contenu) est poussé vers le haut par le
           * footer qui monte — comportement "sticky until end".
           */}
          <aside
            className={`
              ${mobileOpen ? 'fixed inset-0 z-40 bg-gray-50' : 'hidden lg:block'}
              lg:w-60 xl:w-64 flex-shrink-0
              lg:sticky lg:top-16 lg:self-start lg:max-h-[calc(100vh-64px)]
              lg:overflow-y-auto lg:pb-12
            `}
          >
            {/* Bouton fermeture mobile */}
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-semibold text-gray-900">Documentation</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            <nav className="py-6 pr-4 lg:pr-2 xl:pr-4 pl-4 lg:pl-0">
              {NAV.map((group) => (
                <div key={group.group} className="mb-7">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gray-400 mb-2 px-3">
                    {group.group}
                  </p>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const isActive = item.id === activeId;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => goTo(item.id)}
                            className={`
                              w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150
                              ${isActive
                                ? 'bg-primary-50 text-primary-700 font-medium'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}
                            `}
                          >
                            {item.label}
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
            {/* Bouton menu mobile */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 transition-colors"
              >
                <Menu size={16} />
                <span>Navigation</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-4 sm:px-8 py-8 sm:py-10 lg:px-12 lg:py-12">

              {/* État chargement */}
              {loading && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-8 bg-gray-100 rounded-lg w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                  <div className="h-32 bg-gray-100 rounded-xl mt-6" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-full" />
                </div>
              )}

              {/* Erreur */}
              {!loading && error && (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-base">{error}</p>
                  <button
                    onClick={() => loadSection(activeId)}
                    className="mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {/* Contenu Markdown */}
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

              {/* Navigation prev / next */}
              {!loading && !error && (
                <div className="mt-14 pt-8 border-t border-gray-200 flex items-center justify-between gap-4">
                  {prevItem ? (
                    <button
                      onClick={() => goTo(prevItem.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all"
                    >
                      <ChevronRight size={16} className="rotate-180 flex-shrink-0" />
                      <span>{prevItem.label}</span>
                    </button>
                  ) : <div />}

                  {nextItem ? (
                    <button
                      onClick={() => goTo(nextItem.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all"
                    >
                      <span>{nextItem.label}</span>
                      <ChevronRight size={16} className="flex-shrink-0" />
                    </button>
                  ) : <div />}
                </div>
              )}
            </div>
          </main>

          {/* ── TABLE DES MATIÈRES DROITE ────────────────────────────────── */}
          {/*
           * Même logique sticky que le sidebar gauche.
           * Visible uniquement au-delà de xl (1280px).
           */}
          <aside className="hidden xl:block w-52 flex-shrink-0 sticky top-16 self-start max-h-[calc(100vh-64px)] overflow-y-auto py-8 pb-12">
            {currentItem?.anchors?.length > 0 && (
              <div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-gray-400 mb-3">
                  Sur cette page
                </p>
                <ul className="space-y-1">
                  {currentItem.anchors.map((anchor) => {
                    const isActive = activeAnchor === anchor.id;
                    return (
                      <li key={anchor.id}>
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
                              // Mettre à jour le hash dans l'URL sans navigation
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
