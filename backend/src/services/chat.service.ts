import ChatMember from '@src/models/ChatMembers';
import Message from '@src/models/Message';
import User from '@src/models/User';
import { emitMessage, sendNewMessage } from '@src/socket';
import mongoose, { Types } from 'mongoose';

export async function getMessages({ chat_id, limit, prev_msg_id, msg_id, author_id }: {
  chat_id: Types.ObjectId,
  prev_msg_id?: Types.ObjectId,
  limit?: string,
  msg_id?: Types.ObjectId,
  author_id?: Types.ObjectId,
}) {
  const msgs = await Message.aggregate([
    { $match: { chat_id: { $eq: chat_id } } },
    ...(msg_id ? [{ $match: { _id: msg_id } }] : []),
    ...(prev_msg_id ? [{ $match: { _id: { $lt: prev_msg_id } } }] : []),
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
  if (author_id) {
    await ChatMember.updateOne({ user_id: author_id, chat_id: chat_id }, { last_seen: Date.now() });
    await emitEventToChats(chat_id.toString(), 'chat_seen', { message: { user_id: author_id, chat_id: chat_id, last_seen: new Date() } });
  }

  return msgs;
}

export async function getChatsOfUser({ user_id: user_id_str, chat_id: chat_id_str }: {
  user_id: string,
  chat_id?: string,
}) {
  const user_id = new mongoose.Types.ObjectId(user_id_str);
  const chat_id = chat_id_str ? new mongoose.Types.ObjectId(chat_id_str) : null;

  const chats = await ChatMember.aggregate([
    ...(chat_id ? [{ $match: { chat_id: new Types.ObjectId(chat_id_str) } }] : []),
    { $match: { user_id } },
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
                    cond: { $ne: ['$$member', user_id] },
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

  return chats;
}

export async function getChatMemersGroupData(user_id: string, chat_id: string) {
  const ans_ = await ChatMember.aggregate([
    {
      $match: {
        $and: [
          { user_id: { $ne: new Types.ObjectId(user_id) } }, 
          { chat_id: new Types.ObjectId(chat_id) }, 
        ]
      }
    },
  ]);
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
  ]) as [{
    totalChatMember: number,
    minLastSeen: string,
  }];
  return ans ? ans[0] : null;
}

export async function emitEventToChats(chat_id: string, event_name: string, { exclude, message }: { exclude?: string, message: any }) {
  if (chat_id) {
    const members = (await ChatMember.find({ chat_id: chat_id }).lean()).map((ele) => ele.user_id);
    const sendMemberNewMsgPromiseArr = members.map(async (user_id) => {
      if (!exclude || user_id.toString() != exclude) {
        console.log(user_id.toString(), event_name)
        emitMessage(user_id.toString(), event_name, message);
      }
    })
    await Promise.all(sendMemberNewMsgPromiseArr);
  }
}