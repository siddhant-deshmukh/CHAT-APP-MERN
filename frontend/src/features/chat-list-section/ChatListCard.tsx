import { MoreVertical } from 'lucide-react'
import { Avatar, AvatarImage } from '@radix-ui/react-avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu'
import type { IChatListCardData } from '@/types'
import React, { useState } from 'react'
import defaultUserSvg from "@/assets/profile-default-svgrepo-com.svg"
import useAppContext from '@/hooks/useAppContext'

interface IProps extends IChatListCardData{
  isSelected: boolean | null
}

function ChatListCard(props: IProps) {
  
  const {avatarUrl: groupAvatarUrl, name : groupChatName, isSelected, last_msg, updatedAt: lastMessageTime } = props
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  
  
  const lastMessageTimeDate = new Date(lastMessageTime)
  const chatName = groupChatName 
  const avatarUrl = groupAvatarUrl || null

  const { setSelectedChat } = useAppContext()

  return (
    <div className="relative group cursor-pointer">
      <div 
        onClick={()=> { setSelectedChat(props) }}
        className={`flex items-center px-4 py-3 my-2 mx-2 ${isSelected ? 'rounded-xl ' : 'hover:rounded-xl '}`}>
        {/* Avatar */}
        <Avatar className="w-12 h-12 rounded-full overflow-hidden">
          { avatarUrl && <AvatarImage src={avatarUrl} alt={`${chatName}'s avatar`} />}
          { !avatarUrl && <AvatarImage src={defaultUserSvg} alt={`${chatName}'s avatar`} />}

          {/* <AvatarFallback>{avatarFallback}</AvatarFallback> */}
        </Avatar>
        {/* Chat details and last message time */}
        <div className="flex-1 ml-4 overflow-hidden">
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold ttruncate">{chatName}</p>
            <span className="text-xs">{lastMessageTimeDate.getHours()}:{lastMessageTimeDate.getMinutes()}</span>
          </div>
          <div className='flex pr-5'>
            <p className="text-sm truncate">{last_msg}</p>
            {/* Dropdown Menu - appears on hover */}
            {/* The 'group-hover:opacity-100' class makes it visible on parent hover */}
            
          </div>
        </div>
      </div>
      <div className="absolute right-5 bottom-2">
        <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            {/* MoreVertical icon acts as the trigger */}
            <button className="p-1 rounded-full focus:outline-none transform opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <MoreVertical className="w-4 h-4 " />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Dropdown menu items */}
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>View Contact</DropdownMenuItem>
              <DropdownMenuItem>Mute</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
              <DropdownMenuItem>Delete Chat</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default React.memo(ChatListCard)