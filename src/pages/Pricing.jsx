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
          message:  `✅ Abonnement "${data.planName ?? ''}" activé ! Votre clé API a été renouvelée.`,
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
    <div className="max-w-6xl mx-auto px-4 py-16">

      {/* Header */}
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choisissez votre plan</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Tous les plans incluent l'accès à l'API WhatsApp, la documentation et le support.
          Payez en FCFA via FedaPay ou KKiaPay.
        </p>
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

      {/* Grille des plans */}
      <div className={`grid gap-8 ${plans.length <= 3 ? 'md:grid-cols-' + plans.length : 'md:grid-cols-3'}`}>
        {plans.map((plan, index) => {
          const Icon       = getPlanIcon(index, plan.isPopular);
          const UsageIcon  = getUsageIcon(plan);
          const isFree     = plan.price === 0;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className={`relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden flex flex-col ${
                plan.isPopular
                  ? 'border-primary-500 shadow-lg shadow-primary-100'
                  : 'border-gray-200 hover:border-primary-200'
              } transition-all`}
            >
              {/* Badge populaire */}
              {plan.isPopular && (
                <div className="bg-primary-600 text-white text-xs font-bold uppercase tracking-wider text-center py-1.5 px-4">
                  ⭐ Le plus populaire
                </div>
              )}

              <div className="p-7 flex flex-col flex-1">
                {/* Icône + Nom */}
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    plan.isPopular ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <Icon size={22} className={plan.isPopular ? 'text-primary-600' : 'text-gray-600'} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                </div>

                {/* Prix */}
                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {isFree ? 'Gratuit' : new Intl.NumberFormat('fr-FR').format(plan.price)}
                  </span>
                  {!isFree && <span className="text-gray-500 ml-1 text-lg">FCFA</span>}
                </div>

                {/* Usage */}
                <div className={`flex items-center gap-2 mb-5 px-3 py-2 rounded-lg text-sm font-medium ${
                  plan.isPopular ? 'bg-primary-50 text-primary-700' : 'bg-gray-50 text-gray-700'
                }`}>
                  <UsageIcon size={15} />
                  <span>{getUsageLabel(plan)}</span>
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-gray-600 text-sm mb-5 leading-relaxed">{plan.description}</p>
                )}

                {/* Features */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-2.5 mb-6 flex-1">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <Check size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex-1" />

                {/* Bouton */}
                {isFree ? (
                  <button
                    onClick={() => navigate(user ? '/sessions' : '/login')}
                    className="w-full py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all"
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
                    className={`w-full py-3 rounded-xl font-semibold transition-all ${
                      plan.isPopular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg'
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    <CreditCard size={17} className="inline mr-2 -mt-0.5" />
                    Obtenir ce plan
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sécurité */}
      <div className="mt-12 text-center flex items-center justify-center gap-2 text-gray-500 text-sm">
        <Shield size={16} />
        <span>Paiements sécurisés par FedaPay et KKiaPay · SSL · Aucune carte enregistrée</span>
      </div>

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
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4 flex items-center justify-between">
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

              <div className="p-8 text-center space-y-5">
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
