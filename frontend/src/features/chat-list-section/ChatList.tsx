import { useEffect } from "react";

import ChatListCard from "./ChatListCard";
import useAppContext from "@/hooks/useAppContext";
import { get } from '@/lib/apiCall';
import type { IChatListCardData } from "@/types";


function ChatList() {
  const { chatList, selectedChat, setChatList } = useAppContext()

  useEffect(() => {
    get<{ chats: IChatListCardData[] }>('/chat')
      .then((res)=> {
        if(res && Array.isArray(res.chats)) {
          setChatList(res.chats)
        }
      })
  }, [setChatList]);

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