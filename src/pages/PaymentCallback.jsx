/**
 * PaymentCallback.jsx — Page de retour après paiement FedaPay.
 *
 * FedaPay redirige le navigateur vers /payment/callback?paymentId=<id>
 * après que l'utilisateur a complété le paiement (dans un nouvel onglet).
 *
 * Cette page :
 *   1. Appelle le backend pour vérifier et activer le plan
 *   2. Affiche le résultat
 *   3. Redirige vers /sessions (ou ferme l'onglet si c'était un onglet secondaire)
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader, X } from 'lucide-react';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  const [status, setStatus]   = useState('loading');
  const [message, setMessage] = useState('Vérification du paiement en cours...');

  useEffect(() => {
    const paymentId = searchParams.get('paymentId');
    const cancelled = searchParams.get('cancelled');

    if (cancelled) {
      setStatus('error');
      setMessage('Paiement annulé. Vous pouvez réessayer depuis la page des tarifs.');
      // Fermer l'onglet ou rediriger après 3s
      setTimeout(() => _closeOrRedirect('/pricing'), 3000);
      return;
    }

    if (!paymentId) {
      setStatus('error');
      setMessage('Paramètre de paiement manquant.');
      setTimeout(() => _closeOrRedirect('/pricing'), 3000);
      return;
    }

    // Vérifier le paiement via le backend
    _verifyPayment(paymentId);
  }, []); // eslint-disable-line

  async function _verifyPayment(paymentId) {
    try {
      const token = localStorage.getItem('firebaseToken') ?? '';

      const res = await fetch(`/api/v1/payments/callback/fedapay?paymentId=${encodeURIComponent(paymentId)}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success || data.status === 'already_activated') {
        setStatus('success');
        setMessage('Paiement confirmé ! Votre abonnement est maintenant actif.');
        setTimeout(() => _closeOrRedirect('/sessions'), 3000);
      } else {
        setStatus('error');
        setMessage(data.error?.message ?? 'Le paiement n\'a pas pu être confirmé.');
        setTimeout(() => _closeOrRedirect('/pricing'), 5000);
      }
    } catch {
      setStatus('error');
      setMessage('Erreur réseau lors de la vérification. Vérifiez votre session.');
      setTimeout(() => _closeOrRedirect('/pricing'), 5000);
    }
  }

  function _closeOrRedirect(fallbackPath) {
    // Si l'onglet a été ouvert par window.open (opener existe), le fermer
    // et laisser la page d'origine (qui polle) se mettre à jour.
    if (window.opener && !window.opener.closed) {
      window.close();
    } else {
      navigate(fallbackPath);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center"
      >
        {status === 'loading' && (
          <>
            <Loader className="animate-spin text-orange-500 mx-auto mb-5" size={52} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Vérification en cours</h2>
            <p className="text-gray-600 text-sm">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="text-green-500 mx-auto mb-5" size={52} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Paiement réussi !</h2>
            <p className="text-gray-600 text-sm mb-4">{message}</p>
            <p className="text-xs text-gray-400">
              {window.opener ? 'Fermeture de cet onglet...' : 'Redirection vers votre session...'}
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="text-red-500 mx-auto mb-5" size={52} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Problème de paiement</h2>
            <p className="text-gray-600 text-sm mb-5">{message}</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => _closeOrRedirect('/pricing')}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
              >
                Retour aux plans
              </button>
              {window.opener && (
                <button
                  onClick={() => window.close()}
                  className="flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 text-sm py-2"
                >
                  <X size={15} /> Fermer cet onglet
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
