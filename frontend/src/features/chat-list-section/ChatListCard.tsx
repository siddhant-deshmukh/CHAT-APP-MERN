import { MoreVertical } from 'lucide-react'
import { Avatar, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import type { IChatListCardData } from '@/types'
import React, { useState } from 'react'
import defaultUserSvg from "@/assets/profile-default-svgrepo-com.svg"
import useAppContext from '@/hooks/useAppContext'
import { get } from '@/lib/apiCall'

interface IProps extends IChatListCardData {
  isSelected: boolean | null
}

function ChatListCard(props: IProps) {

  const { avatarUrl: groupAvatarUrl, name: groupChatName, isSelected, last_msg, updatedAt: lastMessageTime, unread_msg_count } = props
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)


  const lastMessageTimeDate = new Date(lastMessageTime)
  const chatName = groupChatName
  const avatarUrl = groupAvatarUrl || null

  const { setSelectedChat, setChatList, prevSelectedChatId } = useAppContext()

  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <div className="relative group cursor-pointer">
      <div
        onClick={() => {
          get<{ minLastSeen: string, totalChatMembers: number }>(`/${props._id}`).then((res) => {
            setSelectedChat((prev) => {
              prevSelectedChatId.current =  prev ? prev?._id : null;
              return {
                ...props,
                ...res,
              }
            });
            setChatList((prev) => {
              return prev.map(ele => {
                if (ele._id == props._id) {
                  return {
                    ...ele,
                    unread_msg_count: undefined
                  }
                }
                return ele
              })
            })
          });
        }}
        className={`flex items-center px-4 py-5 border-b shadow-2xl mx-2 ${isSelected ? 'rounded-xl bg-primary/10' : 'hover:rounded-xl hover:bg-primary/5'}`}>
        {/* Avatar */}
        <Avatar className="w-12 h-12 rounded-full overflow-hidden">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={`${chatName}'s avatar`} />}
          {!avatarUrl && <AvatarImage src={defaultUserSvg} alt={`${chatName}'s avatar`} />}

          {/* <AvatarFallback>{avatarFallback}</AvatarFallback> */}
        </Avatar>
        {/* Chat details and last message time */}
        <div className="flex-1 ml-4 overflow-hidden">
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold ttruncate">{chatName}</p>
            <span className="text-xs">{lastMessageTimeDate.getHours()}:{lastMessageTimeDate.getMinutes()}</span>
          </div>
          <div className='flex justify-between '>
            <p className="text-sm truncate">{last_msg}&nbsp;</p>
            {/* Dropdown Menu - appears on hover */}
            {/* The 'group-hover:opacity-100' class makes it visible on parent hover */}
          </div>
        </div>
      </div>
      <div className="absolute flex right-5 bottom-5">
        {
          unread_msg_count && <span className='rounded-full p-1 px-2 bg-green-700 text-xs text-white'>
            {unread_msg_count}
          </span>
        }
        <div
          className={`${isMenuVisible || isDropdownOpen ? 'block' : 'hidden'} group-hover:block z-50`}
          onMouseEnter={() => setIsMenuVisible(true)}
          onMouseLeave={() => setIsMenuVisible(false)}>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-full focus:outline-none transform opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <MoreVertical className="w-4 h-4 " />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className='bg-primary-foreground border shadow-2xl rounded-lg'>
              <DropdownMenuGroup>
                <DropdownMenuItem className='outline-none hover:bg-primary/10 py-2 border-b px-3 text-sm  rounded-sm'>View Contact</DropdownMenuItem>
                <DropdownMenuItem className='outline-none hover:bg-primary/10 py-2 border-b px-3 text-sm  rounded-sm'>Mute</DropdownMenuItem>
                <DropdownMenuItem className='outline-none hover:bg-primary/10 py-2 border-b px-3 text-sm  rounded-sm'>Archive</DropdownMenuItem>
                <DropdownMenuItem className='outline-none hover:bg-primary/10 py-2 border-b px-3 text-sm  rounded-sm'>Delete Chat</DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}

export default React.memo(ChatListCard)