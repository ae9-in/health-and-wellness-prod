import { io } from 'socket.io-client';
import { API_BASE } from './api';

const SOCKET_URL = API_BASE.replace('/api', '');

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
});

socket.on('connect', () => {
  console.log('Connected to socket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from socket server');
});
