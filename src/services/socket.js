/**
 * Service Socket.io pour les événements temps réel
 */

import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3005';
const API_KEY = 'a2054a71236e85e152d3e1903d6dc81e94bbff54c3dd01b1591aec940c5b6024';

let socket = null;

/**
 * Connexion au serveur Socket.io
 */
export function connectSocket() {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: API_KEY,
    },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('✅ Socket.io connecté:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.io déconnecté:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Erreur connexion Socket.io:', error);
  });

  return socket;
}

/**
 * Déconnexion du serveur Socket.io
 */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Écouter l'événement de connexion d'un tenant
 */
export function onTenantConnected(callback) {
  if (!socket) connectSocket();
  socket.on('tenant_connected', callback);
  
  return () => socket.off('tenant_connected', callback);
}

/**
 * Écouter le QR code d'un tenant
 */
export function onTenantQR(callback) {
  if (!socket) connectSocket();
  socket.on('tenant_qr', callback);
  
  return () => socket.off('tenant_qr', callback);
}

/**
 * Écouter les changements de statut d'un tenant
 */
export function onTenantStatusUpdate(callback) {
  if (!socket) connectSocket();
  socket.on('tenant_status_update', callback);
  
  return () => socket.off('tenant_status_update', callback);
}

/**
 * Écouter les mises à jour de la file de messages
 */
export function onQueueUpdate(callback) {
  if (!socket) connectSocket();
  socket.on('queue_update', callback);
  
  return () => socket.off('queue_update', callback);
}

/**
 * Obtenir l'instance socket actuelle
 */
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
  getSocket,
};
