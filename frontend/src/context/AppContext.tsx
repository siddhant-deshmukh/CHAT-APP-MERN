import React, { createContext, useState, type ReactNode } from 'react';

import type { IChatListCardData, IUser } from '@/types';
import { useApi } from '@/hooks/useApi';

interface AppContextType {
  user?: IUser | null,
  authLoading: boolean,
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>,
  chatList: IChatListCardData[],
  selectedChat: IChatListCardData | null,
  setSelectedChat: React.Dispatch<React.SetStateAction<IChatListCardData | null>>,
  setChatList: React.Dispatch<React.SetStateAction<IChatListCardData[]>>,
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // const [msgList, setMsgList] = useState<IMsg[]>([]);
  const { data: user, setData: setUser, loading: authLoading } = useApi<IUser>('GET', '/user');

  const [chatList, setChatList] = useState<IChatListCardData[]>([]);
  const [selectedChat, setSelectedChat] = useState<IChatListCardData | null>(null);
  
  const contextValue: AppContextType = {
    user,
    authLoading,
    selectedChat,
    setSelectedChat,
    setUser,
    chatList,
    setChatList
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};