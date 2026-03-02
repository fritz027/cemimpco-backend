import jwt, { SignOptions } from 'jsonwebtoken';

import {
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
  JWTPayload,
} from '../common.type';


/* -----------------------------
   GENERIC TOKEN GENERATOR
----------------------------- */

function generateToken<T extends object>(
  payload: T,
  secret: string,
  expiresIn: string
): string {
  const options: SignOptions = {
    expiresIn: expiresIn as any,
  };

  return jwt.sign(payload, secret, options);
}


/* -----------------------------
   ACCESS TOKEN (LOGIN)
----------------------------- */

export const generateMemberLoginToken = (
  payload: JWTPayload
): string => {

  return generateToken(
    payload,
    ACCESS_SECRET,
    ACCESS_EXPIRATION
  );
};


/* -----------------------------
   REGISTER TOKEN
----------------------------- */

export const generateMemberRegisterToken = (
   payload: JWTPayload
): string => {

  return generateToken(
    payload,
    REGISTER_SECRET,
    REGISTER_EXPIRATION
  );
};


/* -----------------------------
   RESET PASSWORD TOKEN
----------------------------- */

export const generateResetPasswordToken = (
  payload: JWTPayload
): string => {

  

  return generateToken(
    payload,
    FORGOT_PASSSWORD_SECRET,
    FORGOT_PASSWORD_EXPIRATION
  );
};


/* -----------------------------
   REFRESH ACCESS TOKEN
----------------------------- */

export const generateRefreshToken = (
  payload: JWTPayload
): string => {
  
  return generateToken(
    payload,
    REFRESH_SECRET,
    REFRESH_EXPIRATION
  );
};