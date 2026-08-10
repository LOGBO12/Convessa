import { useState, useEffect } from 'react';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
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
  Infinity,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';
import { getTenantApiKey } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  usePageTitle('pageTitles.dashboard');
  const { session: userSession, loading: sessionLoading } = useUserSession();

  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

  const copyApiKey = () => {
    const fullKey = getTenantApiKey(user?.uid);
    const keyToCopy = fullKey || userSession?.apiKeyHint;
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const fullApiKey = getTenantApiKey(user?.uid);
  const displayKey = fullApiKey || userSession?.apiKeyHint || '';

  // ── Données réelles depuis la session ──────────────────────────────────────
  const usageType     = userSession?.usageType ?? 'unlimited';
  const messagesSent  = userSession?.messagesSent ?? 0;
  const messagesLimit = userSession?.messagesLimit ?? null;
  const expiresAt     = userSession?.apiKeyExpiresAt ? new Date(userSession.apiKeyExpiresAt) : null;

  const getUsagePercentage = () => {
    if (!messagesLimit || usageType !== 'requests') return 0;
    return Math.min((messagesSent / messagesLimit) * 100, 100);
  };

  const getUsageBarClass = () => {
    const pct = getUsagePercentage();
    if (pct >= 90) return 'bg-red-600';
    if (pct >= 70) return 'bg-yellow-500';
    return 'bg-green-600';
  };

  const getPlanLabel = () => {
    if (!userSession) return '—';
    if (usageType === 'unlimited') return t('dashboardPage.unlimited');
    if (usageType === 'duration' && expiresAt) {
      const remaining = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (remaining <= 0) return t('dashboardPage.expired');
      return t('dashboardPage.daysRemaining', { count: remaining });
    }
    if (usageType === 'requests' && messagesLimit !== null) {
      return t('dashboardPage.msgRemaining', { count: messagesLimit - messagesSent, formattedCount: (messagesLimit - messagesSent).toLocaleString() });
    }
    return '—';
  };

  const isExpired = () => {
    if (usageType === 'duration' && expiresAt) return expiresAt.getTime() <= Date.now();
    if (usageType === 'requests' && messagesLimit !== null) return messagesSent >= messagesLimit;
    return false;
  };

  const firstName = user?.displayName?.split(' ')[0] || t('nav.defaultUser');
  const today = new Date().toLocaleDateString(i18n.language, {
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
            <p className="text-sm font-medium text-whatsapp-dark mb-1 capitalize">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t('dashboardPage.greeting', { name: firstName })}
            </h1>
            <p className="text-gray-500 mt-1">{t('dashboardPage.subtitle')}</p>
          </div>

          {userSession?.status === 'connected' && (
            <div className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-800 self-start">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
              </span>
              {t('dashboardPage.apiActive')}
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
                <MessageCircle size={20} className="text-whatsapp-dark" />
                <h2 id="session-heading" className="text-lg font-semibold text-gray-900">
                  {t('dashboardPage.sessionTitle')}
                </h2>
              </div>

              <div className="p-6">
                {sessionLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div
                      className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"
                      role="status"
                      aria-label={t('dashboardPage.loadingSession')}
                    ></div>
                  </div>
                ) : !userSession ? (
                  <div className="text-center py-10">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                      <WifiOff className="text-gray-400" size={26} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      {t('dashboardPage.noSessionTitle')}
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm">
                      {t('dashboardPage.noSessionDesc')}
                    </p>
                    <button
                      onClick={() => navigate('/sessions')}
                      className="inline-flex items-center gap-2 bg-whatsapp-dark text-white px-5 py-2.5 rounded-lg font-medium hover:bg-whatsapp-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors"
                    >
                      <QrCode size={18} />
                      <span>{t('dashboardPage.connectWhatsapp')}</span>
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
                          <p className="text-xs text-gray-500">{t('dashboardPage.status')}</p>
                          <p className="font-semibold text-gray-900 text-sm">
                            {userSession.status === 'connected' ? t('dashboardPage.connected') : t('dashboardPage.disconnected')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{t('dashboardPage.phoneNumber')}</p>
                        <p className="font-semibold text-gray-900 text-sm">{userSession.phone}</p>
                      </div>
                    </div>

                    {/* API Key */}
                    {userSession.status === 'connected' && userSession.apiKeyHint && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                            <Key size={16} className="text-whatsapp-dark" />
                            <span>{t('dashboardPage.yourApiKey')}</span>
                          </h4>
                        </div>

                        <div className="bg-white rounded-lg p-3.5 border border-green-200">
                          <div className="flex items-center justify-between gap-3">
                            <code className="text-sm font-mono text-gray-900 flex-1 truncate">
                              {showApiKey
                                ? displayKey
                                : `${displayKey.substring(0, 20)}${'•'.repeat(16)}`}
                            </code>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 transition-colors"
                                aria-label={showApiKey ? t('dashboardPage.hideApiKey') : t('dashboardPage.showApiKey')}
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
                                aria-label={t('dashboardPage.copyApiKey')}
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
                          <ShieldCheck size={14} className="text-whatsapp-dark shrink-0 mt-0.5" />
                          <span>{t('dashboardPage.keepKeySecret')}</span>
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    {userSession.status !== 'connected' && (
                      <button
                        onClick={() => navigate('/sessions')}
                        className="w-full flex items-center justify-center gap-2 bg-whatsapp-dark text-white px-6 py-3 rounded-lg font-medium hover:bg-whatsapp-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors"
                      >
                        <QrCode size={18} />
                        <span>{t('dashboardPage.scanQrCode')}</span>
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
                <BarChart3 size={20} className="text-whatsapp-dark" />
                <h2 id="usage-heading" className="text-lg font-semibold text-gray-900">
                  {t('dashboardPage.usageTitle')}
                </h2>
              </div>

              <div className="space-y-6">
                {/* Messages Sent */}
                <div>
                  <div className="flex justify-between items-baseline mb-3">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        {messagesSent.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">{t('dashboardPage.messagesSent')}</p>
                    </div>
                    <div className="text-right">
                      {usageType === 'requests' && messagesLimit !== null ? (
                        <>
                          <p className="text-base font-semibold text-gray-700">
                            {messagesLimit.toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">{t('dashboardPage.totalQuota')}</p>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 text-whatsapp-dark">
                          <Infinity size={18} />
                          <p className="text-xs text-gray-500">{t('dashboardPage.unlimitedLower')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {usageType === 'requests' && messagesLimit !== null && (
                    <>
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
                        {t('dashboardPage.messagesRemainingPct', { count: Math.max(0, messagesLimit - messagesSent), formattedCount: Math.max(0, messagesLimit - messagesSent).toLocaleString(), pct: getUsagePercentage().toFixed(1) })}
                      </p>
                    </>
                  )}

                  {usageType === 'duration' && expiresAt && (
                    <div className={`mt-3 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                      isExpired() ? 'bg-red-50 text-red-700' : 'bg-green-50 text-whatsapp-dark'
                    }`}>
                      <Calendar size={15} />
                      <span>
                        {isExpired()
                          ? t('dashboardPage.subscriptionExpired')
                          : t('dashboardPage.expiresOn', { date: expiresAt.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-4 border-t border-gray-100">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={17} className="text-whatsapp-dark" />
                      <p className="text-sm text-gray-500">{t('dashboardPage.successRate')}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">—</p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap size={17} className="text-whatsapp-dark" />
                      <p className="text-sm text-gray-500">{t('dashboardPage.planType')}</p>
                    </div>
                    <p className="text-base font-bold text-gray-900 capitalize">
                      {usageType === 'unlimited' ? t('dashboardPage.unlimited') : usageType === 'duration' ? t('dashboardPage.duration') : t('dashboardPage.quota')}
                    </p>
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
              className={`bg-white rounded-2xl border-2 p-6 ${
                isExpired() ? 'border-red-400' : 'border-whatsapp-dark'
              }`}
              aria-labelledby="plan-heading"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 id="plan-heading" className="font-semibold text-gray-500 text-sm">
                  {t('dashboardPage.mySubscription')}
                </h3>
                <CreditCard size={20} className={isExpired() ? 'text-red-500' : 'text-whatsapp-dark'} />
              </div>

              {sessionLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-8 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : !userSession ? (
                <div className="py-4 text-center">
                  <p className="text-gray-500 text-sm">{t('dashboardPage.connectToSeePlan')}</p>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    {/* Badge type de plan */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold mb-3 ${
                      isExpired()
                        ? 'bg-red-100 text-red-700'
                        : usageType === 'unlimited'
                        ? 'bg-green-100 text-whatsapp-dark'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {usageType === 'unlimited' && <Infinity size={14} />}
                      {usageType === 'duration' && <Calendar size={14} />}
                      {usageType === 'requests' && <MessageCircle size={14} />}
                      <span>
                        {usageType === 'unlimited' ? t('dashboardPage.unlimitedBadge') : usageType === 'duration' ? t('dashboardPage.limitedDuration') : t('dashboardPage.messageQuota')}
                      </span>
                    </div>

                    <p className="text-2xl font-bold text-gray-900">{getPlanLabel()}</p>

                    {expiresAt && usageType === 'duration' && !isExpired() && (
                      <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                        <Calendar size={13} />
                        {t('dashboardPage.expiresOnFull', { date: expiresAt.toLocaleDateString(i18n.language, { day: 'numeric', month: 'long', year: 'numeric' }) })}
                      </p>
                    )}

                    {isExpired() && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                        <AlertCircle size={14} />
                        <span>{t('dashboardPage.subscriptionExpiredRenew')}</span>
                      </div>
                    )}
                  </div>

                  {/* Détails */}
                  <ul className="space-y-2.5 mb-5">
                    {usageType === 'requests' && messagesLimit !== null && (
                      <li className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckCircle size={15} className="text-whatsapp-dark shrink-0" />
                        <span>{t('dashboardPage.totalMessages', { count: messagesLimit, formattedCount: messagesLimit.toLocaleString() })}</span>
                      </li>
                    )}
                    {usageType === 'unlimited' && (
                      <li className="flex items-center gap-2 text-gray-700 text-sm">
                        <CheckCircle size={15} className="text-whatsapp-dark shrink-0" />
                        <span>{t('dashboardPage.noSendLimit')}</span>
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-gray-700 text-sm">
                      <CheckCircle size={15} className="text-whatsapp-dark shrink-0" />
                      <span>{t('dashboardPage.restApi')}</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700 text-sm">
                      <CheckCircle size={15} className="text-whatsapp-dark shrink-0" />
                      <span>{t('dashboardPage.supportIncluded')}</span>
                    </li>
                  </ul>

                  <div className="border-t border-gray-100 pt-4">
                    <button
                      onClick={() => navigate('/pricing')}
                      className={`w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                        isExpired()
                          ? 'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500'
                          : 'bg-whatsapp-dark hover:bg-whatsapp-dark text-white focus-visible:ring-green-600'
                      }`}
                    >
                      {isExpired() ? (
                        <><RefreshCw size={17} /><span>{t('dashboardPage.renewSubscription')}</span></>
                      ) : (
                        <><ArrowUpRight size={17} /><span>{t('dashboardPage.changePlan')}</span></>
                      )}
                    </button>
                  </div>
                </>
              )}
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
                <Zap size={18} className="text-whatsapp-dark" />
                <span>{t('dashboardPage.quickActions')}</span>
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/send-message')}
                  className="w-full text-left px-4 py-3 rounded-lg bg-whatsapp-dark text-white hover:bg-whatsapp-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors font-medium flex items-center gap-3"
                >
                  <Send size={17} />
                  <span>{t('dashboardPage.sendMessage')}</span>
                </button>

                {[
                  { icon: FileText, label: t('dashboardPage.apiDocs'), onClick: () => navigate('/docs') },
                  { icon: Clock, label: t('dashboardPage.historyLogs'), onClick: undefined },
                  { icon: Bell, label: t('dashboardPage.configureWebhook'), onClick: undefined },
                ].map(({ icon: Icon, label, onClick }) => (
                  <button
                    key={label}
                    onClick={onClick}
                    className="group w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-green-600 hover:bg-green-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 transition-colors flex items-center justify-between"
                  >
                    <span className="flex items-center gap-3">
                      <Icon size={17} className="text-gray-500 group-hover:text-whatsapp-dark" />
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