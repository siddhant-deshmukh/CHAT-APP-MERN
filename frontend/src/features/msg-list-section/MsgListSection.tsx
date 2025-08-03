import { useRef, useState } from "react";
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";

import MsgList from "./MsgList";
import type { IMsg } from "@/types";
import NewMsgInput from "./NewMsgInput";
import useAppContext from "@/hooks/useAppContext";
import defaultUserSvg from "@/assets/profile-default-svgrepo-com.svg"

function MsgListSection() {
  const { selectedChat } = useAppContext()
  const [msgList, setMsgList] = useState<IMsg[]>([])
  const messageContainerRef = useRef<HTMLDivElement>(null);

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


        <MsgList msgList={msgList} setMsgList={setMsgList} messageContainerRef={messageContainerRef}/>

        <div className='absolute bottom-5 w-full px-10'>
          <NewMsgInput setMsgList={setMsgList}  messageContainerRef={messageContainerRef}/>
        </div>
      </div>
    )
  } else {
    return <div></div>
  }
}

export default MsgListSection