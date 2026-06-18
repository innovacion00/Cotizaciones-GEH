import 'dotenv/config';

const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'MONGODB_URI'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  throw new Error(`Variables de entorno faltantes: ${missing.join(', ')}`);
}

export const env = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:4321',
  NODE_ENV: process.env.NODE_ENV || 'development',
  AUTOCORE_API_URL: process.env.AUTOCORE_API_URL || '',
  AUTOCORE_API_KEY: process.env.AUTOCORE_API_KEY || '',
  AUTOCORE_BOOKING_URL: process.env.AUTOCORE_BOOKING_URL || 'https://api.autocore.pro',
  AUTOCORE_BOOKING_ACCESS_KEY: process.env.AUTOCORE_BOOKING_ACCESS_KEY || '',
  AUTOCORE_BOOKING_SECRET_KEY: process.env.AUTOCORE_BOOKING_SECRET_KEY || '',
  GMAIL_CLIENT_ID: process.env.GMAIL_CLIENT_ID || '',
  GMAIL_CLIENT_SECRET: process.env.GMAIL_CLIENT_SECRET || '',
  GMAIL_REFRESH_TOKEN: process.env.GMAIL_REFRESH_TOKEN || '',
  GMAIL_SENDER_EMAIL: process.env.GMAIL_SENDER_EMAIL || '',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
};
