import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import express, { NextFunction } from 'express';
import logger from 'jet-logger';
import mongoose from 'mongoose';
import { Request, Response } from 'express';



import BaseRouter from '@src/routes';
import ENV from '@src/common/constants/ENV';
import { NodeEnvs } from '@src/common/constants';
import { RouteError } from '@src/common/util/route-errors';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';


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
  origin: 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204, 
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

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
    res.status(status).json({ error: err.message });
  }
  return next(err);
});


export default app;