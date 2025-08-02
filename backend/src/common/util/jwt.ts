import ms from 'ms';
import jwt from 'jsonwebtoken';

import ENV from '@src/common/constants/ENV';

const TOKEN_EXPIRY_TIME: number | ms.StringValue= '30d';

export function verifyJWT(token: string) {
  const decoded = jwt.verify(token, ENV.JwtSecret) as { _id: string }; 
  return decoded;
}

export function signToken(_id: string) {
  const token = jwt.sign({ _id }, ENV.JwtSecret, {
    expiresIn: TOKEN_EXPIRY_TIME,
  });
  return token;
}