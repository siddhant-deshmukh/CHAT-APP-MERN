import { useCallback, useEffect } from "react";

import ChatListCard from "./ChatListCard";
import useAppContext from "@/hooks/useAppContext";
import { get } from '@/lib/apiCall';
import type { IChatListCardData } from "@/types";
import { useSocket } from "@/context/SocketContext";


function ChatList() {
  const { chatList, selectedChat, setChatList, setSelectedChat } = useAppContext()
  const { socket } = useSocket();

  useEffect(() => {
    get<{ chats: IChatListCardData[] }>('/chat')
      .then((res) => {
        if (res && Array.isArray(res.chats)) {
          setChatList(res.chats)
        }
      })
  }, [setChatList]);

  const handleMsgSeen = useCallback(({
    chat_id, last_seen
  }: { user_id: string, chat_id: string, last_seen: string }) => {
    setSelectedChat(prev => {
      if (!prev || prev._id != chat_id ) return prev;

      return { ...prev, minLastSeen: last_seen }
    })
  }, [setSelectedChat]);

  const handleNewMessage = useCallback((data: any) => {
    setChatList((prev) => {
      return [
        data,
        ...prev
      ]
    });
  }, [setChatList]);

  useEffect(() => {
    if (!socket) return;


    socket.on('new_chat', handleNewMessage);
    socket.on('chat_seen', handleMsgSeen);

    return () => {
      socket.off('new_chat', handleNewMessage);
      socket.off('chat_seen', handleMsgSeen);
    };
  }, [socket, handleMsgSeen, handleNewMessage]);


  return (
    <div className='flex flex-col max-h-full custom-scrollbar overflow-y-auto'>
      {
        chatList.map(ele => {
          const props = { ...ele, isSelected: (selectedChat && ele._id === selectedChat._id) }
          return <ChatListCard key={ele._id} {...props} />
        })
      }
    </div>
  )
}

export default ChatList