export interface MemberLoginPayload {
  memberNo: string;
  email: string;
}

export interface MemberRegisterPayload {
  memberNo: string;
  email: string;
}

export interface MemberResetPassword {
  memberNo: string;
  email: string;
}

export interface JWTPayload {
  memberNo: string;
  email: string;
  store?: string;
}

export interface MailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}

export interface TokenResult {
  memberNo: string;
  email: string;
}
