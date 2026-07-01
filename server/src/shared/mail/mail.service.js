import { env } from '../../config/env.js';
import { AppError } from '../errors/AppError.js';
import { getGmailClient } from './gmail.client.js';
import { buildQuoteEmail } from './quoteEmail.template.js';
import { buildQuotePdf } from './quotePdf.js';

function encodeMimeMessage({ to, from, subject, html, text, attachments = [] }) {
  const boundary = `cotizador_${Date.now()}`;
  const mixedBoundary = `mixed_${Date.now()}`;
  const hasAttachments = attachments.length > 0;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    'MIME-Version: 1.0',
  ];

  if (hasAttachments) {
    headers.push(`Content-Type: multipart/mixed; boundary="${mixedBoundary}"`);
  } else {
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  }

  const parts = [...headers, ''];

  if (hasAttachments) {
    parts.push(`--${mixedBoundary}`);
    parts.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    parts.push('');
  }

  parts.push(`--${boundary}`);
  parts.push('Content-Type: text/plain; charset=UTF-8');
  parts.push('Content-Transfer-Encoding: base64');
  parts.push('');
  parts.push(Buffer.from(text).toString('base64'));
  parts.push('');

  parts.push(`--${boundary}`);
  parts.push('Content-Type: text/html; charset=UTF-8');
  parts.push('Content-Transfer-Encoding: base64');
  parts.push('');
  parts.push(Buffer.from(html).toString('base64'));
  parts.push('');
  parts.push(`--${boundary}--`);

  for (const att of attachments) {
    parts.push('');
    parts.push(`--${mixedBoundary}`);
    parts.push(`Content-Type: ${att.contentType}; name="${att.filename}"`);
    parts.push('Content-Transfer-Encoding: base64');
    parts.push(`Content-Disposition: attachment; filename="${att.filename}"`);
    parts.push('');
    parts.push(att.content.toString('base64'));
  }

  if (hasAttachments) {
    parts.push('');
    parts.push(`--${mixedBoundary}--`);
  }

  const mime = parts.join('\r\n');

  return Buffer.from(mime)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export async function sendQuoteEmail({ quote, publicUrl, senderName }) {
  const to = quote.client?.email;
  if (!to) {
    throw new AppError('El cliente no tiene email configurado', 422, 'NO_CLIENT_EMAIL');
  }

  const { subject, html, text } = buildQuoteEmail({ quote, publicUrl, senderName });
  const from = env.GMAIL_SENDER_EMAIL;

  let pdfBuffer;
  try {
    pdfBuffer = await buildQuotePdf({ quote });
  } catch (err) {
    console.error('Error generando PDF, se enviará sin adjunto:', err.message);
  }

  const primaryHotel = (quote.items || []).find((i) => i.booking?.hotelName)?.booking?.hotelName;
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}_${String(now.getMonth() + 1).padStart(2, '0')}_${now.getFullYear()}`;
  const pdfName = primaryHotel
    ? `CONFIRMACION DE RESERVA ${primaryHotel.toUpperCase()}  ${dateStr}.pdf`
    : `Cotizacion ${dateStr}.pdf`;

  const attachments = pdfBuffer
    ? [{ filename: pdfName, contentType: 'application/pdf', content: pdfBuffer }]
    : [];

  const raw = encodeMimeMessage({ to, from, subject, html, text, attachments });

  try {
    const gmail = getGmailClient();
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
  } catch (err) {
    const message = err.message || 'Error enviando correo';
    throw new AppError(`No se pudo enviar el correo: ${message}`, 502, 'EMAIL_SEND_FAILED');
  }
}
