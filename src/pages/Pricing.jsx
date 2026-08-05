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
    <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20">

      {/* Header avec gradient background */}
      <div className="text-center mb-16 relative">
        {/* Décorations d'arrière-plan */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-primary-100/40 via-primary-50/30 to-green-100/40 rounded-full blur-3xl opacity-60" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold mb-6">
            <Zap size={16} className="text-primary-600" />
            <span>Tarifs simples et transparents</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Choisissez votre plan
          </h1>
          
          <p className="text-base sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Tous les plans incluent l'accès complet à l'API WhatsApp, la documentation détaillée et le support technique.
            <span className="block mt-2 text-primary-600 font-medium">
              Payez en FCFA via FedaPay ou KKiaPay
            </span>
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

      {/* Grille des plans - Style amélioré */}
      <div className={`grid gap-6 lg:gap-8 mb-16 ${
        {
          1: 'sm:grid-cols-1 max-w-md mx-auto',
          2: 'sm:grid-cols-2 max-w-4xl mx-auto',
          3: 'sm:grid-cols-2 lg:grid-cols-3',
        }[Math.min(plans.length, 3)] || 'sm:grid-cols-2 lg:grid-cols-3'
      }`}>
        {plans.map((plan, index) => {
          const Icon       = getPlanIcon(index, plan.isPopular);
          const UsageIcon  = getUsageIcon(plan);
          const isFree     = plan.price === 0;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.12, duration: 0.5 }}
              className={`relative bg-white rounded-3xl overflow-hidden flex flex-col group ${
                plan.isPopular
                  ? 'border-2 border-primary-400 shadow-2xl shadow-primary-100/50 scale-105 lg:scale-110'
                  : 'border border-gray-200 shadow-lg hover:shadow-xl hover:border-primary-200'
              } transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Badge populaire avec gradient */}
              {plan.isPopular && (
                <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-green-500 text-white text-sm font-bold uppercase tracking-wider text-center py-2.5 px-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  <span className="relative flex items-center justify-center gap-2">
                    <Crown size={16} className="animate-bounce" />
                    Le plus populaire
                  </span>
                </div>
              )}

              <div className="p-6 sm:p-8 flex flex-col flex-1">
                {/* Icône + Nom avec meilleur style */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:scale-110 ${
                    plan.isPopular 
                      ? 'bg-gradient-to-br from-primary-500 to-primary-600' 
                      : isFree 
                        ? 'bg-gradient-to-br from-gray-100 to-gray-200'
                        : 'bg-gradient-to-br from-gray-800 to-gray-900'
                  }`}>
                    <Icon size={26} className={plan.isPopular || !isFree ? 'text-white' : 'text-gray-600'} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    {plan.isPopular && <span className="text-xs text-primary-600 font-semibold">⚡ Recommandé</span>}
                  </div>
                </div>

                {/* Prix avec meilleur style */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl sm:text-6xl font-black ${
                      plan.isPopular ? 'bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent' : 'text-gray-900'
                    }`}>
                      {isFree ? 'Gratuit' : new Intl.NumberFormat('fr-FR').format(plan.price)}
                    </span>
                    {!isFree && <span className="text-gray-500 text-xl font-medium">FCFA</span>}
                  </div>
                  {!isFree && <p className="text-sm text-gray-500 mt-1">Paiement unique</p>}
                </div>

                {/* Usage avec badge amélioré */}
                <div className={`flex items-center gap-2.5 mb-6 px-4 py-3 rounded-xl text-sm font-semibold shadow-sm ${
                  plan.isPopular 
                    ? 'bg-gradient-to-r from-primary-50 to-green-50 text-primary-700 border border-primary-200' 
                    : 'bg-gray-50 text-gray-700 border border-gray-200'
                }`}>
                  <UsageIcon size={18} className={plan.isPopular ? 'text-primary-600' : 'text-gray-600'} />
                  <span>{getUsageLabel(plan)}</span>
                </div>

                {/* Description */}
                {plan.description && (
                  <p className="text-gray-600 text-base mb-6 leading-relaxed">{plan.description}</p>
                )}

                {/* Séparateur */}
                <div className="border-t border-gray-100 my-4" />

                {/* Features avec meilleur style */}
                {plan.features && plan.features.length > 0 && (
                  <ul className="space-y-3.5 mb-8 flex-1">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          plan.isPopular ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Check size={14} className={plan.isPopular ? 'text-green-600' : 'text-gray-600'} strokeWidth={3} />
                        </div>
                        <span className="leading-relaxed">{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex-1" />

                {/* Bouton avec meilleur style */}
                {isFree ? (
                  <button
                    onClick={() => navigate(user ? '/sessions' : '/login')}
                    className="w-full py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-bold text-base hover:border-gray-900 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 group"
                  >
                    <span>Commencer gratuitement</span>
                    <ExternalLink size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (!user) { navigate('/login?redirect=/pricing'); return; }
                      setInitError('');
                      setGatewayModal({ plan });
                    }}
                    className={`w-full py-4 rounded-xl font-bold text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      plan.isPopular
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white'
                        : 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 text-white'
                    }`}
                  >
                    <CreditCard size={19} />
                    <span>Obtenir ce plan</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sécurité et garanties - Style amélioré */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-16"
      >
        {/* Badges de confiance */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <Shield size={24} className="text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Paiements sécurisés</h4>
              <p className="text-xs text-gray-600">SSL · Aucune carte enregistrée</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={24} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Activation instantanée</h4>
              <p className="text-xs text-gray-600">Accès immédiat après paiement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
              <CreditCard size={24} className="text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Paiements locaux</h4>
              <p className="text-xs text-gray-600">FedaPay · KKiaPay · Mobile Money</p>
            </div>
          </div>
        </div>

        {/* CTA finale */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-500 to-green-500 rounded-3xl p-8 sm:p-12 text-center shadow-2xl">
          {/* Décorations */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0ySDZ2MmgzMHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20" />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-4">
              <Star size={16} />
              <span>Une question sur les tarifs ?</span>
            </div>
            
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
              Besoin d'aide pour choisir ?
            </h2>
            <p className="text-primary-50 text-base sm:text-lg mb-6 max-w-2xl mx-auto">
              Notre équipe est là pour vous conseiller et vous aider à trouver le plan qui correspond à vos besoins.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={() => navigate('/contact')}
                className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-base hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
              >
                <MessageSquare size={20} />
                <span>Contactez-nous</span>
              </button>
              
              <button
                onClick={() => navigate('/docs?section=introduction')}
                className="px-8 py-4 bg-transparent border-2 border-white text-white rounded-xl font-bold text-base hover:bg-white/10 transition-all backdrop-blur-sm flex items-center gap-2"
              >
                <ExternalLink size={20} />
                <span>Voir la documentation</span>
              </button>
            </div>
          </motion.div>
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
