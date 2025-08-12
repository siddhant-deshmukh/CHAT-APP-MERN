import { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';

import { RouteError } from '@src/common/util/route-errors';
import Message, { IMessageCreate } from '@src/models/Message';
import Chat, { ChatType, IChatCreate } from '@src/models/Chat';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import ChatMember, { ChatMemberRole, IChatMember } from '@src/models/ChatMembers';
import { sendNewChat } from '@src/socket';
import { emitEventToChats, getChatsOfUser, getMessages } from '@src/services/chat.service';
import { faker } from '@faker-js/faker';


const createOne = async (req: Request, res: Response) => {
  const {
    chat_type, name: chat_name, bio, avatarUrl: chat_avatar, members: _members,
  } = req.body as IChatCreate & { members: string[] };
  if (!req.user_id) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Not Allowed');
  }

  const user_id = req.user_id

  const members = Array.from(new Set(_members))

  if (!(req.user_id && members.includes(req.user_id.toString())))
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Must be member of this chat');

  if (chat_type == ChatType.Group && (!chat_name || !Array.isArray(members) || members.length < 2))
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Missing members, Chat Name');

  if (chat_type == ChatType.User && members.length != 2)
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Only allowed two members in User Chat');


  if (chat_type == ChatType.User) {
    const existing = await Chat.findOne({
      chat_type: ChatType.User,
      members: {
        $size: 2,
        $all: members.map(ele => new ObjectId(ele)),
      },
    });
    if (existing) throw new RouteError(HttpStatusCodes.CONFLICT, 'Chat already exist with user');
  }


  const newChat = await Chat.create({
    chat_type,
    name: chat_name,
    bio,
    avatarUrl: chat_avatar ? chat_avatar : ( chat_type == ChatType.Group ? faker.image.avatarGitHub() : null ),
    members: (chat_type == ChatType.User) ? members : undefined,
  });
  const createChatMemberPromiseArray = members.map((member_id) => {
    let role: IChatMember['role'] = ChatMemberRole.Member;
    if (member_id == req.user_id?.toString()) role = ChatMemberRole.Admin;

    return ChatMember.create({
      user_id: member_id,
      chat_id: newChat._id,
      role,
    });
  });

  await Promise.all(createChatMemberPromiseArray);

  if (chat_type == 'user_chat') {
    const alertChatMembersArr = members.map(async (member_id) => {
      if (member_id != user_id.toString()) {
        const chats = await getChatsOfUser({ user_id: member_id, chat_id: (newChat._id as Types.ObjectId).toString() })
        sendNewChat(member_id, chats[0]);
      }
    });
    await Promise.all(alertChatMembersArr);
  } else {
    await emitEventToChats((newChat._id as ObjectId).toString(), 'new_chat', { exclude: req.user_id?.toString(), message: newChat.toJSON() })
  }


  res.status(HttpStatusCodes.ACCEPTED).json({ chat: newChat });
};

const getChats = async (req: Request, res: Response) => {
  if (!req.user_id) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Not Allowed');
  }
  const chats = await getChatsOfUser({ user_id: req.user_id.toString() })

  res.status(HttpStatusCodes.OK).json({ chats });
};

const addMsg = async (req: Request, res: Response) => {
  const { text, type } = req.body as IMessageCreate;

  if (!req.chat_user) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Not Allowed');
  }
  const chat_id = req.chat_user?.chat_id;

  const msg = await Message.create({
    author_id: req.user_id,
    chat_id: req.chat_user?.chat_id,
    text,
    type,
  });


  const newMsg = await getMessages({
    chat_id,
    msg_id: msg._id as Types.ObjectId
  });
  await ChatMember.updateOne({ user_id: req.user_id, chat_id: chat_id }, { last_seen: Date.now() });
  await emitEventToChats(chat_id.toString(), 'new_msg', { exclude: req.user_id?.toString(), message: newMsg[0] });

  res.status(HttpStatusCodes.OK).json({ msg: newMsg.length > 0 ? newMsg[0] : msg.toJSON() });
};

const getChatMsgs = async (req: Request, res: Response) => {
  const { prev_msg_id, limit } = req.query as { prev_msg_id?: string, limit?: string };
  if (!req.chat_user) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Not Allowed');
  }

  const msgs = await getMessages({
    prev_msg_id: new Types.ObjectId(prev_msg_id),
    limit,
    chat_id: req.chat_user?.chat_id,
    author_id: req.user_id,
  });

  res.status(HttpStatusCodes.OK).json({ msgs });
};

const getChat = async (req: Request, res: Response) => {
  if (!req.user_id) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid Token');
  }
  const chat_id = req.params.chat_id;
  const user_id = req.user_id;

  const ans = await ChatMember.aggregate([
    {
      $match: {
        $and: [
          { user_id: { $ne: new Types.ObjectId(user_id) } }, 
          { chat_id: new Types.ObjectId(chat_id) }, 
        ]
      }
    },
    {
      $group: {
        _id: null,
        "totalChatMembers": {
          $sum: 1,
        },
        "minLastSeen": {
          $min: '$last_seen',
        }
      },
    },
    {
      $project: {
        _id: 0,
        totalChatMembers: { $add: ["$totalChatMembers", 1] },
        minLastSeen: 1
      }
    }
  ]);

  if (!ans || ans.length < 1) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Not Allowed');
  }
  // const chat = await getChatsOfUser({ user_id: user_id.toString(), chat_id: chat_id.toString() });

  res.status(HttpStatusCodes.OK).json({ ...(ans[0]) })
}

export default {
  createOne,
  getChats,
  addMsg,
  getChatMsgs,
  getChat,
} as const;