import { Server } from 'socket.io';
import Chat from './models/Chat';

let io: Server;

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}

export function initializeSocket(socketServer: Server) {
  io = socketServer;
}

export function getSocketIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  return io;
}

export function emitMessage(to: string, eventName: string, message: any) {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }
  io.to(to).emit(eventName, message);
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


export function getActiveUsersInChat(chatId: string): string[] {
  if (!io) {
    throw new Error('Socket.IO not initialized!');
  }

  const chatRoomSockets = io.sockets.adapter.rooms.get(chatId);
  if (!chatRoomSockets) return [];
  
  const activeUserIds = Array.from(chatRoomSockets)
    .map(socketId => io.sockets.sockets.get(socketId)?.userId)
    .filter((ele)=> (ele != undefined && typeof ele == 'string'));
    
  return activeUserIds;
}