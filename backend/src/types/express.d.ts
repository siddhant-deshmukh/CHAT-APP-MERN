import { Express } from 'express-serve-static-core';
import { IChat } from '@src/models/Chat';
import { IChatMember } from '@src/models/ChatMembers';
import { ObjectId } from 'mongodb';

declare global {
  namespace Express {
    interface Request {
      user_id?: ObjectId;
      chat?: IChat;
      chat_user?: IChatMember;
    }
  }
}