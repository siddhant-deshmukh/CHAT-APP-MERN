import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';

import User from '@src/models/User';
import { RouteError } from '@src/common/util/route-errors';
import Message, { IMessageCreate } from '@src/models/Message';
import Chat, { ChatType, IChatCreate } from '@src/models/Chat';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import ChatMember, { ChatMemberRole, IChatMember } from '@src/models/ChatMembers';
import { sendNewMessage } from '@src/socket';


const createOne = async (req: Request, res: Response) => {
  const {
    chat_type, name: chat_name, bio, avatarUrl: chat_avatar, members: _members,
  } = req.body as IChatCreate & { members: string[] };

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
  await Promise.all(createChatMemberPromiseArray);

  res.status(HttpStatusCodes.ACCEPTED).json({ chat: newChat });
};

const getChats = async (req: Request, res: Response) => {
  const chats = await ChatMember.aggregate([
    { $match: { user_id: req.user_id } },
    {
      $lookup: {
        from: 'chats',
        localField: 'chat_id',
        foreignField: '_id',
        as: 'chatDetails',
      },
    },
    { $unwind: '$chatDetails' },
    { $sort: { 'chatDetails.updatedAt': -1 } },
    {
      $addFields: {
        otherMemberId: {
          $cond: {
            if: { $eq: ['$chatDetails.chat_type', 'user_chat'] },
            then: {
              $arrayElemAt: [
                {
                  $filter: {
                    input: '$chatDetails.members',
                    as: 'member',
                    cond: { $ne: ['$$member', req.user_id] },
                  },
                },
                0, // Take the first (and only) element from the filtered array
              ],
            },
            else: null, // If not a 'user_chat', no 'otherMemberId'
          },
        },
      },
    },
    {
      $lookup: {
        from: User.collection.name, // Use the actual collection name from the Mongoose model
        localField: 'otherMemberId',
        foreignField: '_id',
        as: 'otherUserDetails',
      },
    },
    {
      $unwind: {
        path: '$otherUserDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: User.collection.name, // Use the actual collection name from the Mongoose model
        localField: 'chatDetails.last_msg_author',
        foreignField: '_id',
        as: 'lastMsgAuthorDetails',
      },
    },
    {
      $unwind: {
        path: '$lastMsgAuthorDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: Message.collection.name, // Use the actual collection name from the Mongoose model
        let: {
          currentChatId: '$chatDetails._id',
          userLastSeen: '$last_seen', // 'last_seen' comes from the original ChatMember document
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$chat_id', '$$currentChatId'] },
                  { $gt: ['$createdAt', '$$userLastSeen'] },
                ],
              },
            },
          },
          {
            $limit: 101,
          },
          {
            $count: 'unReadCount', // Count the matched messages
          },
        ],
        as: 'unreadMessagesCount', // Output array, e.g., [{ unReadCount: 5 }] or []
      },
    },
    {
      $unwind: {
        path: '$unreadMessagesCount',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'chatDetails.name': {
          $cond: {
            if: {
              $and: [
                { $eq: ['$chatDetails.chat_type', 'user_chat'] },
                { $ne: ['$otherUserDetails', null] }, // Check if other user details were found
              ],
            },
            then: '$otherUserDetails.name',
            else: '$chatDetails.name', // Default to the chat's own name (e.g., for group chats)
          },
        },
        'chatDetails.avatarUrl': {
          $cond: {
            if: {
              $and: [
                { $eq: ['$chatDetails.chat_type', 'user_chat'] },
                { $ne: ['$otherUserDetails', null] },
              ],
            },
            then: '$otherUserDetails.avatarUrl',
            else: '$chatDetails.avatarUrl', // Default to the chat's own avatar URL
          },
        },
        'chatDetails.lastMsgUserDetails': '$lastMsgAuthorDetails',
        'chatDetails.unread_msg_count': '$unreadMessagesCount.unReadCount',
      },
    },
    { $replaceRoot: { newRoot: '$chatDetails' } },
  ]);

  res.status(HttpStatusCodes.OK).json({ chats });
};

const addMsg = async (req: Request, res: Response) => {
  const { text, type } = req.body as IMessageCreate;

  const msg = await Message.create({
    author_id: req.user_id,
    chat_id: req.chat_user?.chat_id,
    text,
    type,
  });

  const members = (await ChatMember.find({ chat_id: req.chat_user?.chat_id }).lean()).map((ele) => ele.user_id);
  members.forEach((user_id) => {
    if(user_id.toString() != req.user_id?.toString()) {
      sendNewMessage(user_id.toString(), {
        ...(msg.toJSON()),
        msgAuthor: {
          _id: req.user_id,
          // name: req.chat_user.
        }
      });
    }
  })

  res.status(HttpStatusCodes.OK).json({ msg });
};

const getChatMsgs = async (req: Request, res: Response) => {
  const { prev_msg_id, limit } = req.query as { prev_msg_id?: string, limit?: string };

  const msgs = await Message.aggregate([
    { $match: { chat_id: { $eq: req.chat_user?.chat_id } } },
    ...(prev_msg_id ? [{ $match: { _id: { $lt: new mongoose.Types.ObjectId(prev_msg_id) } } }] : []),
    { $sort: { createdAt: -1, _id: -1 } },
    { $limit: limit ? parseInt(limit) : 25 },
    {
      $lookup: {
        from: User.collection.name,
        foreignField: '_id',
        localField: 'author_id',
        as: 'msgAuthor',
        pipeline: [
          { $project: { name: 1, user_name: 1 } },
        ],
      },
    },
    {
      $unwind: {
        path: '$msgAuthor',
        preserveNullAndEmptyArrays: true,
      },
    },
    { $sort: { createdAt: -1, _id: 1 } },
  ]);

  res.status(HttpStatusCodes.OK).json({ msgs });
};

export default {
  createOne,
  getChats,
  addMsg,
  getChatMsgs,
} as const;