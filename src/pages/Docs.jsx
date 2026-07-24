import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Book, 
  Code, 
  Shield, 
  Rocket, 
  FileText, 
  Search,
  Menu,
  X,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

const Docs = () => {
  const [content, setContent] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const docSections = [
    {
      title: 'Introduction',
      icon: Book,
      items: [
        { id: 'getting-started', label: 'Démarrage Rapide', file: 'getting-started.md' },
        { id: 'api-documentation', label: 'Documentation API', file: 'api-documentation.md' },
      ]
    },
    {
      title: 'API Reference',
      icon: Code,
      items: [
        { id: 'send-message', label: 'Envoyer un Message', file: 'send-message.md' },
        { id: 'send-media', label: 'Envoyer des Médias', file: 'api-documentation.md' },
        { id: 'error-handling', label: 'Gestion des Erreurs', file: 'api-documentation.md' },
      ]
    },
    {
      title: 'Exemples de Code',
      icon: Rocket,
      items: [
        { id: 'nodejs', label: 'Node.js', file: 'api-documentation.md' },
        { id: 'python', label: 'Python', file: 'api-documentation.md' },
        { id: 'php', label: 'PHP / Laravel', file: 'api-documentation.md' },
        { id: 'java', label: 'Java / Spring', file: 'api-documentation.md' },
        { id: 'csharp', label: 'C# / .NET', file: 'api-documentation.md' },
      ]
    },
    {
      title: 'Légal & Sécurité',
      icon: Shield,
      items: [
        { id: 'legal-warnings', label: 'Avertissements Légaux', file: 'legal-warnings.md', important: true },
        { id: 'terms', label: 'Conditions d\'Utilisation', file: 'terms-of-service.md' },
      ]
    },
  ];

  useEffect(() => {
    // Charger le contenu depuis l'URL ou par défaut
    const params = new URLSearchParams(location.search);
    const section = params.get('section') || 'getting-started';
    setActiveSection(section);
    loadContent(section);
  }, [location]);

  const loadContent = async (sectionId) => {
    try {
      // Trouver le fichier correspondant à la section
      let filename = 'getting-started.md';
      
      for (const section of docSections) {
        const item = section.items.find(i => i.id === sectionId);
        if (item) {
          filename = item.file;
          break;
        }
      }
      
      const response = await fetch(`/docs/${filename}`);
      if (!response.ok) throw new Error('Document not found');
      
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error('Error loading doc:', error);
      setContent('# Erreur de chargement\n\nImpossible de charger la documentation pour cette section.');
    }
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    navigate(`/docs?section=${sectionId}`);
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 backdrop-blur-lg bg-white/80">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Convessa</span>
              <span className="text-sm text-gray-500">/ Docs</span>
            </Link>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher dans la documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-4">
              <Link
                to="/dashboard"
                className="hidden md:inline-flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <span>Dashboard</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside
            className={`${
              mobileMenuOpen ? 'block' : 'hidden'
            } md:block w-full md:w-64 flex-shrink-0`}
          >
            <nav className="sticky top-24 space-y-8">
              {docSections.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center space-x-2 text-sm font-semibold text-gray-900 mb-3">
                    <section.icon size={18} />
                    <span>{section.title}</span>
                  </div>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.id}>
                        <button
                          onClick={() => handleSectionClick(item.id)}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeSection === item.id
                              ? 'bg-primary-50 text-primary-700 font-medium'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span>{item.label}</span>
                          {item.important && (
                            <AlertTriangle size={16} className="text-yellow-500" />
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12"
            >
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-xl"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-gray-100 text-primary-600 px-2 py-1 rounded" {...props}>
                          {children}
                        </code>
                      );
                    },
                    h1: ({ children }) => (
                      <h1 className="text-4xl font-bold text-gray-900 mb-6 pb-4 border-b-2 border-gray-200">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-4">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">
                        {children}
                      </h3>
                    ),
                    a: ({ children, href }) => (
                      <a
                        href={href}
                        className="text-primary-600 hover:text-primary-700 underline"
                        target={href?.startsWith('http') ? '_blank' : undefined}
                        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-t border-gray-200">
                        {children}
                      </td>
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-primary-500 bg-primary-50 pl-4 py-2 my-4 italic">
                        {children}
                      </blockquote>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>

              {/* Navigation Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-center">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <ChevronRight size={20} className="rotate-180" />
                  <span>Page précédente</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                  <span>Page suivante</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>

            {/* Table of Contents - Right Sidebar */}
            <aside className="hidden xl:block w-64 flex-shrink-0 ml-8">
              <div className="sticky top-24">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Sur cette page</h4>
                <ul className="space-y-2 text-sm">
                  <li>
                    <a href="#" className="text-primary-600 hover:text-primary-700">
                      Introduction
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      Démarrage Rapide
                    </a>
                  </li>
                  <li>
                    <a href="#" className="text-gray-600 hover:text-gray-900">
                      Authentification
                    </a>
                  </li>
                </ul>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Docs;
