import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";

import MsgList from "./MsgList";
import type { IMsg } from "@/types";
import NewMsgInput from "./NewMsgInput";
import useAppContext from "@/hooks/useAppContext";
import defaultUserSvg from "@/assets/profile-default-svgrepo-com.svg"
import { useSocket } from "@/context/SocketContext";

function MsgListSection() {
  const { socket } = useSocket();
  const { selectedChat, setChatList } = useAppContext()
  const [msgList, setMsgList] = useState<IMsg[]>([])
  const messageContainerRef = useRef<HTMLDivElement>(null);


  const handleNewMessage = useCallback((newMsg: any) => {
    setMsgList((prev) => {
      return [...prev, newMsg];
    });
    setChatList((prev) => {
      const chatCard = prev.find(ele => ele._id == newMsg.chat_id);
      const otherChats = prev.filter(ele => ele._id != newMsg.chat_id);
      if (chatCard) {
        return [
          {
            ...chatCard,
            last_msg: newMsg.text,
            unread_msg_count: ((selectedChat?._id != chatCard._id) ? (chatCard.unread_msg_count || 0) + 1 : undefined),
            updatedAt: (new Date(newMsg.createdAt)).getUTCSeconds()
          },
          ...otherChats
        ];
      }
      return otherChats;
    });

    const container = messageContainerRef.current;
    if (container && selectedChat?._id == newMsg.chat_id) {
      const threshold = window.innerHeight;
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;

      if (distanceFromBottom <= threshold) {
        requestAnimationFrame(() => {
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 10);
        });
      }
    }
  }, [selectedChat])

 

  useEffect(() => {
    if (!socket) return;

    socket.on('new_msg', handleNewMessage);
    return () => {
      socket.off('new_msg', handleNewMessage);
    };
  }, [socket, handleNewMessage]);

  if (selectedChat) {
    const { avatarUrl: groupAvatarUrl, name: groupChatName } = selectedChat

    const avatarUrl = groupAvatarUrl
    const chatName = groupChatName


    return (
      <div className='relative flex flex-col h-full'>
        <div className="flex px-10 py-1 border-b shadow">
          <Avatar className="w-12 h-12 rounded-full overflow-hidden">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={`${chatName}'s avatar`} />}
            {!avatarUrl && <AvatarImage src={defaultUserSvg} alt={`${chatName}'s avatar`} />}

          </Avatar>
          <div className="flex-1 ml-4 overflow-hidden">
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold truncate">{chatName}</p>
            </div>
            <div className='flex pr-5'>
              <p className="text-sm truncate"></p>
              <span><em>{msgList.length}</em></span>
            </div>
          </div>
        </div>


        <MsgList msgList={msgList} setMsgList={setMsgList} messageContainerRef={messageContainerRef} />

        <div className='absolute bottom-5 w-full px-10'>
          <NewMsgInput handleNewMessage={handleNewMessage} />
        </div>
      </div>
    )
  } else {
    return <div></div>
  }
}

export default MsgListSection