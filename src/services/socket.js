/**
 * Service Socket.io pour les événements temps réel
 * Utilise le proxy Vite en dev (même origine) pour éviter les problèmes CORS.
 */

import { io } from 'socket.io-client';

// Toujours pointer directement vers le backend (port 3005)
const SOCKET_URL = 'http://127.0.0.1:3005';

let socket = null;

export function connectSocket() {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    // Pas de token en dev (BRIDGE_API_KEY vide → backend laisse passer)
    auth: {},
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log(' Socket.io connecté:', socket.id);
  });
  socket.on('disconnect', (reason) => {
    console.log(' Socket.io déconnecté:', reason);
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
