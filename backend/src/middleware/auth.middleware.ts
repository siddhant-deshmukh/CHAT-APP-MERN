import { ObjectId } from 'mongodb';
import { Request, Response, NextFunction } from 'express';

import ChatMember, { IChatMember } from '@src/models/ChatMembers';
import { RouteError } from '@src/common/util/route-errors';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import { verifyJWT } from '@src/common/util/jwt';

//* Validate Token, add user_id on Request
export const authenticationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Not authorized, no token');
  }

  try {
    const decoded = verifyJWT(token);
    (req).user_id = new ObjectId(decoded._id);
    next();
  } catch (err) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Not authorized, token failed');
  }
};

//* Authorizing User Member of Chat
export const chatAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const { chat_id } = req.params as { chat_id: string }; 
  const chat_user = await ChatMember.findOne({ chat_id, user_id: req.user_id });

  if(!chat_user) throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Not Member of this chat');

  req.chat_user = chat_user?.toObject();

  next();
};

//* Closure function even though memeber of function might not have access to chat
export const giveChatAccessTo = (roles: IChatMember['role'][])  => {
  return (req: Request, res: Response, next: NextFunction) => {
    if(roles.includes(req.chat_user?.role)) next();
    else throw new RouteError(HttpStatusCodes.FORBIDDEN, 'Access Denied');
  };
};