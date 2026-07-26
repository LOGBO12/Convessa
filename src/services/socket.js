/**
 * Service Socket.io pour les événements temps réel
 *
 * L'URL du serveur Socket.io vient de VITE_SOCKET_URL (fichier .env, voir
 * .env.example). En dev, si la variable n'est pas définie, on retombe sur
 * l'origine courante du navigateur avec le port backend par défaut — mais
 * en production, VITE_SOCKET_URL DOIT être défini avec le vrai domaine
 * déployé (ex: https://api.convessa.com), sinon la connexion temps réel
 * échoue silencieusement (le navigateur ne peut pas joindre 127.0.0.1 du
 * serveur depuis l'extérieur).
 */

import { io } from 'socket.io-client';

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  `${window.location.protocol}//${window.location.hostname}:${import.meta.env.VITE_BACKEND_PORT || 3005}`;

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    // Pas de token en dev (BRIDGE_API_KEY vide → backend laisse passer)
    auth: {},
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket.io connecté:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log('Socket.io déconnecté:', reason);
  });
  socket.on('connect_error', (error) => {
    console.error('Erreur connexion Socket.io:', error.message);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function onTenantConnected(callback) {
  if (!socket) connectSocket();
  socket.on('tenant_connected', callback);
  return () => socket?.off('tenant_connected', callback);
}

export function onTenantQR(callback) {
  if (!socket) connectSocket();
  socket.on('tenant_qr', callback);
  return () => socket?.off('tenant_qr', callback);
}

export function onTenantStatusUpdate(callback) {
  if (!socket) connectSocket();
  socket.on('tenant_status_update', callback);
  return () => socket?.off('tenant_status_update', callback);
}

export function onQueueUpdate(callback) {
  if (!socket) connectSocket();
  socket.on('queue_update', callback);
  return () => socket?.off('queue_update', callback);
}

export function onTenantError(callback) {
  if (!socket) connectSocket();
  socket.on('tenant_error', callback);
  return () => socket?.off('tenant_error', callback);
}

/**
 * Statut final d'un message envoyé via /api/v1/send (sent | failed).
 * C'est la source de vérité pour savoir si un message est réellement parti —
 * la réponse HTTP de POST /send n'est qu'un accusé de réception ("queued").
 */
export function onMessageStatus(callback) {
  if (!socket) connectSocket();
  socket.on('message_status', callback);
  return () => socket?.off('message_status', callback);
}

export function onSubscriptionActivated(callback) {
  if (!socket) connectSocket();
  socket.on('subscription_activated', callback);
  return () => socket?.off('subscription_activated', callback);
}

export function getSocket() {
  return socket;
}

export default {
  connect: connectSocket,
  disconnect: disconnectSocket,
  onTenantConnected,
  onTenantQR,
  onTenantStatusUpdate,
  onQueueUpdate,
  onTenantError,
  onMessageStatus,
  onSubscriptionActivated,
  getSocket,
};
