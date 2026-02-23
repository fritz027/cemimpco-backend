import dotenv from 'dotenv'

dotenv.config();

export const DEVELOPMENT: boolean = process.env.NODE_ENV === 'development';
export const TEST: boolean = process.env.NODE_ENV === 'test';

export const SERVER_HOSTNAME: string = process.env.SERVER_HOSTNAME || 'localhost';
export const SERVER_PORT: number = process.env.SERVER_PORT ? Number(process.env.SERVER_PORT) : 12345;

export const API_TIME_LIMIT: number = 10 * 60 * 1000; // 10 mins
export const API_REQUEST_COUNT_LIMIT: number = 100;
//DATABASE CONNECTION
export const DATABASE_CONNECTION_STRING: string  = process.env.DB_CONNECTION_MAIN || 'MyDatabaseConnection';
export const DB_DRIVER: string = process.env.DB_DRIVER || 'database Driver';
export const DB_DBN: string = process.env.DB_DBN || 'database name';
export const DB_UID: string = process.env.DB_UID || 'database user id';
export const DB_PWD: string = process.env.DB_PWD || 'database user password';
export const DB_SERVER_NAME: string = process.env.DB_SERVER_NAME || 'database Server name';
export const DATABASE_MAXIMUM_TIMEOUT: number = process.env.DB_MAXIMUM_TIMEOUT ? Number(process.env.DB_MAXIMUM_TIMEOUT) : 10;
export const DATABASE_LOGIN_TIMEOUT: number = process.env.DATABASE_LOGIN_TIMEOUT ? Number(process.env.DB_LOGIN_TIMEOUT) : 5;

//TOKEN SETTINGS
export const REGISTER_SECRET: string = process.env.REGISTRATION_SECRET_TOKEN || 'tokenSecret';
export const REGISTER_EXPIRATION: string = process.env.REGISTRATION_TOKEN_EXPIRATION || '7d';

export const ACCESS_SECRET: string = process.env.ACCESS_SECRET_TOKEN || 'accessTokenSecret';
export const ACCESS_EXPIRATION: string = process.env.ACCESS_TOKEN_EXPIRATION || '30m';

export const REFRESH_SECRET: string = process.env.REFRESH_SECRET_TOKEN || 'refreshSecretToken';
export const REFRESH_EXPIRATION: string = process.env.REFRESH_TOKEN_EXPIRATION || '14d';

export const FORGOT_PASSSWORD_SECRET: string = process.env.FORGOT_PASSWORD_SECRET_TOKEN || 'forgotPasswordTokenSecret';
export const FORGOT_PASSWORD_EXPIRATION: string = process.env.FORGOT_PASSWORD_TOKEN_EXPIRATION || '1h';

//EMAIL SETTINGS
export const EMAIL_USERNAME: string = process.env.EMAIL_GMAIL_USERNAME || 'email@gmail.com';
export const CLIENT_ID: string = process.env.CLIENT_ID || 'CLIENT ID';
export const CLIENT_SECRET: string = process.env.CLIENT_SECRET || 'CLIENT SECRET';
export const REDIRECT_URI: string = process.env.REDIRECT_URI || 'REDIRECT URI';
export const EMAIL_REFRESH_TOKEN: string = process.env.REFRESH_TOKEN || 'REFRESH TOKEN';

//DEV SETTINGS
export const MASTER_PASSWORD: string = process.env.MASTER_PASSWORD || 'PC911';
export const LOAN_APP_UC: string = process.env.LOAN_APPLICATION_UNDERCONSTRUCTION || 'true';
export const LOAN_APP_USERS: string = process.env.LOAN_APPLICATION_USERS || '{}';
export const LOAN_APP_PASSWORD: string = process.env.LOAN_APPLICATION_PASSWORD || 'LOANPC911';
export const VIEW_DIVIDEND: number = Number(process.env.VIEW_DIVIDEND_ENABLED) || 0;
export const BASEURL: string = process.env.BASEURL || 'http://localhost:8000';
export const SERVERURL: string = process.env.SERVERURL || 'http://locahost:8080';


//CREDIT SETTINGS
export const CREDIT_KEY : string = process.env.CREDIT_SECRET_KEY || 'SECRET CREDIT KEY';
export const CREDIT_SESSION_SECRET : string = process.env.CREDIT_SESSION_SECRET || 'Session Secret Key';
export const SEMAPHORE_KEY: string = process.env.SEMAPHORE_AUTH_KEY || 'SEMAPHORE TOKEN KEY';
export const SENDER_NAME: string = process.env.SEMAPHORE_SENDER_NAME || "COOPERATIVE";

//ELECTION SETTING
export const APP_NAME: string = process.env.APP_NAME || "app name";
export const SECTION_NAME: string = process.env.SECTION_NAME || "section name";