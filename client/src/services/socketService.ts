import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In dev Vite proxy or direct backend port 3000
    const serverUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin;
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[WebRTC Socket] Connected:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[WebRTC Socket] Connection error:', err.message);
    });
  }
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
