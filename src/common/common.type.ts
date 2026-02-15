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

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface TokenResult {
  memberNo: string;
  email: string;
}