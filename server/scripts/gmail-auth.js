/**
 * Obtiene el refresh token de Gmail API vía localhost (Google bloqueó el flujo OOB).
 *
 * Requisitos en Google Cloud Console:
 *   - Gmail API activada
 *   - OAuth consent screen (Interno) con scope gmail.send
 *   - Credencial OAuth tipo "Aplicación de escritorio" (recomendado)
 *     O tipo "Web" con URI de redirección: http://127.0.0.1:3333/oauth2callback
 *
 * Uso:
 *   npm run gmail:auth -w server
 */
import 'dotenv/config';
import http from 'http';
import { google } from 'googleapis';

const PORT = 3333;
const REDIRECT_URI = `http://127.0.0.1:${PORT}/oauth2callback`;
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

const { GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET } = process.env;

if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
  console.error('Faltan GMAIL_CLIENT_ID y GMAIL_CLIENT_SECRET en server/.env');
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: SCOPES,
});

function sendHtml(res, title, body) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${title}</title></head><body style="font-family:sans-serif;padding:2rem;">${body}</body></html>`);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI);

  if (url.pathname !== '/oauth2callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    sendHtml(res, 'Error', `<h1>Autorización cancelada</h1><p>${error}</p><p>Puedes cerrar esta ventana.</p>`);
    console.error('\nGoogle devolvió error:', error);
    server.close();
    process.exit(1);
  }

  if (!code) {
    sendHtml(res, 'Error', '<h1>No se recibió código</h1><p>Intenta de nuevo.</p>');
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);

    if (!tokens.refresh_token) {
      sendHtml(
        res,
        'Aviso',
        '<h1>Sin refresh token</h1><p>Revoca el acceso en <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a> y vuelve a ejecutar el script.</p>'
      );
      console.error('\nNo se obtuvo refresh_token. Revoca permisos previos y reintenta con prompt=consent.');
      server.close();
      process.exit(1);
    }

    sendHtml(
      res,
      'Listo',
      '<h1>Autorización exitosa</h1><p>Ya puedes cerrar esta ventana y volver a la terminal.</p>'
    );

    console.log('\n--- Agrega esto a server/.env ---\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log(`GMAIL_SENDER_EMAIL=tu-cuenta@${process.env.GMAIL_SENDER_DOMAIN || 'tu-dominio.com'}`);
    console.log('\nReinicia el servidor después de guardar el .env\n');
  } catch (err) {
    sendHtml(res, 'Error', `<h1>Error</h1><p>${err.message}</p>`);
    console.error('\nError obteniendo token:', err.message);
    process.exit(1);
  } finally {
    setTimeout(() => {
      server.close();
      process.exit(0);
    }, 500);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('\n=== Autorización Gmail API ===\n');
  console.log('1. Abre esta URL en tu navegador:\n');
  console.log(authUrl);
  console.log('\n2. Inicia sesión con la cuenta Workspace desde la que enviarás cotizaciones.');
  console.log('3. Google te redirigirá a localhost automáticamente.\n');
  console.log(`   Esperando callback en ${REDIRECT_URI} ...\n`);
  console.log('Si Google dice "solicitud no válida", verifica en Cloud Console:');
  console.log('   - Tipo de credencial: "Aplicación de escritorio" (recomendado)');
  console.log('   - O si es "Web", agrega esta URI de redirección:');
  console.log(`     ${REDIRECT_URI}\n`);
});
