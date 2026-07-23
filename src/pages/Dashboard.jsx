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

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  };

  const usageColorClasses = {
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour {user?.displayName?.split(' ')[0] || 'Utilisateur'} 👋
          </h1>
          <p className="text-gray-600">Gérez votre API WhatsApp et suivez vos statistiques</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* WhatsApp Session Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <MessageCircle size={24} />
                  <span>Ma Session WhatsApp</span>
                </h2>
              </div>

              <div className="p-6">
                {sessionLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : !userSession ? (
                  <div className="text-center py-8">
                    <WifiOff className="mx-auto text-gray-400 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Aucune session connectée
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Connectez votre numéro WhatsApp pour obtenir votre clé API
                    </p>
                    <button
                      onClick={() => navigate('/sessions')}
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                    >
                      <QrCode size={20} />
                      <span>Connecter WhatsApp</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          userSession.status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="text-sm text-gray-500">Statut</p>
                          <p className="font-semibold text-gray-900">
                            {userSession.status === 'connected' ? 'Connecté' : 'Déconnecté'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Numéro</p>
                        <p className="font-semibold text-gray-900">{userSession.phone}</p>
                      </div>
                    </div>

                    {/* API Key */}
                    {userSession.status === 'connected' && userSession.apiKeyHint && (
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                            <Key size={18} className="text-purple-600" />
                            <span>Votre Clé API</span>
                          </h4>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4 border border-purple-300">
                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono text-gray-900 flex-1 mr-4">
                              {showApiKey ? userSession.apiKeyHint : `${userSession.apiKeyHint.substring(0, 12)}${'•'.repeat(24)}`}
                            </code>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title={showApiKey ? "Masquer" : "Afficher"}
                              >
                                {showApiKey ? (
                                  <EyeOff size={18} className="text-gray-600" />
                                ) : (
                                  <Eye size={18} className="text-gray-600" />
                                )}
                              </button>
                              <button
                                onClick={copyApiKey}
                                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Copier"
                              >
                                {copiedApiKey ? (
                                  <CheckCircle size={18} className="text-green-600" />
                                ) : (
                                  <Copy size={18} className="text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-600 mt-3 flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          <span>Gardez votre clé secrète. Elle a été envoyée sur votre WhatsApp.</span>
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {userSession.status !== 'connected' && (
                      <button
                        onClick={() => navigate('/sessions')}
                        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg"
                      >
                        <QrCode size={20} />
                        <span>Scanner le QR Code</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Usage Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-2">
                <BarChart3 size={24} className="text-blue-600" />
                <span>Mon Usage Ce Mois-Ci</span>
              </h2>

              <div className="space-y-6">
                {/* Messages Sent */}
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">{usage.messagesSent.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">messages envoyés</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-700">{usage.messagesLimit.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">limite mensuelle</p>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-4 rounded-full bg-gradient-to-r ${usageColorClasses[getUsageColor()]} transition-all duration-500`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    ></div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    {usage.messagesLimit - usage.messagesSent} messages restants • {getUsagePercentage().toFixed(1)}% utilisé
                  </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp size={18} className="text-green-600" />
                      <p className="text-sm text-gray-600">Taux de succès</p>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{usage.successRate}%</p>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Zap size={18} className="text-blue-600" />
                      <p className="text-sm text-gray-600">Délai moyen</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{usage.avgDeliveryTime}s</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Plan & Actions */}
          <div className="space-y-6">
            {/* Plan Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white/90">Mon Plan</h3>
                <CreditCard size={20} />
              </div>
              
              <div className="mb-6">
                <p className="text-3xl font-bold mb-1">Plan {userPlan.name}</p>
                <p className="text-white/80 text-lg">{userPlan.price}€<span className="text-sm">/mois</span></p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-2 text-white/90">
                  <CheckCircle size={16} />
                  <span className="text-sm">{userPlan.messagesLimit.toLocaleString()} messages/mois</span>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
                  <CheckCircle size={16} />
                  <span className="text-sm">Support prioritaire</span>
                </div>
                <div className="flex items-center space-x-2 text-white/90">
                  <CheckCircle size={16} />
                  <span className="text-sm">Webhooks illimités</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 text-white/80 text-sm mb-4">
                <Calendar size={14} />
                <span>Renouvellement: {new Date(userPlan.renewalDate).toLocaleDateString('fr-FR')}</span>
              </div>
              
              <button className="w-full bg-white text-purple-600 py-3 rounded-lg hover:bg-white/90 transition-all font-semibold flex items-center justify-center space-x-2">
                <ArrowUpRight size={18} />
                <span>Passer au plan Enterprise</span>
              </button>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-md border border-gray-200 p-6"
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Zap size={20} className="text-yellow-600" />
                <span>Actions Rapides</span>
              </h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/send-message')}
                  className="w-full text-left px-4 py-3 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium flex items-center space-x-3"
                >
                  <Send size={18} />
                  <span>Envoyer un message</span>
                </button>
                
                <button
                  onClick={() => navigate('/docs')}
                  className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center space-x-3"
                >
                  <FileText size={18} className="text-gray-600" />
                  <span>Documentation API</span>
                </button>
                
                <button className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center space-x-3">
                  <Clock size={18} className="text-gray-600" />
                  <span>Historique & Logs</span>
                </button>
                
                <button className="w-full text-left px-4 py-3 rounded-lg border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all flex items-center space-x-3">
                  <Bell size={18} className="text-gray-600" />
                  <span>Configurer Webhook</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
