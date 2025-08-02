import bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import User from '@src/models/User';
import { signToken } from '@src/common/util/jwt';
import { RouteError } from '@src/common/util/route-errors';
import HttpStatusCodes from '@src/common/constants/HttpStatusCodes';

const getOne = async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.user_id }).select('-password');
  if (!user) throw new RouteError(HttpStatusCodes.NOT_FOUND, 'User Not Found');

  res.status(HttpStatusCodes.ACCEPTED).json({ ...user?.toObject() });
};

const getAll = async (req: Request, res: Response) => {
  const all_users = await User.find().select('-password');
  res.status(HttpStatusCodes.ACCEPTED).json({ users: all_users });
};

const login = async (req: Request, res: Response) => {

  const { user_name, password } = req.body as { user_name: string, password: string };
  if (!user_name || !password) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Please enter user_name and password');
  }

  const user = await User.findOne({ user_name });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new RouteError(HttpStatusCodes.UNAUTHORIZED, 'Invalid Credentials');
  }

  const token = signToken(user._id.toString());

  res.status(HttpStatusCodes.OK).json({
    user: {
      ...(user.toJSON()),
      password: undefined,
    },
    token: token,
  });
};


export const register = async (req: Request, res: Response) => {
  const { name, user_name, password } = req.body as {
    name: string;
    user_name: string;
    password: string;
  };

  if (!name || !user_name || !password) {
    throw new RouteError(HttpStatusCodes.BAD_REQUEST, 'Please enter valid name, user_name and password');
  }

  const existingUser = await User.findOne({ user_name });
  if (existingUser) {
    throw new RouteError(HttpStatusCodes.CONFLICT, 'Username Already exist');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = await User.create({
    name,
    user_name,
    password: hashedPassword,
  });

  const token = signToken(newUser._id.toString());

  res.status(HttpStatusCodes.CREATED).json({
    user: {
      ...(newUser.toJSON()),
      password: ''
    },
    token: token,
  });

};


export default {
  getOne,
  getAll,
  login,
  register,
} as const;