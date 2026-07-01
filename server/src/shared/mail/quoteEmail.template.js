import { calcPaymentDeadline } from './quotePdf.js';

function formatCurrency(n) {
  return (n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function formatDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function totalGuests(booking) {
  const adults = booking.adults || 0;
  const children = booking.childrenAges?.length || 0;
  return adults + children;
}

function formatAccommodation(rooms) {
  return rooms
    .map(({ qty, roomName }) => `${qty} ${roomName}`)
    .join(', ');
}

function groupBookings(items) {
  const groups = new Map();

  for (const item of items) {
    const b = item.booking;
    if (!b?.hotelName) continue;

    const key = `${b.hotelId}|${b.checkin}|${b.checkout}|${b.adults}|${(b.childrenAges || []).join(',')}`;
    if (!groups.has(key)) {
      groups.set(key, { booking: b, rooms: [] });
    }
    groups.get(key).rooms.push({ qty: item.qty || 1, roomName: b.roomName || item.name });
  }

  return [...groups.values()];
}

function buildBookingSectionHtml({ booking, rooms }, titularName) {
  const nights = booking.nights || '—';
  const nightsLabel = typeof nights === 'number'
    ? `${nights} noche${nights !== 1 ? 's' : ''}`
    : nights;

  return `
    <p style="margin:0 0 8px;font-weight:600;font-size:16px;text-align:left;">${booking.hotelName}</p>
    <ul style="margin:0 0 20px;padding-left:20px;line-height:1.7;text-align:left;">
      <li>${formatDate(booking.checkin)} — ${formatDate(booking.checkout)}</li>
      <li>${nightsLabel}</li>
      <li>Personas: ${totalGuests(booking)} — ${titularName}</li>
      <li>Acomodación: ${formatAccommodation(rooms)}</li>
    </ul>
  `;
}

function buildBookingSectionText({ booking, rooms }, titularName) {
  const nights = booking.nights || '—';
  const nightsLabel = typeof nights === 'number'
    ? `${nights} noche${nights !== 1 ? 's' : ''}`
    : nights;

  return [
    booking.hotelName,
    `· ${formatDate(booking.checkin)} — ${formatDate(booking.checkout)}`,
    `· ${nightsLabel}`,
    `· Personas: ${totalGuests(booking)} — ${titularName}`,
    `· Acomodación: ${formatAccommodation(rooms)}`,
    '',
  ].join('\n');
}

const PACKAGE_INCLUDES = [
  'Alojamiento según la acomodación seleccionada',
  'Aire acondicionado',
  'Baño privado',
  'Amenities de baño',
  'Toallas para uso interno del hotel',
  'Tv plasma',
  'Canales internacionales',
  'Desayuno',
  'Servicio de wifi de cortesía',
  'Cajillas de seguridad',
  'Servicio de guarda equipajes sin costo adicional',
  'Iva 19%',
];

const LEGAL_NOTES = [
  'La cadena hotelera GEH Suites protege a los niños, niñas y adolescentes de la explotación sexual y comercial Ley 679 de 2001.',
  'Recuerde; todo niño que viaje debe contar con su documento de identidad (Registro civil o tarjeta de identidad)',
  'Si los niños que viajan no son hijos de los adultos que los representan deben contar con un permiso de los padres, autenticado en una notaría.',
];

export function buildQuoteEmail({ quote, publicUrl, senderName }) {
  const clientName = quote.client?.name || 'Cliente';
  const items = quote.items || [];
  const totals = quote.totals || {};
  const bookingGroups = groupBookings(items);
  const primaryHotel = bookingGroups[0]?.booking?.hotelName;

  const subject = primaryHotel
    ? `Voucher de confirmación — ${primaryHotel}`
    : `Cotización — ${clientName}`;

  const bookingSectionsHtml = bookingGroups.length > 0
    ? bookingGroups.map((g) => buildBookingSectionHtml(g, clientName)).join('')
    : '<p style="margin:0 0 20px;color:#64748b;">Sin detalle de reserva hotelera.</p>';

  const primaryCheckin = bookingGroups[0]?.booking?.checkin;
  const deadlineDate = calcPaymentDeadline(primaryCheckin);
  const deadlineStr = deadlineDate
    ? deadlineDate.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  const includesHtml = PACKAGE_INCLUDES.map((item) => `<li>${item}</li>`).join('');
  const legalHtml = LEGAL_NOTES.map((item) => `<li>${item}</li>`).join('');

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;line-height:1.6;margin:0;padding:0;text-align:left;">
  <div style="max-width:640px;margin:0;padding:32px 24px;text-align:left;">
    <div style="text-align:left;">
    <p style="margin:0 0 16px;text-align:left;">¡Buenas!</p>

    <p style="margin:0 0 16px;text-align:left;">Estimado <strong>${clientName}</strong>,</p>

    <p style="margin:0 0 16px;text-align:left;">
      Reciba un cordial saludo de <strong>${primaryHotel || 'GEH Suites Hotel'}</strong>.
    </p>

    <p style="margin:0 0 16px;text-align:left;">
      Con el mayor de los gustos me permito enviar adjunto voucher de confirmación de reserva en mención directa así:
    </p>

    <div style="text-align:left;">${bookingSectionsHtml}</div>

    <p style="margin:0 0 16px;text-align:left;">
      <strong>Nota:</strong> En caso de solicitar factura a nombre de empresa, debe enviar el RUT al momento de realizar el check-in y antes de realizar check-out, de lo contrario, la reserva se facturará a nombre del huésped o titular de la reserva perdiendo el derecho a solicitar modificación o corrección del documento.
    </p>

    <p style="margin:0 0 8px;font-weight:600;text-align:left;">El paquete incluye:</p>
    <ul style="margin:0 0 20px;padding-left:20px;line-height:1.7;text-align:left;">${includesHtml}</ul>

    <p style="margin:0 0 8px;font-weight:600;text-align:left;">No incluye</p>
    <p style="margin:0 0 20px;text-align:left;">Ø Gastos no especificados</p>

    <p style="margin:0 0 4px;text-align:left;"><strong>Hora de ingreso:</strong> 3:00 pm</p>
    <p style="margin:0 0 20px;text-align:left;"><strong>Horario de salida:</strong> 12:00 Mediodía</p>

    <p style="margin:0 0 20px;text-align:left;">
      <strong>Nota:</strong> el NO envío del comprobante en la fecha estipulada o anterior a esta, puede causar la apertura de disponibilidad o venta de la habitación sin previo aviso, por lo tanto, es de suma importancia hacer el envío de la foto o escáner por el presente medio como prueba de garantía.
    </p>

    ${deadlineStr ? `
    <p style="margin:0 0 20px;text-align:left;padding:12px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;">
      <strong>Fecha límite de anticipo:</strong> ${deadlineStr}
    </p>
    ` : ''}

    <p style="margin:0 0 8px;font-weight:600;text-align:left;">Tener en cuenta:</p>
    <ul style="margin:0 0 24px;padding-left:20px;line-height:1.7;text-align:left;">${legalHtml}</ul>
    </div>

    ${items.length > 0 ? `
    <div style="text-align:center;margin:0 0 24px;">
    <table style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse;font-size:14px;text-align:left;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:12px;color:#64748b;">Descripción</th>
          <th style="padding:8px 12px;text-align:center;font-size:12px;color:#64748b;">Cant.</th>
          <th style="padding:8px 12px;text-align:right;font-size:12px;color:#64748b;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <p style="text-align:center;font-size:18px;font-weight:700;margin:16px 0 0;">
      Total: ${formatCurrency(totals.total)}
    </p>
    </div>
    ` : ''}

    <div style="text-align:center;margin:0 0 24px;">
    <p style="margin:0 0 16px;text-align:center;">
      ${senderName ? `${senderName} le ha compartido` : 'Le hemos compartido'} el detalle de su cotización en el siguiente enlace:
    </p>
    <p style="margin:0 0 16px;text-align:center;">
      <a href="${publicUrl}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
        Ver cotización
      </a>
    </p>
    <p style="color:#64748b;font-size:13px;margin:0;text-align:center;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <a href="${publicUrl}" style="color:#2563eb;">${publicUrl}</a>
    </p>
    </div>

    <p style="margin:0;text-align:left;">Quedamos atentos a sus comentarios.</p>
  </div>
</body>
</html>`;

  const bookingSectionsText = bookingGroups.length > 0
    ? bookingGroups.map((g) => buildBookingSectionText(g, clientName)).join('\n')
    : 'Sin detalle de reserva hotelera.\n';

  const text = `¡Buenas!

Estimado ${clientName},

Reciba un cordial saludo de ${primaryHotel || 'GEH Suites Hotel'}.

Con el mayor de los gustos me permito enviar adjunto voucher de confirmación de reserva en mención directa así:

${bookingSectionsText}
Nota: En caso de solicitar factura a nombre de empresa, debe enviar el RUT al momento de realizar el check-in y antes de realizar check-out, de lo contrario, la reserva se facturará a nombre del huésped o titular de la reserva perdiendo el derecho a solicitar modificación o corrección del documento.

El paquete incluye:
${PACKAGE_INCLUDES.map((item) => `• ${item}`).join('\n')}

No incluye
Ø Gastos no especificados

Hora de ingreso: 3:00 pm
Horario de salida: 12:00 Mediodía

Nota: el NO envío del comprobante en la fecha estipulada o anterior a esta, puede causar la apertura de disponibilidad o venta de la habitación sin previo aviso, por lo tanto, es de suma importancia hacer el envío de la foto o escáner por el presente medio como prueba de garantía.
${deadlineStr ? `\nFecha límite de anticipo: ${deadlineStr}\n` : ''}
Tener en cuenta:
${LEGAL_NOTES.map((item) => `• ${item}`).join('\n')}

${items.length > 0 ? `Total: ${formatCurrency(totals.total)}\n` : ''}
${senderName ? `${senderName} le ha compartido` : 'Le hemos compartido'} el detalle de su cotización:
${publicUrl}

Quedamos atentos a sus comentarios.
`;

  return { subject, html, text };
}
