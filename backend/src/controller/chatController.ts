import mongoose, { Types } from 'mongoose';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';

import User from '@src/models/User';
import { RouteError } from '@src/common/util/route-errors';
import Message, { IMessageCreate } from '@src/models/Message';
import Chat, { ChatType, IChatCreate } from '@src/models/Chat';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import ChatMember, { ChatMemberRole, IChatMember } from '@src/models/ChatMembers';
import { sendNewChat, sendNewMessage } from '@src/socket';
import { getChatsOfUser, getMessages } from '@src/services/chat.service';


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
    avatarUrl: chat_avatar,
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

  const alertChatMembersArr = members.map(async (member_id) => {
    if (member_id != user_id.toString()) {
      if (chat_type == 'user_chat') {
        // const chats = await getChatsOfUser({ user_id: member_id, chat_id: (newChat._id as Types.ObjectId).toString() as string })
        sendNewChat(member_id, newChat.toJSON());
      } else {
        sendNewChat(member_id, newChat.toJSON());
      }
    }
  })


  await Promise.all(createChatMemberPromiseArray);
  await Promise.all(alertChatMembersArr);


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

  const members = (await ChatMember.find({ chat_id: req.chat_user?.chat_id }).lean()).map((ele) => ele.user_id);

  const sendMemberNewMsgPromiseArr = members.map(async (user_id) => {
    if (user_id.toString() != req.user_id?.toString()) {

      // const newMsg = await getMessages({
      //   chat_id,
      //   msg_id: msg._id as Types.ObjectId
      // });
      // if (newMsg && newMsg.length > 0) {
      //   sendNewMessage(user_id.toString(), newMsg[0]);
      // }
      sendNewMessage(user_id.toString(), {
        ...(msg.toJSON()),
        msgAuthor: {
          _id: req.user_id
        }
      });
    }
  })
  await Promise.all(sendMemberNewMsgPromiseArr);

  res.status(HttpStatusCodes.OK).json({ msg });
};

const getChatMsgs = async (req: Request, res: Response) => {
  const { prev_msg_id, limit } = req.query as { prev_msg_id?: string, limit?: string };
  if (!req.chat_user) {
    throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Not Allowed');
  }

  const msgs = await getMessages({
    prev_msg_id: new Types.ObjectId(prev_msg_id),
    limit,
    chat_id: req.chat_user?.chat_id
  });

  res.status(HttpStatusCodes.OK).json({ msgs });
};

export default {
  createOne,
  getChats,
  addMsg,
  getChatMsgs,
} as const;