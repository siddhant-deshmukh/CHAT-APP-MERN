import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

import defaultUserSvg from "@/assets/profile-default-svgrepo-com.svg"


import React, { useState, useEffect, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs } from '@radix-ui/react-tabs';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchIcon } from 'lucide-react';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { get, post } from '@/lib/apiCall';
import useAppContext from '@/hooks/useAppContext';
import type { IChatListCardData } from '@/types';



interface ChatListMember {
  _id: string;
  name: string;
  user_name: string;
  __v: number;
}


export function CreateNewChatDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [groupChatName, setGroupChatName] = useState('');
  const [selectedPersonalChatMemberId, setSelectedPersonalChatMemberId] = useState<string[]>([]);
  const [selectedGroupChatMemberIds, setSelectedGroupChatMemberIds] = useState<string[]>([]);

  const { user, chatList, setChatList } = useAppContext()

  // Simulate fetching members
  const [allMembers, setAllMembers] = useState<ChatListMember[]>([]);
  const [orgAllMembers, setOrgAllMembers] = useState<ChatListMember[]>([]);

  useEffect(() => {
    get<{ users: ChatListMember[] }>('/user/all').then(res => {
      setOrgAllMembers(res.users);
    })
  }, []);

  const resetForm = () => {
    setGroupChatName('');
    setSelectedPersonalChatMemberId([]);
    setSelectedGroupChatMemberIds([]);
    setActiveTab('personal');
  };

  const submitNewChatForm = useCallback(() => {
    const body: any = {
      members: [...selectedPersonalChatMemberId, user?._id],
      chat_type: 'group_chat',
    }
    if (activeTab === 'personal') {
      body.chat_type = 'user_chat'
    } else {
      body.name = groupChatName
    }
    post<{ chat: IChatListCardData }, any>('chat', body).then(res => {
      if (res.chat) {
        setChatList(prev => {
          if (body.chat_type == 'user_chat') {
            const other_member = allMembers.find((ele) => ele._id === selectedPersonalChatMemberId[0])
            return [{
              ...res.chat,
              name: other_member?.name || null,
            }, ...prev]
          }
          return [res.chat, ...prev]
        })
      }
      setIsOpen(false); // Close the dialog after submission
      resetForm(); // Reset form fields
    })
  }, [selectedPersonalChatMemberId, groupChatName]);

  useEffect(() => {
    if (activeTab == 'personal') {
      setAllMembers(() => {
        const all_existing_user_chat_ids = chatList
          .filter((ele) => ele.chat_type == 'user_chat')
          .map(ele => {
            if (Array.isArray(ele.members) && ele.members.length == 2) {
              const dropUser = ele.members.filter(ele => ele != user?._id);
              return dropUser[0]
            }
            return ele._id
          });
        return orgAllMembers.filter(ele => {
          return ele._id != user?._id && !all_existing_user_chat_ids.includes(ele._id)
        })
      });
    } else {
      setAllMembers(() => {
        return orgAllMembers.filter(ele => {
          return ele._id != user?._id
        })
      });
    }
  }, [activeTab, chatList, orgAllMembers])

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="icon" className="rounded-full">
          <PlusIcon className="h-4 w-4" />
          <span className="sr-only">New Chat</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
          <DialogDescription>
            Choose to create a personal or group chat.
          </DialogDescription>
        </DialogHeader>


        <ChatMemberSelector
          members={allMembers}
          selectedMemberIds={selectedPersonalChatMemberId}
          onSelectMembers={setSelectedPersonalChatMemberId}
          singleSelect={true} // Enable single selection for personal chat
        />
        {/* <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Personal Chat</TabsTrigger>
            <TabsTrigger value="group">Group Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-4">
            <div className="grid gap-4 py-4">
              <ChatMemberSelector
                members={allMembers}
                selectedMemberIds={selectedPersonalChatMemberId}
                onSelectMembers={setSelectedPersonalChatMemberId}
                singleSelect={true} // Enable single selection for personal chat
              />
            </div>
          </TabsContent>

          <TabsContent value="group" className="mt-4">
            <div className="grid gap-4 py-4">
              <div className="">
                <Label htmlFor="group-name" className="text-right mb-2">
                  Group Name
                </Label>
                <Input
                  id="group-name"
                  value={groupChatName}
                  onChange={(e) => setGroupChatName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <ChatMemberSelector
                members={allMembers}
                selectedMemberIds={selectedGroupChatMemberIds}
                onSelectMembers={setSelectedGroupChatMemberIds}
                singleSelect={false} // Allow multiple selection for group chat
              />
            </div>
          </TabsContent>
        </Tabs> */}
        <DialogFooter>
          <Button type="submit" onClick={submitNewChatForm}>
            Create Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5V19" />
      <path d="M5 12H19" />
    </svg>
  );
}



//* ------------------------------

interface IProps {
  _id: string;
  name: string;
  user_name: string;
  avatarUrl?: string;
  __v: number;
}

interface ChatMemberSelectorProps {
  members: IProps[];
  selectedMemberIds: string[];
  onSelectMembers: (selectedIds: string[]) => void;
  singleSelect?: boolean; // New prop for single selection mode
}

export function ChatMemberSelector({
  members,
  selectedMemberIds,
  onSelectMembers,
  singleSelect = false,
}: ChatMemberSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<IProps[]>(members);

  useEffect(() => {
    setFilteredMembers(
      members.filter(
        (member) =>
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.user_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, members]);

  const handleSelectMember = (memberId: string, isChecked: boolean) => {
    if (singleSelect) {
      // If in single-select mode, only allow one selection
      onSelectMembers(isChecked ? [memberId] : []);
    } else {
      // Multiple selection mode
      if (isChecked) {
        onSelectMembers([...selectedMemberIds, memberId]);
      } else {
        onSelectMembers(selectedMemberIds.filter((id) => id !== memberId));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className='flex '>
        <Input
          className='w-full rounded-tr-none max-w-60 outline-none focus:shadow-none ml-auto rounded-br-none border-r-0'
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button className='rounded-tl-none rounded-bl-none'>
          <SearchIcon />
        </Button>
      </div>
      <ScrollArea className="h-48 w-full border rounded-sm">
        <div className="p-4">
          {filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div key={member._id} className="flex items-center space-x-2 border-b p-2 rounded-sm">
                <Checkbox
                  id={`member-${member._id}`}
                  checked={selectedMemberIds.includes(member._id)}
                  onCheckedChange={(checked) =>
                    handleSelectMember(member._id, checked as boolean)
                  }
                />
                <div className="flex items-center space-x-2">
                  <Avatar>
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={`${member.name}'s avatar`} />}
                    {!member.avatarUrl && <AvatarImage src={defaultUserSvg} alt={`${member.name}'s avatar`} />}
                  </Avatar>
                  <Label htmlFor={`member-${member._id}`} className="flex">
                    <span className="font-medium">{member.name}</span>
                    <span className="text-sm text-gray-500">@{member.user_name}</span>
                  </Label>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500">No members found.</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}