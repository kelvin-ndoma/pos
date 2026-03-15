// src/services/socketEvents.ts
import { Server } from 'socket.io';

export const registerSocketEvents = (io: Server) => {
  io.on('connection', (socket) => {
    // TODO: auth, join rooms by tenant, etc.
    console.log('Socket connected', socket.id);
  });
};
