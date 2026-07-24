import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Key,
  MessageCircle,
  BarChart3,
  Copy,
  Eye,
  EyeOff,
  CheckCircle,
  WifiOff,
  QrCode,
  Send,
  FileText,
  Zap,
  TrendingUp,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Bell,
  Clock,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { session: userSession, loading: sessionLoading } = useUserSession();

  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  // Mock data pour l'usage et le plan (à remplacer par les vraies données API)
  const userPlan = {
    name: 'Pro',
    price: 29,
    messagesLimit: 5000,
    renewalDate: '2026-03-15',
  };

  const usage = {
    messagesSent: 847,
    messagesLimit: userPlan.messagesLimit,
    successRate: 98.5,
    avgDeliveryTime: 1.2,
  };

  const copyApiKey = () => {
    if (userSession?.apiKeyHint) {
      navigator.clipboard.writeText(userSession.apiKeyHint);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const getUsagePercentage = () => {
    return Math.min((usage.messagesSent / usage.messagesLimit) * 100, 100);
  };

  // Une seule famille de couleur (vert) : on encode l'urgence par l'intensité,
  // pas par une nouvelle teinte, sauf pour l'état réellement critique (>=90%).
  const getUsageBarClass = () => {
    const pct = getUsagePercentage();
    if (pct >= 90) return 'bg-red-600';
    if (pct >= 70) return 'bg-green-500';
    return 'bg-green-600';
  };

  const firstName = user?.displayName?.split(' ')[0] || 'Utilisateur';
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200 pb-6"
        >
          <div>
            <p className="text-sm font-medium text-green-700 mb-1 capitalize">{today}</p>
            <h1 className="text-3xl font-bold text-gray-900">
              Bonjour {firstName}
            </h1>
            <p className="text-gray-500 mt-1">Gérez votre API WhatsApp et suivez vos statistiques</p>
          </div>

          {userSession?.status === 'connected' && (
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 self-start">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              API active
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* WhatsApp Session Card */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
              className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
              aria-labelledby="session-heading"
            >
              <div className="border-b border-gray-100 px-6 py-4 flex items-center gap-2">
                <MessageCircle size={20} className="text-green-700" />
                <h2 id="session-heading" className="text-lg font-semibold text-gray-900">
                  Ma session WhatsApp
                </h2>
              </div>

              <div className="p-6">
                {sessionLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div
                      className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"
                      role="status"
                      aria-label="Chargement de la session"
                    ></div>
                  </div>
                ) : !userSession ? (
                  <div className="text-center py-10">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                      <WifiOff className="text-gray-400" size={26} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Aucune session connectée
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
                      Scannez un QR code pour lier votre numéro WhatsApp et générer votre clé API.
                    </p>
                    <button
                      onClick={() => navigate('/sessions')}
                      className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors"
                    >
                      <QrCode size={18} />
                      <span>Connecter WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            userSession.status === 'connected' ? 'bg-green-600' : 'bg-red-500'
                          }`}
                          aria-hidden="true"
                        ></span>
                        <div>
                          <p className="text-xs text-gray-500">Statut</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {userSession.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Numéro</p>
                        <p className="font-semibold text-gray-900 text-sm">{userSession.phone}</p>
                      </div>
                    </div>

                    {/* API Key */}
                    {userSession.status === 'connected' && userSession.apiKeyHint && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <Key size={16} className="text-green-700" />
                            <span>Votre clé API</span>
                          </h4>
                        </div>

                        <div className="bg-white rounded-lg p-3.5 border border-green-200">
                          <div className="flex items-center justify-between gap-3">
                            <code className="text-sm font-mono text-gray-900 flex-1 truncate">
                              {showApiKey
                                ? userSession.apiKeyHint
                                : `${userSession.apiKeyHint.substring(0, 12)}${'•'.repeat(24)}`}
                            </code>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 transition-colors"
                                aria-label={showApiKey ? 'Masquer la clé API' : 'Afficher la clé API'}
                              >
                                {showApiKey ? (
                                  <EyeOff size={17} className="text-gray-600" />
                                ) : (
                                  <Eye size={17} className="text-gray-600" />
                                )}
                              </button>
                              <button
                                onClick={copyApiKey}
                                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 transition-colors"
                                aria-label="Copier la clé API"
                              >
                                {copiedApiKey ? (
                                  <CheckCircle size={17} className="text-green-600" />
                                ) : (
                                  <Copy size={17} className="text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-gray-600 mt-3 flex items-start gap-1.5">
                          <ShieldCheck size={14} className="text-green-700 shrink-0 mt-0.5" />
                          <span>Gardez votre clé secrète. Elle a aussi été envoyée sur votre WhatsApp.</span>
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {userSession.status !== 'connected' && (
                      <button
                        onClick={() => navigate('/sessions')}
                        className="w-full flex items-center justify-center gap-2 bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors"
                      >
                        <QrCode size={18} />
                        <span>Scanner le QR code</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.section>

            {/* Usage Statistics */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.35 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
              aria-labelledby="usage-heading"
            >
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 size={20} className="text-green-700" />
                <h2 id="usage-heading" className="text-lg font-semibold text-gray-900">
                  Mon usage ce mois-ci
                </h2>
              </div>

              <div className="space-y-6">
                {/* Messages Sent */}
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {usage.messagesSent.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">messages envoyés</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-gray-700">
                        {usage.messagesLimit.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">limite mensuelle</p>
                    </div>
                  </div>

                  <div
                    className="w-full bg-gray-100 rounded-full h-3 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={Math.round(getUsagePercentage())}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={`h-3 rounded-full ${getUsageBarClass()} transition-all duration-500`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    ></div>
                  </div>

                  <p className="text-sm text-gray-500 mt-2">
                    {usage.messagesLimit - usage.messagesSent} messages restants · {getUsagePercentage().toFixed(1)}% utilisé
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={17} className="text-green-700" />
                      <p className="text-sm text-gray-500">Taux de succès</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{usage.successRate}%</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={17} className="text-green-700" />
                      <p className="text-sm text-gray-500">Délai moyen</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{usage.avgDeliveryTime}s</p>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>

          {/* Right Column - Plan & Actions */}
          <div className="space-y-6">
            {/* Plan Card */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.35 }}
              className="bg-white rounded-2xl border-2 border-green-700 p-6"
              aria-labelledby="plan-heading"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="plan-heading" className="font-semibold text-gray-500 text-sm">
                  Mon plan
                </h3>
                <CreditCard size={20} className="text-green-700" />
              </div>

              <div className="mb-6">
                <p className="text-3xl font-bold text-gray-900 mb-1">Plan {userPlan.name}</p>
                <p className="text-gray-500 text-lg">
                  {userPlan.price}€<span className="text-sm">/mois</span>
                </p>
              </div>

              <ul className="space-y-2.5 mb-6">
                <li className="flex items-center gap-2 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-green-700 shrink-0" />
                  <span>{userPlan.messagesLimit.toLocaleString()} messages/mois</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-green-700 shrink-0" />
                  <span>Support prioritaire</span>
                </li>
                <li className="flex items-center gap-2 text-gray-700 text-sm">
                  <CheckCircle size={16} className="text-green-700 shrink-0" />
                  <span>Webhooks illimités</span>
                </li>
              </ul>

              <div className="flex items-center gap-2 text-gray-500 text-xs mb-4 pt-4 border-t border-gray-100">
                <Calendar size={14} />
                <span>Renouvellement le {new Date(userPlan.renewalDate).toLocaleDateString('fr-FR')}</span>
              </div>

              <button className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors font-medium flex items-center justify-center gap-2">
                <ArrowUpRight size={18} />
                <span>Passer au plan Enterprise</span>
              </button>
            </motion.section>

            {/* Quick Actions */}
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.35 }}
              className="bg-white rounded-2xl border border-gray-200 p-6"
              aria-labelledby="actions-heading"
            >
              <h3 id="actions-heading" className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
                <Zap size={18} className="text-green-700" />
                <span>Actions rapides</span>
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/send-message')}
                  className="w-full text-left px-4 py-3 rounded-lg bg-green-700 text-white hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors font-medium flex items-center gap-3"
                >
                  <Send size={17} />
                  <span>Envoyer un message</span>
                </button>

                {[
                  { icon: FileText, label: 'Documentation API', onClick: () => navigate('/docs') },
                  { icon: Clock, label: 'Historique & logs', onClick: undefined },
                  { icon: Bell, label: 'Configurer un webhook', onClick: undefined },
                ].map(({ icon: Icon, label, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="group w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-green-600 hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} className="text-gray-500 group-hover:text-green-700" />
                      <span className="text-gray-700 group-hover:text-gray-900 text-sm">{label}</span>
                    </span>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-green-600" />
                  </button>
                ))}
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;