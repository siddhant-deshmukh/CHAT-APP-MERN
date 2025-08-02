import { Router } from 'express';

import userController from '@src/controller/usersController';
import { authenticationMiddleware, chatAuthMiddleware, giveChatAccessTo } from '@src/middleware/auth.middleware';
import { ChatMemberRole } from '@src/models/ChatMembers';
import chatController from '@src/controller/chatController';

const apiRouter = Router();

apiRouter.post('/login', userController.login);
apiRouter.post('/register', userController.register);

//* For Authentication
apiRouter.use(authenticationMiddleware);

apiRouter.get('/user', userController.getOne);
apiRouter.get('/user/all', userController.getAll);

apiRouter.post('/chat', chatController.createOne);
apiRouter.get('/chat', chatController.getChats);

apiRouter.post('/:chat_id/msg',
  chatAuthMiddleware, giveChatAccessTo([ChatMemberRole.Admin, ChatMemberRole.Member]), 
  chatController.addMsg,
);

apiRouter.get('/:chat_id/msg',
  chatAuthMiddleware, giveChatAccessTo([ChatMemberRole.Admin, ChatMemberRole.Member, ChatMemberRole.Subscriber]), 
  chatController.getChatMsgs,
);

export default apiRouter;