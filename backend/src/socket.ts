import { Server } from 'socket.io';

let io: Server;

export function initializeSocket(socketServer: Server) {
  io = socketServer;
}

export function getSocketIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}


export function sendNewMessage(emitTo: string, message: any) {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  io.to(emitTo).emit('new_msg', message);
}

export function sendNewChat(emitTo: string, message: any) {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  io.to(emitTo).emit('new_chat', message);
}