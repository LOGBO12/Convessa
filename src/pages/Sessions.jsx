import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  CheckCircle,
  Loader,
  QrCode,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
  Clock,
  Copy,
  Eye,
  EyeOff,
  XCircle,
  Key,
  X,
} from 'lucide-react';
import { tenantsAPI, saveTenantApiKey, getTenantApiKey } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';
import {
  connectSocket,
  onTenantConnected,
  onTenantQR,
  onTenantError,
} from '../services/socket';

const Sessions = () => {
  const { user } = useAuth();
  const { session: userSession, loading: sessionLoading, refresh: refreshSession } = useUserSession();
  
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [pollingStatus, setPollingStatus] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  // Modal clé API après connexion réussie
  const [apiKeyModal, setApiKeyModal] = useState(null); // { key, hint, expiresAt } | null
  const [apiKeyModalCopied, setApiKeyModalCopied] = useState(false);
  const [errorFromSocket, setErrorFromSocket] = useState('');
  const [phoneInputValue, setPhoneInputValue] = useState(() => {
    if (!user?.uid) return '';
    return localStorage.getItem(`wa_phone_${user.uid}`) ?? '';
  });

  // Ref pour avoir accès au tenantId courant dans les callbacks socket
  // sans recréer les listeners à chaque render
  const activeTenantIdRef = useRef(null);
  // Ref pour avoir accès au user.uid dans les callbacks socket (stable)
  const userUidRef = useRef(user?.uid ?? null);

  useEffect(() => {
    activeTenantIdRef.current = userSession?.tenantId ?? null;
  }, [userSession?.tenantId]);

  useEffect(() => {
    userUidRef.current = user?.uid ?? null;
  }, [user?.uid]);

  // Si pas de session et qu'un numéro est sauvegardé pour cet utilisateur,
  // afficher directement le formulaire pré-rempli.
  // Si une session existe, s'assurer que le formulaire est caché.
  useEffect(() => {
    if (sessionLoading) return; // attendre la fin du chargement
    if (userSession) {
      // Session active → masquer le formulaire de saisie
      setShowPhoneInput(false);
    } else if (user?.uid) {
      // Pas de session → pré-remplir avec le numéro sauvegardé
      const saved = localStorage.getItem(`wa_phone_${user.uid}`);
      if (saved) {
        setPhoneInputValue(saved);
        setShowPhoneInput(true);
      }
    }
  }, [sessionLoading, userSession, user?.uid]);

  // Au chargement : si session connectée et pas de clé en localStorage → la récupérer depuis le backend
  useEffect(() => {
    if (!userSession || userSession.status !== 'connected' || !user?.uid) return;
    const existing = getTenantApiKey(user.uid);
    if (!existing) {
      // La clé n'est pas en localStorage → la récupérer via l'API
      tenantsAPI.getApiKey(userSession.tenantId)
        .then(res => {
          if (res.apiKey) {
            saveTenantApiKey(user.uid, res.apiKey);
          }
        })
        .catch(err => console.warn('Impossible de récupérer la clé API:', err));
    }
  }, [userSession, user?.uid]);
  useEffect(() => {
    connectSocket();

    const unsubConnected = onTenantConnected((data) => {
      console.log('[Socket] tenant_connected', data);
      const currentId = activeTenantIdRef.current;
      if (!currentId || data.tenantId === currentId) {
        setShowQRModal(false);
        setPollingStatus(false);
        // Sauvegarder la clé API en localStorage
        if (data.apiKey && userUidRef.current) {
          saveTenantApiKey(userUidRef.current, data.apiKey);
        }
        // Ouvrir le modal clé API si la clé est dans l'event
        if (data.apiKey || data.apiKeyHint) {
          setApiKeyModal({
            key:       data.apiKey ?? null,
            hint:      data.apiKeyHint ?? null,
            expiresAt: data.apiKeyExpiresAt ?? null,
          });
        } else {
          setSuccessMsg('✅ WhatsApp connecté avec succès ! Votre clé API a été générée.');
        }
        refreshSession();
      }
    });

    const unsubQR = onTenantQR((data) => {
      console.log('[Socket] tenant_qr', data);
      const currentId = activeTenantIdRef.current;
      if (!currentId || data.tenantId === currentId) {
        if (data.qrCode) {
          setQrCode(data.qrCode);
          setQrLoading(false);
        }
      }
    });

    const unsubError = onTenantError((data) => {
      console.log('[Socket] tenant_error', data);
      const currentId = activeTenantIdRef.current;
      if (!currentId || data.tenantId === currentId) {
        const msg = data.message || data.error || 'Une erreur est survenue.';
        setErrorFromSocket(msg);
        setShowQRModal(false);
        setPollingStatus(false);
        setQrLoading(false);
      }
    });

    return () => {
      unsubConnected();
      unsubQR();
      unsubError();
      // Ne pas déconnecter le socket ici — il est partagé
    };
  }, []); // ← dépendances vides : listeners créés une seule fois, la ref se met à jour en dehors

  // Sauvegarde le numéro WhatsApp choisi par l'utilisateur
  const savePhone = (phone) => {
    if (user?.uid) localStorage.setItem(`wa_phone_${user.uid}`, phone);
  };

  // Cherche un tenant existant pour ce numéro — uniquement parmi ceux
  // appartenant à l'utilisateur courant (un numéro = un seul utilisateur,
  // on ne doit jamais reprendre la session d'un autre compte).
  const findExistingTenantForPhone = async (cleanPhone) => {
    try {
      const response = await tenantsAPI.list();
      const tenants = response.tenants ?? [];
      const matches = tenants.filter(t =>
        t.phone?.replace(/[^0-9]/g, '') === cleanPhone &&
        (t.status === 'pending_qr' || t.status === 'disconnected' || t.status === 'connected')
      );

      const ownedByOther = matches.find(t => t.userUid && t.userUid !== user?.uid);
      if (ownedByOther) {
        throw new Error('PHONE_ALREADY_USED');
      }

      return matches.find(t => t.userUid === user?.uid) ?? null;
    } catch (err) {
      if (err?.message === 'PHONE_ALREADY_USED') throw err;
      return null;
    }
  };

  const handleCreateSession = async () => {
    setCreating(true);
    setError('');
    setSuccessMsg('');

    try {
      const cleanPhone = user.phone
        ? user.phone.replace(/[^0-9]/g, '')
        : null;

      if (!cleanPhone) {
        // Pas de phone sur le compte — afficher le formulaire
        // Pré-remplir avec le numéro sauvegardé si disponible
        const saved = localStorage.getItem(`wa_phone_${user?.uid}`) ?? '';
        setPhoneInputValue(saved);
        setError(saved ? '' : 'Pour créer une session, entrez le numéro WhatsApp que vous souhaitez utiliser.');
        setShowPhoneInput(true);
        setCreating(false);
        return;
      }

      await _createOrReuseSession(cleanPhone);
    } catch (err) {
      console.error('Erreur création session:', err);
      setError(err.message || 'Erreur lors de la création de la session');
    } finally {
      setCreating(false);
    }
  };

  const handleCreateWithPhone = async (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

    if (!cleanPhone || cleanPhone.length < 7) {
      setError('Numéro de téléphone invalide (minimum 7 chiffres, indicatif international).');
      return;
    }

    setCreating(true);
    setError('');
    setSuccessMsg('');

    try {
      // 1. Vérifier si ce numéro a déjà un tenant (le nôtre, ou celui d'un autre compte)
      const existing = await findExistingTenantForPhone(cleanPhone).catch((err) => {
        if (err?.message === 'PHONE_ALREADY_USED') {
          throw new Error('Ce numéro WhatsApp est déjà utilisé par un autre compte.');
        }
        throw err;
      });

      if (existing) {
        // Le numéro existe déjà — réutiliser ce tenant
        savePhone(cleanPhone);
        setShowPhoneInput(false);
        activeTenantIdRef.current = existing.tenantId;

        if (existing.status === 'connected') {
          // Déjà connecté — juste rafraîchir
          await refreshSession();
          setSuccessMsg(' Session déjà active récupérée.');
        } else {
          // Relancer le QR pour ce tenant existant
          setTimeout(() => handleShowQR(existing.tenantId), 500);
        }
        return;
      }

      // 2. Numéro nouveau — créer le tenant
      savePhone(cleanPhone);
      setShowPhoneInput(false);

      const response = await tenantsAPI.create({
        phone:      cleanPhone,
        name:       `WhatsApp - ${user.displayName || user.email || 'Utilisateur'}`,
        userUid:    user.uid,
        webhookUrl: undefined,
      });

      activeTenantIdRef.current = response.tenantId;

      setTimeout(() => handleShowQR(response.tenantId), 2000);

    } catch (err) {
      console.error('Erreur création session:', err);
      setError(err.message || 'Erreur lors de la création de la session');
    } finally {
      setCreating(false);
    }
  };

  // Logique partagée : créer ou réutiliser un tenant pour un numéro donné
  const _createOrReuseSession = async (cleanPhone) => {
    const existing = await findExistingTenantForPhone(cleanPhone).catch((err) => {
      if (err?.message === 'PHONE_ALREADY_USED') {
        throw new Error('Ce numéro WhatsApp est déjà utilisé par un autre compte.');
      }
      throw err;
    });

    if (existing) {
      savePhone(cleanPhone);
      activeTenantIdRef.current = existing.tenantId;

      if (existing.status === 'connected') {
        await refreshSession();
        setSuccessMsg(' Session déjà active récupérée.');
      } else {
        setTimeout(() => handleShowQR(existing.tenantId), 500);
      }
      return;
    }

    savePhone(cleanPhone);
    const response = await tenantsAPI.create({
      phone:      cleanPhone,
      name:       `WhatsApp - ${user.displayName || user.email || 'Utilisateur'}`,
      userUid:    user.uid,
      webhookUrl: undefined,
    });

    activeTenantIdRef.current = response.tenantId;
    setTimeout(() => handleShowQR(response.tenantId), 2000);
  };

  const handleShowQR = async (tenantId) => {
    setShowQRModal(true);
    setQrLoading(true);
    setQrCode(null);
    setPollingStatus(true);

    try {
      const response = await tenantsAPI.getQRCode(tenantId);
      
      if (response.status === 'connected') {
        setError('Cette session est déjà connectée');
        setQrLoading(false);
        setPollingStatus(false);
        return;
      }

      if (response.status === 'pending_qr' && response.qrCode) {
        setQrCode(response.qrCode);
        setQrLoading(false);
        // Socket.io se chargera de détecter la connexion automatiquement
      }
    } catch (err) {
      console.error('Erreur récupération QR:', err);
      setError(err.message || 'Erreur lors de la récupération du QR code');
      setQrLoading(false);
      setPollingStatus(false);
    }
  };

  const handleRefreshQR = async () => {
    const tenantId = activeTenantIdRef.current ?? userSession?.tenantId;
    if (!tenantId) return;
    setQrLoading(true);
    setQrCode(null);

    try {
      const response = await tenantsAPI.getQRCode(tenantId);
      if (response.qrCode) {
        setQrCode(response.qrCode);
      }
    } catch (err) {
      console.error('Erreur rafraîchissement QR:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const copyApiKey = () => {
    // Copier la vraie clé complète depuis localStorage, ou le hint en fallback
    const fullKey = getTenantApiKey(user?.uid);
    const keyToCopy = fullKey || userSession?.apiKeyHint;
    if (keyToCopy) {
      navigator.clipboard.writeText(keyToCopy);
      setCopiedApiKey(true);
      setTimeout(() => setCopiedApiKey(false), 2000);
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'green',
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200',
          label: 'Connecté',
        };
      case 'pending_qr':
        return {
          icon: Clock,
          color: 'yellow',
          bg: 'bg-yellow-50',
          text: 'text-yellow-600',
          border: 'border-yellow-200',
          label: 'En attente',
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'red',
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200',
          label: 'Déconnecté',
        };
      case 'revoked':
        return {
          icon: XCircle,
          color: 'red',
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200',
          label: 'Révoqué',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'gray',
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          label: status,
        };
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ma Session WhatsApp</h1>
        <p className="text-gray-600 mt-2">
          Connectez votre numéro WhatsApp pour obtenir votre clé API
        </p>
      </div>

      {/* Banner succès connexion WhatsApp */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800"
        >
          <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
          <button
            onClick={() => setSuccessMsg('')}
            className="ml-auto text-green-600 hover:text-green-800"
          >✕</button>
        </motion.div>
      )}

      {/* Erreur Socket.io (ex: PHONE_MISMATCH, session error) */}
      {errorFromSocket && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800"
        >
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <span className="flex-1 font-medium">{errorFromSocket}</span>
          <button
            onClick={() => setErrorFromSocket('')}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}

      {/* Session Display */}
      {!userSession ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center"
        >
          <Smartphone className="mx-auto text-gray-400 mb-4" size={64} />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Connectez votre WhatsApp
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Pour utiliser l'API Convessa, connectez votre numéro WhatsApp.
            Vous recevrez votre clé API unique après la connexion.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-w-md mx-auto text-left">
              {error}
            </div>
          )}

          {/* CAS 1 — Formulaire de saisie du numéro WhatsApp */}
          {showPhoneInput ? (
            <form
              className="max-w-md mx-auto"
              onSubmit={(e) => {
                e.preventDefault();
                if (phoneInputValue.trim()) handleCreateWithPhone(phoneInputValue.trim());
              }}
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2 text-left">
                Numéro WhatsApp à connecter
              </label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneInputValue}
                  onChange={e => setPhoneInputValue(e.target.value)}
                  placeholder="22960000000 (indicatif + numéro)"
                  autoFocus
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={creating}
                />
                <button
                  type="submit"
                  disabled={creating || !phoneInputValue.trim()}
                  className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {creating ? (
                    <><Loader className="animate-spin" size={16} /><span>Vérification...</span></>
                  ) : (
                    <><QrCode size={16} /><span>Confirmer</span></>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 text-left">
                Entrez le numéro sans le signe + (ex: 22960000000 pour le Bénin)
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowPhoneInput(false);
                  setError('');
                  // Ne pas effacer phoneInputValue — conserver pour la prochaine fois
                }}
                className="mt-3 text-xs text-gray-400 hover:text-gray-600 underline"
              >
                Annuler
              </button>
            </form>
          ) : (
            /* CAS 2 — Bouton principal */
            <button
              onClick={handleCreateSession}
              disabled={creating}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-8 py-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <><Loader className="animate-spin" size={20} /><span>Création en cours...</span></>
              ) : (
                <><QrCode size={20} /><span className="font-medium">Connecter WhatsApp</span></>
              )}
            </button>
          )}
        </motion.div>
      ) : (
        // Session existe - Afficher les détails
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className={`h-2 ${getStatusConfig(userSession.status).bg}`}></div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-xl ${getStatusConfig(userSession.status).bg} flex items-center justify-center`}>
                    {React.createElement(getStatusConfig(userSession.status).icon, {
                      className: getStatusConfig(userSession.status).text,
                      size: 32,
                    })}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {userSession.name || 'Ma Session WhatsApp'}
                    </h3>
                    <p className="text-gray-600">{userSession.phone}</p>
                  </div>
                </div>
                
                <div className={`flex items-center space-x-2 ${getStatusConfig(userSession.status).bg} ${getStatusConfig(userSession.status).text} px-4 py-2 rounded-full font-medium`}>
                  {React.createElement(getStatusConfig(userSession.status).icon, { size: 18 })}
                  <span>{getStatusConfig(userSession.status).label}</span>
                </div>
              </div>

              {/* API Key Section */}
              {userSession.status === 'connected' && userSession.apiKeyHint && (() => {
                const fullKey = getTenantApiKey(user?.uid);
                const displayKey = fullKey || userSession.apiKeyHint;
                return (
                <div className="bg-gradient-to-r from-primary-50 to-purple-50 border-2 border-primary-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      <span>Votre Clé API</span>
                    </h4>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-primary-300">
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-xs font-mono text-gray-900 flex-1 break-all">
                        {showApiKey ? displayKey : `${displayKey.substring(0, 20)}${'•'.repeat(16)}`}
                      </code>
                      <div className="flex items-center space-x-2 flex-shrink-0">
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
                          title="Copier la clé complète"
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
                  
                  <p className="text-sm text-gray-600 mt-3">
                     Gardez votre clé API secrète. Elle a également été envoyée sur votre WhatsApp.
                  </p>
                </div>
                );
              })()}

              {/* Actions */}
              {(userSession.status === 'pending_qr' || userSession.status === 'disconnected') && (
                <button
                  onClick={() => handleShowQR(userSession.tenantId)}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all shadow-md hover:shadow-lg font-medium"
                >
                  <QrCode size={20} />
                  <span>Scanner le QR Code</span>
                </button>
              )}
              
              {/* Session Info */}
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500 mb-1">ID Session</p>
                  <code className="text-xs text-gray-900">{userSession.tenantId.slice(0, 12)}...</code>
                </div>
                {userSession.connectedAt && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-500 mb-1">Connecté le</p>
                    <p className="text-gray-900">{new Date(userSession.connectedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center space-x-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Comment utiliser votre clé API</span>
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Copiez votre clé API ci-dessus</li>
              <li>Ajoutez-la dans vos en-têtes HTTP: <code className="bg-blue-100 px-2 py-0.5 rounded">X-Api-Key: VOTRE_CLE</code></li>
              <li>Consultez la documentation pour les endpoints disponibles</li>
              <li>Commencez à envoyer des messages via l'API REST</li>
            </ol>
          </div>
        </motion.div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <QrCode size={24} />
                  <span>Scanner le QR Code</span>
                </h2>
              </div>

              {/* Content */}
              <div className="p-6">
                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="animate-spin text-primary-600 mb-4" size={48} />
                    <p className="text-gray-600">Génération du QR code...</p>
                  </div>
                ) : qrCode ? (
                  <div className="space-y-4">
                    {/* QR Code Image */}
                    <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200 flex justify-center relative">
                      <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      
                      {/* Polling indicator */}
                      {pollingStatus && (
                        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-2 animate-pulse">
                          <Loader className="animate-spin" size={12} />
                          <span>En attente du scan...</span>
                        </div>
                      )}
                    </div>

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                      <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Ouvrez WhatsApp sur votre téléphone</li>
                        <li>Appuyez sur Menu (⋮) puis sur "Appareils liés"</li>
                        <li>Appuyez sur "Lier un appareil"</li>
                        <li>Pointez votre téléphone vers cet écran pour scanner le code</li>
                      </ol>
                      <p className="text-xs text-blue-700 mt-3 flex items-center space-x-1">
                        <AlertCircle size={14} />
                        <span>Le QR code expire après 60 secondes</span>
                      </p>
                      {pollingStatus && (
                        <p className="text-xs text-green-700 mt-2 font-medium flex items-center space-x-1">
                          <CheckCircle size={14} />
                          <span>Après le scan, votre clé API sera générée automatiquement</span>
                        </p>
                      )}
                    </div>

                    {/* Refresh Button */}
                    <button
                      onClick={handleRefreshQR}
                      disabled={qrLoading}
                      className="w-full flex items-center justify-center space-x-2 border-2 border-primary-600 text-primary-600 px-4 py-3 rounded-lg hover:bg-primary-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw size={18} className={qrLoading ? 'animate-spin' : ''} />
                      <span>Actualiser le QR code</span>
                    </button>

                    {/* Erreur socket dans le modal QR */}
                    {errorFromSocket && (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{errorFromSocket}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="text-yellow-600 mb-4" size={48} />
                    <p className="text-gray-600 mb-4">QR code non disponible</p>
                    <button
                      onClick={handleRefreshQR}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <RefreshCw size={18} />
                      <span>Réessayer</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal clé API — affiché après connexion WhatsApp réussie */}
      <AnimatePresence>
        {apiKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setApiKeyModal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 relative">
                <button
                  onClick={() => setApiKeyModal(null)}
                  className="absolute top-4 right-4 text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white transition-colors"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-3 text-white pr-8">
                  <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold leading-snug">
                      WhatsApp connecté avec succès !
                    </h2>
                    <p className="text-green-100 text-sm">Votre clé API a été générée.</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Key size={16} className="text-green-700" />
                    <span>Votre clé API</span>
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                    <div className="flex items-center justify-between gap-3">
                      <code className="text-sm font-mono text-gray-900 flex-1 break-all">
                        {apiKeyModal.key || apiKeyModal.hint}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(apiKeyModal.key || apiKeyModal.hint || '');
                          setApiKeyModalCopied(true);
                          setTimeout(() => setApiKeyModalCopied(false), 2000);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 transition-colors flex-shrink-0"
                        aria-label="Copier la clé API"
                        title="Copier"
                      >
                        {apiKeyModalCopied ? (
                          <CheckCircle size={18} className="text-green-600" />
                        ) : (
                          <Copy size={18} className="text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>
                  {apiKeyModalCopied && (
                    <p className="text-xs text-green-700 mt-1.5">Clé copiée dans le presse-papiers ✓</p>
                  )}
                </div>

                <p className="text-sm text-gray-700">
                  Votre WhatsApp est connecté et votre clé API est prête.
                </p>

                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <AlertCircle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 font-medium">
                    ⚠️ Copiez cette clé maintenant. Elle ne sera plus affichée en clair.
                  </p>
                </div>

                {apiKeyModal.expiresAt && (
                  <p className="text-xs text-gray-500">
                    Valide jusqu'au{' '}
                    <span className="font-medium text-gray-700">
                      {new Date(apiKeyModal.expiresAt).toLocaleDateString('fr-FR', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </span>
                  </p>
                )}

                <button
                  onClick={() => setApiKeyModal(null)}
                  className="w-full bg-green-700 text-white py-3 rounded-lg hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2 transition-colors font-medium"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Sessions;