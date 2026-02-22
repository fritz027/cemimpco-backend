import "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        memberNo: string;
        email?: string;
      };
    }
  }
}

export {};
