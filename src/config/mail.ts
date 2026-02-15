import nodemailer from 'nodemailer';
import { google } from 'googleapis';

import {
  EMAIL_USERNAME,
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI,
  EMAIL_REFRESH_TOKEN
} from './config';

if (!EMAIL_USERNAME || !CLIENT_ID || !CLIENT_SECRET || !EMAIL_REFRESH_TOKEN) {
  throw new Error("Missing email OAuth vars");
}

const oAuth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oAuth2Client.setCredentials({ refresh_token: EMAIL_REFRESH_TOKEN });

async function getAccessToken(): Promise<string> {
  const tokenResponse = await oAuth2Client.getAccessToken();
  const accessToken = tokenResponse?.token;
  if (!accessToken) throw new Error("Failed to get mail access token");
  return accessToken;
}


export async function createMailTransporter() {
  const accessToken = await getAccessToken();

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: 'OAuth2',
      user: EMAIL_USERNAME,
      clientId: CLIENT_ID,
      clientSecret: CLIENT_SECRET,
      refreshToken: EMAIL_REFRESH_TOKEN,
      accessToken,
    },
  });
}