import React, { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: 'connected' | 'pending' | 'failed' | 'not-connected';
  connectSocket: () => void; // Now takes a token instead of userId
  disconnectSocket: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);
const API_BASE_URL = import.meta.env.VITE_API_BASE;

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<'connected' | 'pending' | 'failed' | 'not-connected'>('pending');

  const connectSocket = useCallback(() => {
    if ((socket && socket.connected) || !['connected', 'failed'].includes(isConnected) ) {
      console.log('Socket already connected.');
      return;
    }

    const newSocket = io(API_BASE_URL, { // Replace with your NestJS Socket.IO URL
      transports: ['websocket', 'polling'],
      auth: {
        token: localStorage.getItem('authToken'), // Send the JWT token here
      },
    });

    newSocket.on('connect', () => {
      setIsConnected('connected');
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected('not-connected');
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    setSocket(newSocket);
  }, [socket, isConnected]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected('not-connected');
      console.log('Socket disconnected manually.');
    }
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectSocket, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};