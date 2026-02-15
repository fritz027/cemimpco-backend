import jwt, { JwtPayload } from 'jsonwebtoken';
import {REGISTER_SECRET, FORGOT_PASSSWORD_SECRET} from '../../config//config';
import { TokenResult } from '../common.type';


export async function decodeRegistrationToken (token: string): Promise<TokenResult | null> {
  try {
    const decode = jwt.verify(token, REGISTER_SECRET) as TokenResult
    if (!decode.email || !decode.memberNo) {
      return null
    }
    return decode;
  } catch (error) {
    logging.error(`Error decoding Registration token: ${error}`);
    throw error;
  }
}

export async function decodeResetPassword (token: string): Promise<TokenResult | null>{
  try {
    const decode = jwt.verify(token, FORGOT_PASSSWORD_SECRET) as TokenResult;
    if (!decode.email || !decode.memberNo) {
      return null;
    }  
    return decode;
  } catch (error) {
    logging.error(`Error decoding reset password token: ${error}`);
    throw error;
  }
} 