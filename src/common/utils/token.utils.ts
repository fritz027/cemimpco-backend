import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import  {
  REGISTER_SECRET,
  REFRESH_EXPIRATION,
  ACCESS_SECRET,
  ACCESS_EXPIRATION,
  FORGOT_PASSWORD_EXPIRATION,
  FORGOT_PASSSWORD_SECRET,
  REFRESH_SECRET,
  REGISTER_EXPIRATION,
} from '../../config/config';

import { 
  MemberLoginPayload,
  MemberRegisterPayload,
  MemberResetPassword,
} from '../common.type'

export const generateMemberLoginToken = (memberNo: string, email: string): string => {
  const payLoad: MemberLoginPayload = {memberNo, email}
  const secret = ACCESS_SECRET;
  const options: SignOptions = {
    expiresIn: ACCESS_EXPIRATION as any
  };
  return jwt.sign(payLoad, secret, options);
}

export const generateMemberRegisterToken = (memberNo: string, email: string): string => {
  const payLoad: MemberRegisterPayload = { memberNo, email };
  const registerSecret = REGISTER_SECRET;
  const options: SignOptions = {
    expiresIn: REGISTER_EXPIRATION as any
  };
  return jwt.sign(payLoad, registerSecret, options);
}


export const generateResetPasswordToken = (memberNo: string, email: string): string => {
  const payload: MemberResetPassword = { memberNo,  email };
  const forgotPasswordSecret = FORGOT_PASSSWORD_SECRET;
  const options: SignOptions = {
    expiresIn: FORGOT_PASSWORD_EXPIRATION as any
  };
  return jwt.sign(payload, forgotPasswordSecret, options);
}