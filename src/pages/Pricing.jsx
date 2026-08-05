/**
 * Pricing.jsx — Page des plans d'abonnement Convessa.
 *
 * Flux complet :
 *   1. Chargement des plans depuis /api/v1/plans
 *   2. Clic "Obtenir" sur un plan payant → modal choix passerelle
 *   3. Choix FedaPay → modal avec iframe checkout.fedapay.com
 *      Choix KKiaPay → modal avec widget KKiaPay (SDK)
 *   4. Paiement confirmé → activation automatique + mise à jour clé API
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Check, Zap, Star, Crown, Loader, AlertCircle,
  CreditCard, X, ExternalLink, RefreshCw, CheckCircle,
  Shield, Clock, MessageSquare, Infinity,
} from 'lucide-react';
import { plansAPI, paymentsAPI, saveTenantApiKey } from '../services/api';
import { onSubscriptionActivated, connectSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';
import useUserSession from '../hooks/useUserSession';
import { usePageTitle } from '../hooks/usePageTitle';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatPrice(price) {
  if (price === 0) return 'Gratuit';
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

function getPlanIcon(index, isPopular) {
  if (isPopular) return Crown;
  if (index === 0) return Zap;
  return Star;
}

function getUsageLabel(plan) {
  if (plan.unlimited) return 'Messages illimités';
  if (plan.usageType === 'duration') return `Valable ${plan.usageValue} jour${plan.usageValue > 1 ? 's' : ''}`;
  if (plan.usageType === 'requests') return `${new Intl.NumberFormat('fr-FR').format(plan.usageValue)} messages`;
  return 'Usage défini';
}

function getUsageIcon(plan) {
  if (plan.unlimited) return Infinity;
  if (plan.usageType === 'duration') return Clock;
  return MessageSquare;
}

// Injecte le SDK KKiaPay dynamiquement (évite un bundle inutile)
function loadKkiapayScript() {
  return new Promise((resolve, reject) => {
    if (window.openKkiapayWidget) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.kkiapay.me/k.js';
    s.onload  = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function Pricing() {
  usePageTitle('Tarifs & Plans');
  const { user }                    = useAuth();
  const { refresh: refreshSession } = useUserSession();
  const navigate                    = useNavigate();

  const [plans, setPlans]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  // Modal choix passerelle
  const [gatewayModal, setGatewayModal] = useState(null); // { plan }

  // Modal paiement FedaPay (iframe)
  const [fedaModal, setFedaModal]       = useState(null); // { checkoutUrl, paymentId }

  // Modal paiement KKiaPay
  const [kkiaModal, setKkiaModal]       = useState(null); // { paymentId, publicKey, amount, sandbox, data }

  // Résultat paiement
  const [paymentResult, setPaymentResult] = useState(null); // { success, message, apiKey }

  const [initiating, setInitiating]     = useState(false);
  const [initError, setInitError]       = useState('');

  // Polling du statut paiement FedaPay après retour iframe
  const pollRef = useRef(null);

  const activeTenantIdRef = useRef(null);

  // ── Chargement des plans ─────────────────────────────────────────────────────

  useEffect(() => {
    plansAPI.list()
      .then(res => setPlans(res.plans ?? []))
      .catch(err => setError(err.message || 'Impossible de charger les plans'))
      .finally(() => setLoading(false));
  }, []);

  // ── Socket — abonnement activé ───────────────────────────────────────────────

  useEffect(() => {
    connectSocket();

    const unsub = onSubscriptionActivated((data) => {
      const currentTenantId = activeTenantIdRef.current;
      if (!currentTenantId || data.tenantId === currentTenantId) {
        stopPolling();
        setFedaModal(null);
        setKkiaModal(null);
        setGatewayModal(null);

        if (data.apiKey && user?.uid) {
          saveTenantApiKey(user.uid, data.apiKey);
        }

        setPaymentResult({
          success:  true,
          message:  `Abonnement "${data.planName ?? ''}" activé ! Votre clé API a été renouvelée.`,
          apiKey:   data.apiKey ?? null,
          expiresAt: data.apiKeyExpiresAt ?? null,
        });

        refreshSession();
      }
    });

    return () => { unsub(); stopPolling(); };
  }, [user?.uid]); // eslint-disable-line

  // ── Polling du statut paiement FedaPay ──────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback((paymentId) => {
    stopPolling();
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await paymentsAPI.getStatus(paymentId);
        if (res.status === 'success') {
          stopPolling();
          // Le socket aura déjà déclenché la mise à jour via subscription_activated,
          // mais au cas où le socket serait lent, on rafraîchit aussi ici.
          await refreshSession();
        } else if (res.status === 'failed' || res.status === 'cancelled' || attempts > 30) {
          stopPolling();
          if (res.status === 'failed') {
            setPaymentResult({ success: false, message: 'Le paiement a échoué. Réessayez.' });
            setFedaModal(null);
          } else if (attempts > 30) {
            // Timeout 5min — on arrête de poller
            stopPolling();
          }
        }
      } catch {
        // Ignorer les erreurs réseau passagères
      }
    }, 10_000); // toutes les 10s
  }, [stopPolling, refreshSession]);

  // ── Initier un paiement ──────────────────────────────────────────────────────

  const handleInitiatePayment = useCallback(async (plan, gateway) => {
    setInitiating(true);
    setInitError('');

    try {
      const res = await paymentsAPI.initiate({ planId: plan.id, gateway });

      // Mémoriser le tenantId pour filtrer les events socket
      // (récupéré depuis le contexte session si dispo)
      // On laisse null — le filtre socket accepte null comme "tous"

      if (gateway === 'fedapay') {
        setGatewayModal(null);
        setFedaModal({ checkoutUrl: res.checkoutUrl, paymentId: res.paymentId });
        startPolling(res.paymentId);
        // Ouvrir immédiatement dans un nouvel onglet (évite le blocage Mixed Content / iframe)
        window.open(res.checkoutUrl, '_blank', 'noopener,noreferrer');
      } else {
        setGatewayModal(null);
        setKkiaModal({
          paymentId: res.paymentId,
          publicKey: res.publicKey,
          amount:    res.amount,
          sandbox:   res.sandbox,
          data:      res.data,
        });
      }
    } catch (err) {
      setInitError(err.message || 'Erreur lors de l\'initialisation du paiement');
    } finally {
      setInitiating(false);
    }
  }, [startPolling]);

  // ── KKiaPay — ouvrir le widget après chargement SDK ─────────────────────────

  useEffect(() => {
    if (!kkiaModal) return;

    loadKkiapayScript()
      .then(() => {
        if (!window.openKkiapayWidget) return;

        window.openKkiapayWidget({
          amount:   kkiaModal.amount,
          api_key:  kkiaModal.publicKey,
          sandbox:  kkiaModal.sandbox,
          name:     user?.displayName ?? user?.email ?? 'Convessa User',
          email:    user?.email ?? '',
          data:     JSON.stringify(kkiaModal.data),
          callback: 'convessaKkiapayCallback',
        });

        // Callback global KKiaPay (succès)
        window.convessaKkiapayCallback = async ({ transactionId }) => {
          try {
            await paymentsAPI.confirmKkiapay({
              paymentId:     kkiaModal.paymentId,
              transactionId,
            });
            // Le socket va notifier subscription_activated
          } catch (err) {
            setPaymentResult({ success: false, message: err.message || 'Erreur confirmation paiement' });
          } finally {
            setKkiaModal(null);
          }
        };

        // Callback annulation
        window.addEventListener('kkiapay-close', () => { setKkiaModal(null); }, { once: true });
      })
      .catch(() => {
        setInitError('Impossible de charger le widget KKiaPay. Vérifiez votre connexion.');
        setKkiaModal(null);
      });
  }, [kkiaModal, user]); // eslint-disable-line

  // ── Rendu ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader className="animate-spin text-primary-600" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="text-red-500" size={48} />
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => { setError(''); setLoading(true); plansAPI.list().then(r => setPlans(r.plans ?? [])).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          <RefreshCw size={16} /> Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">

      {/* Header simplifié */}
      <div className="text-center mb-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Choisissez votre plan
          </h1>
          
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tous les plans incluent l'accès complet à l'API WhatsApp, la documentation détaillée et le support technique.
          </p>
        </motion.div>
      </div>

      {/* Résultat paiement */}
      <AnimatePresence>
        {paymentResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-8 p-5 rounded-xl border flex items-start gap-3 ${
              paymentResult.success
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {paymentResult.success
              ? <CheckCircle size={22} className="text-green-600 flex-shrink-0 mt-0.5" />
              : <AlertCircle size={22} className="text-red-500 flex-shrink-0 mt-0.5" />
            }
            <div className="flex-1">
              <p className="font-semibold">{paymentResult.message}</p>
              {paymentResult.expiresAt && (
                <p className="text-sm mt-1 opacity-80">
                  Expire le : {new Date(paymentResult.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {paymentResult.success && (
                <button
                  onClick={() => navigate('/sessions')}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Voir ma session →
                </button>
              )}
            </div>
            <button onClick={() => setPaymentResult(null)} className="ml-auto opacity-60 hover:opacity-100">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grille des plans - Design inspiré de la page d'accueil */}
      <div className={`grid gap-6 md:gap-8 mb-16 max-w-6xl mx-auto ${
        {
          1: 'sm:grid-cols-1 max-w-md',
          2: 'sm:grid-cols-2 max-w-4xl',
          3: 'sm:grid-cols-2 lg:grid-cols-3',
        }[Math.min(plans.length, 3)] || 'sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {plans.map((plan, index) => {
          const UsageIcon  = getUsageIcon(plan);
          const isFree     = plan.price === 0;
          const isPopular = plan.isPopular || (!isFree && plans.length >= 3 && index === Math.floor((plans.length - 1) / 2));

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`rounded-3xl p-6 sm:p-8 ${
                isPopular
                  ? 'bg-whatsapp-dark text-white shadow-2xl sm:transform sm:scale-105 border-4 border-whatsapp-dark'
                  : 'bg-white border-2 border-gray-200 hover:border-whatsapp-dark hover:shadow-xl transition-all duration-300'
              }`}
            >
              {isPopular && (
                <div className="inline-flex items-center space-x-1 bg-yellow-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold mb-6">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>POPULAIRE</span>
                </div>
              )}

              <h3 className={`text-2xl font-bold mb-4 ${isPopular ? 'text-white' : 'text-gray-900'}`}>
                {plan.name}
              </h3>

              {/* Prix */}
              <div className="mb-8">
                <span className="text-3xl sm:text-5xl font-bold">
                  {isFree ? 'Gratuit' : formatPrice(plan.price)}
                </span>
              </div>

              {/* Usage */}
              <ul className="space-y-4 mb-8">
                <li className="flex items-start space-x-3">
                  <Check
                    className={`flex-shrink-0 mt-1 ${isPopular ? 'text-white' : 'text-whatsapp-dark'}`}
                    size={20}
                    strokeWidth={3}
                  />
                  <span className={`${isPopular ? 'text-white' : 'text-gray-700'}`}>
                    {getUsageLabel(plan)}
                  </span>
                </li>
                {plan.features && plan.features.length > 0 && plan.features.slice(0, 3).map((feat, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <Check
                      className={`flex-shrink-0 mt-1 ${isPopular ? 'text-white' : 'text-whatsapp-dark'}`}
                      size={20}
                      strokeWidth={3}
                    />
                    <span className={`${isPopular ? 'text-white' : 'text-gray-700'}`}>
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Bouton */}
              {isFree ? (
                <button
                  onClick={() => navigate(user ? '/sessions' : '/login')}
                  className={`block w-full text-center py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                    isPopular
                      ? 'bg-white text-whatsapp-dark hover:bg-gray-50 shadow-lg'
                      : 'bg-whatsapp-dark text-white hover:bg-whatsapp-dark shadow-md hover:shadow-lg'
                  }`}
                >
                  Commencer gratuitement
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!user) { navigate('/login?redirect=/pricing'); return; }
                    setInitError('');
                    setGatewayModal({ plan });
                  }}
                  className={`block w-full text-center py-4 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                    isPopular
                      ? 'bg-white text-whatsapp-dark hover:bg-gray-50 shadow-lg'
                      : 'bg-whatsapp-dark text-white hover:bg-whatsapp-dark shadow-md hover:shadow-lg'
                  }`}
                >
                  Choisir ce plan
                </button>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Badges de confiance simplifiés */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-16"
      >
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Paiements sécurisés</h4>
              <p className="text-xs text-gray-600">FedaPay et KKiaPay</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Activation instantanée</h4>
              <p className="text-xs text-gray-600">Prêt en 2 minutes</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <MessageSquare size={24} className="text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Support 24/7</h4>
              <p className="text-xs text-gray-600">Assistance complète</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Modal choix passerelle ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {gatewayModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => !initiating && setGatewayModal(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-whatsapp px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Choisir la méthode de paiement</h2>
                  <p className="text-primary-200 text-sm mt-0.5">
                    {gatewayModal.plan.name} — {formatPrice(gatewayModal.plan.price)}
                  </p>
                </div>
                <button
                  onClick={() => !initiating && setGatewayModal(null)}
                  className="text-primary-200 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {initError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-700">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{initError}</span>
                  </div>
                )}

                {/* FedaPay */}
                <button
                  onClick={() => handleInitiatePayment(gatewayModal.plan, 'fedapay')}
                  disabled={initiating}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-600 font-extrabold text-sm">FP</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">FedaPay</p>
                    <p className="text-sm text-gray-500">Mobile Money, Carte bancaire</p>
                  </div>
                  {initiating ? <Loader size={18} className="animate-spin text-gray-400" /> : <ExternalLink size={18} className="text-gray-400" />}
                </button>

                {/* KKiaPay */}
                <button
                  onClick={() => handleInitiatePayment(gatewayModal.plan, 'kkiapay')}
                  disabled={initiating}
                  className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                >
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-extrabold text-sm">KK</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">KKiaPay</p>
                    <p className="text-sm text-gray-500">MTN, Moov, Carte, Orange</p>
                  </div>
                  {initiating ? <Loader size={18} className="animate-spin text-gray-400" /> : <ExternalLink size={18} className="text-gray-400" />}
                </button>

                <p className="text-xs text-center text-gray-400 pt-2">
                  Paiement sécurisé · Activation immédiate après confirmation
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal paiement FedaPay ─────────────────────────────────────── */}
      {/* FedaPay s'ouvre dans un nouvel onglet pour éviter les blocages
          Mixed Content / Private Network Access de Chrome.
          On polle le statut en arrière-plan jusqu'à confirmation. */}
      <AnimatePresence>
        {fedaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              {/* Header */}
              <div className="bg-orange-500 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <CreditCard size={20} /> Paiement FedaPay
                </h2>
                <button
                  onClick={() => { setFedaModal(null); stopPolling(); }}
                  className="text-orange-200 hover:text-white"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="p-5 sm:p-8 text-center space-y-5">
                {/* Icône animée */}
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                  <ExternalLink size={28} className="text-orange-600" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Fenêtre de paiement ouverte</h3>
                  <p className="text-gray-600 text-sm">
                    Complétez votre paiement dans la fenêtre FedaPay qui s'est ouverte.
                    Cette page se mettra à jour automatiquement une fois le paiement confirmé.
                  </p>
                </div>

                {/* Indicateur de polling */}
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">
                  <Loader size={15} className="animate-spin text-orange-500 flex-shrink-0" />
                  <span>En attente de confirmation du paiement...</span>
                </div>

                <div className="space-y-2.5 pt-1">
                  {/* Bouton rouvrir si la fenêtre a été fermée */}
                  <button
                    onClick={() => window.open(fedaModal.checkoutUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-medium transition-colors"
                  >
                    <ExternalLink size={17} />
                    Rouvrir la fenêtre de paiement
                  </button>

                  <button
                    onClick={() => { setFedaModal(null); stopPolling(); }}
                    className="w-full text-gray-500 hover:text-gray-700 text-sm py-2 transition-colors"
                  >
                    Annuler
                  </button>
                </div>

                <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                  <Shield size={12} />
                  Paiement sécurisé par FedaPay · Activation immédiate après confirmation
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modal KKiaPay — message d'attente (le widget s'ouvre en overlay) ─── */}
      <AnimatePresence>
        {kkiaModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center"
            >
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-700 font-extrabold text-xl">KK</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">KKiaPay</h3>
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-3">
                <Loader size={18} className="animate-spin" />
                <span className="text-sm">Ouverture du widget de paiement...</span>
              </div>
              <p className="text-xs text-gray-400">
                Une fenêtre de paiement KKiaPay va s'ouvrir. Complétez le paiement pour activer votre abonnement.
              </p>
              <button
                onClick={() => setKkiaModal(null)}
                className="mt-5 text-sm text-gray-500 underline hover:no-underline"
              >
                Annuler
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
