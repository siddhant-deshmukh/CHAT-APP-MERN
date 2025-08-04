import { useEffect } from "react";

import ChatListCard from "./ChatListCard";
import useAppContext from "@/hooks/useAppContext";
import { get } from '@/lib/apiCall';
import type { IChatListCardData } from "@/types";
import { useSocket } from "@/context/SocketContext";


function ChatList() {
  const { chatList, selectedChat, setChatList } = useAppContext()
  const { socket } = useSocket();

  useEffect(() => {
    get<{ chats: IChatListCardData[] }>('/chat')
      .then((res)=> {
        if(res && Array.isArray(res.chats)) {
          setChatList(res.chats)
        }
      })
  }, [setChatList]);


  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      setChatList((prev)=> {
        return [
          data,
          ...prev
        ]
      });
    };

    socket.on('new_chat', handleNewMessage);

    return () => {
      socket.off('new_chat', handleNewMessage);
    };
  }, [socket]);


  return (
    <div className='flex flex-col max-h-full overflow-y-auto'>
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