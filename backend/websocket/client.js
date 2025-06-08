import { Server } from 'socket.io';

let io = null;

export const initializeSocket = (httpServer) => {
  if (!io) {
    io = new Server(httpServer, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    console.log('Socket.IO server initialized');
  }
  return io;
};

export const getSocket = () => {
  if (!io) {
    console.warn('Socket.IO server not initialized');
    return null;
  }
  return io;
}; 