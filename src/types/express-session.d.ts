import "express-session";

declare module "express-session" {
  interface SessionData {
    credit?: {
      uid: string;
      passwordEnc: string;
      storeID?: string;
    };
  }
}

export {}; // ✅ make sure this file is treated as a module
