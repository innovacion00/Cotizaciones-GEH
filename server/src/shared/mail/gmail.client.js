import { google } from 'googleapis';
import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';

const GMAIL_VARS = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_SENDER_EMAIL'];

export function getMissingGmailVars() {
  return GMAIL_VARS.filter((key) => !env[key]);
}

export function isGmailConfigured() {
  return getMissingGmailVars().length === 0;
}

export function getGmailClient() {
  const missing = getMissingGmailVars();
  if (missing.length) {
    const hint = missing.includes('GMAIL_REFRESH_TOKEN')
      ? ' Ejecuta: npm run gmail:auth -w server'
      : '';
    throw new AppError(
      `Gmail no está configurado. Faltan: ${missing.join(', ')}.${hint}`,
      503,
      'GMAIL_NOT_CONFIGURED'
    );
  }

  const oauth2 = new google.auth.OAuth2(env.GMAIL_CLIENT_ID, env.GMAIL_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: env.GMAIL_REFRESH_TOKEN });

  return google.gmail({ version: 'v1', auth: oauth2 });
}
