import { io } from 'socket.io-client';
import { API_BASE } from './api';

const SOCKET_URL = API_BASE.replace('/api', '');

console.log('Initializing socket connection to:', SOCKET_URL);

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  transports: ['polling', 'websocket'], // Start with polling, then upgrade
  reconnectionAttempts: 5,
  timeout: 20000,
});

socket.on('connect', () => {
  console.log('Connected to socket server with ID:', socket.id);
  console.log('Current transport:', socket.io.engine.transport.name);
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error.message);
  // If websocket fails, it will still try to keep polling if defined
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from socket server. Reason:', reason);
});
