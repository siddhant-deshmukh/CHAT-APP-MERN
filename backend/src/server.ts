import cors from 'cors';
import http from 'http';
import morgan from 'morgan';
import helmet from 'helmet';
import logger from 'jet-logger';
import mongoose, { Types } from 'mongoose';
import { Server } from 'socket.io';
import express, { Request, Response, NextFunction } from 'express';



import BaseRouter from '@src/routes';
import { initializeSocket } from './socket';
import ENV from '@src/common/constants/ENV';
import { verifyJWT } from './common/util/jwt';
import { NodeEnvs } from '@src/common/constants';
import { RouteError } from '@src/common/util/route-errors';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';
import ChatMember from '@src/models/ChatMembers';


/******************************************************************************
                                Setup
******************************************************************************/

const app = express();

const mongoURI = ENV.MongoUrl;



const connectDB = async () => {
  try {
    const conn = await mongoose.connect(mongoURI);
    logger.err(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.err(error, true);
    throw error;
  }
};
connectDB();

// **** Middleware **** //

app.use(cors({
  origin: ENV.ClientUrl,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (ENV.NodeEnv === NodeEnvs.Dev) {
  app.use(morgan('dev'));
}

if (ENV.NodeEnv === NodeEnvs.Production) {
  if (!process.env.DISABLE_HELMET) {
    app.use(helmet());
  }
}


app.get('/', (_, res) => {
  res.status(200).json({ msg: 'API is running' });
});
app.use('/', BaseRouter);

app.use((err: Error, _: Request, res: Response, next: NextFunction) => {
  if (ENV.NodeEnv !== NodeEnvs.Test.valueOf()) {
    logger.err(err, true);
  }
  let status = HttpStatusCodes.BAD_REQUEST;
  if (err instanceof RouteError) {
    status = err.status;
    res.status(status).json({ error: err.message, message: err.message });
  }
  return next(err);
});


const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: ENV.ClientUrl, // Your React app's URL
    methods: ['GET', 'POST'],
  },
});
io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error('Authentication failed: No token provided.');
    return next(new Error('Authentication error: No token provided.'));
  }

  try {
    const decoded = verifyJWT(token);
    if (!decoded._id) throw 'Invalid token';

    next();
  } catch (err) {
    console.error('Authentication failed: Invalid token.');
    return next(new Error('Authentication error: Invalid token.'));
  }
});


io.on('connection', (socket) => {

  const token = socket.handshake.auth.token;
  try {
    const decoded = verifyJWT(token);
    const userId = decoded._id;

    //@ts-ignore
    socket.userId = userId.toString();

    socket.on('switch-chat', async (chatId: string, prevChatId?: string) => {
      const isMember = await ChatMember.exists({ chat_id: new Types.ObjectId(chatId), user_id: new Types.ObjectId(userId) });

      if (prevChatId)
        socket.leave(prevChatId);
      if (isMember) {
        // const roomsToLeave = [...socket.rooms].filter(room => room !== userId.toString() && room !== socket.id);
        // roomsToLeave.forEach(room => socket.leave(room));
        socket.join(chatId);
      }
    });
    // You can also join a room based on the user ID
    socket.join(userId.toString());

  } catch (err) {
    console.error('Failed to get user ID after connection:', err);
    // You might want to disconnect the socket here if the token is invalid
    socket.disconnect();
    return;
  }

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
initializeSocket(io);


export default server;