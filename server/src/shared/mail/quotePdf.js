import PDFDocument from 'pdfkit';
import { getHotelImageUrl, getRoomImageUrl } from './images.js';

function formatCurrency(n) {
  return (n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function formatDate(ymd) {
  if (!ymd) return '—';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

async function fetchImageBuffer(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('webp')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

function groupBookings(items) {
  const groups = new Map();
  for (const item of items) {
    const b = item.booking;
    if (!b?.hotelName) continue;
    const key = `${b.hotelId}|${b.checkin}|${b.checkout}|${b.adults}|${(b.childrenAges || []).join(',')}`;
    if (!groups.has(key)) {
      groups.set(key, { booking: b, rooms: [], items: [] });
    }
    const g = groups.get(key);
    g.rooms.push({ qty: item.qty || 1, roomName: b.roomName || item.name });
    g.items.push(item);
  }
  return [...groups.values()];
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

const COLORS = { primary: '#2563eb', dark: '#1a1a1a', muted: '#64748b', border: '#e2e8f0', bg: '#f8fafc' };
const PAGE_MARGIN = 50;
const CONTENT_WIDTH = 612 - PAGE_MARGIN * 2;

function ensureSpace(doc, needed) {
  if (doc.y + needed > doc.page.height - PAGE_MARGIN) {
    doc.addPage();
  }
}

export async function buildQuotePdf({ quote }) {
  const clientName = quote.client?.name || 'Cliente';
  const items = quote.items || [];
  const totals = quote.totals || {};
  const groups = groupBookings(items);
  const primaryHotel = groups[0]?.booking?.hotelName;

  const hotelIds = [...new Set(groups.map((g) => g.booking.hotelId).filter(Boolean))];
  const roomIds = [...new Set(items.map((i) => i.booking?.roomId).filter(Boolean))];
  const allImageUrls = new Map();

  for (const hid of hotelIds) {
    const url = getHotelImageUrl(hid);
    if (url) allImageUrls.set(`hotel:${hid}`, url);
  }
  for (const item of items) {
    const b = item.booking;
    if (b?.roomId) {
      const url = getRoomImageUrl(b.hotelId, b.roomId);
      if (url) allImageUrls.set(`room:${b.hotelId}:${b.roomId}`, url);
    }
  }

  const imageBuffers = new Map();
  const entries = [...allImageUrls.entries()];
  const results = await Promise.all(entries.map(([, url]) => fetchImageBuffer(url)));
  for (let i = 0; i < entries.length; i++) {
    if (results[i]) imageBuffers.set(entries[i][0], results[i]);
  }

  const doc = new PDFDocument({ size: 'LETTER', margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  doc.fontSize(20).fillColor(COLORS.primary).text('Voucher de Confirmación', { align: 'center' });
  if (primaryHotel) {
    doc.fontSize(14).fillColor(COLORS.dark).text(primaryHotel, { align: 'center' });
  }
  doc.moveDown(0.5);
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(612 - PAGE_MARGIN, doc.y).strokeColor(COLORS.border).stroke();
  doc.moveDown(0.5);

  doc.fontSize(11).fillColor(COLORS.dark);
  doc.text(`Estimado ${clientName},`, { continued: false });
  doc.moveDown(0.3);
  doc.text(`Reciba un cordial saludo de ${primaryHotel || 'GEH Suites Hotel'}.`);
  doc.moveDown(0.3);
  doc.text('Con el mayor de los gustos me permito enviar adjunto voucher de confirmación de reserva en mención directa así:');
  doc.moveDown(0.8);

  for (const group of groups) {
    const b = group.booking;
    const nights = b.nights || '—';
    const nightsLabel = typeof nights === 'number' ? `${nights} noche${nights !== 1 ? 's' : ''}` : nights;
    const totalGuests = (b.adults || 0) + (b.childrenAges?.length || 0);
    const accommodation = group.rooms.map((r) => `${r.qty} ${r.roomName}`).join(', ');

    const hotelImg = imageBuffers.get(`hotel:${b.hotelId}`);
    const roomItem = group.items[0];
    const roomKey = `room:${b.hotelId}:${roomItem?.booking?.roomId}`;
    const roomImg = imageBuffers.get(roomKey);

    if (hotelImg || roomImg) {
      ensureSpace(doc, 170);
      const imgY = doc.y;
      const imgWidth = hotelImg && roomImg ? (CONTENT_WIDTH - 10) / 2 : CONTENT_WIDTH;
      try {
        if (hotelImg) {
          doc.image(hotelImg, PAGE_MARGIN, imgY, { width: imgWidth, height: 140 });
        }
        if (roomImg) {
          const roomX = hotelImg ? PAGE_MARGIN + imgWidth + 10 : PAGE_MARGIN;
          doc.image(roomImg, roomX, imgY, { width: imgWidth, height: 140 });
        }
      } catch { /* skip unreadable images */ }
      doc.y = imgY + 148;
    }

    ensureSpace(doc, 100);
    doc.fontSize(13).fillColor(COLORS.primary).text(b.hotelName, { underline: false });
    doc.fontSize(10).fillColor(COLORS.dark);
    doc.moveDown(0.2);

    const bulletItems = [
      `${formatDate(b.checkin)} — ${formatDate(b.checkout)}`,
      nightsLabel,
      `Personas: ${totalGuests} — ${clientName}`,
      `Acomodación: ${accommodation}`,
    ];
    for (const line of bulletItems) {
      doc.text(`  •  ${line}`, { indent: 10 });
    }
    doc.moveDown(0.6);
  }

  ensureSpace(doc, 60);
  doc.fontSize(9).fillColor(COLORS.muted);
  doc.text('Nota: En caso de solicitar factura a nombre de empresa, debe enviar el RUT al momento de realizar el check-in y antes de realizar check-out, de lo contrario, la reserva se facturará a nombre del huésped o titular de la reserva perdiendo el derecho a solicitar modificación o corrección del documento.');
  doc.moveDown(0.8);

  ensureSpace(doc, 20 + PACKAGE_INCLUDES.length * 14);
  doc.fontSize(11).fillColor(COLORS.dark).text('El paquete incluye:', { underline: false });
  doc.fontSize(9).fillColor(COLORS.dark);
  for (const item of PACKAGE_INCLUDES) {
    doc.text(`  •  ${item}`, { indent: 10 });
  }
  doc.moveDown(0.5);

  doc.fontSize(11).text('No incluye:');
  doc.fontSize(9).text('  Ø  Gastos no especificados', { indent: 10 });
  doc.moveDown(0.5);

  doc.fontSize(10).fillColor(COLORS.dark);
  doc.text('Hora de ingreso: 3:00 pm');
  doc.text('Horario de salida: 12:00 Mediodía');
  doc.moveDown(0.5);

  ensureSpace(doc, 40);
  doc.fontSize(9).fillColor(COLORS.muted);
  doc.text('Nota: el NO envío del comprobante en la fecha estipulada o anterior a esta, puede causar la apertura de disponibilidad o venta de la habitación sin previo aviso, por lo tanto, es de suma importancia hacer el envío de la foto o escáner por el presente medio como prueba de garantía.');
  doc.moveDown(0.8);

  ensureSpace(doc, 20 + LEGAL_NOTES.length * 26);
  doc.fontSize(11).fillColor(COLORS.dark).text('Tener en cuenta:');
  doc.fontSize(9).fillColor(COLORS.dark);
  for (const note of LEGAL_NOTES) {
    doc.text(`  •  ${note}`, { indent: 10 });
  }
  doc.moveDown(1);

  if (items.length > 0) {
    ensureSpace(doc, 40 + items.length * 22 + 30);
    doc.moveTo(PAGE_MARGIN, doc.y).lineTo(612 - PAGE_MARGIN, doc.y).strokeColor(COLORS.border).stroke();
    doc.moveDown(0.5);

    const col1 = PAGE_MARGIN;
    const col2 = PAGE_MARGIN + CONTENT_WIDTH * 0.55;
    const col3 = PAGE_MARGIN + CONTENT_WIDTH * 0.70;
    const col4 = PAGE_MARGIN + CONTENT_WIDTH * 0.85;

    doc.fontSize(8).fillColor(COLORS.muted);
    const headerY = doc.y;
    doc.text('Descripción', col1, headerY);
    doc.text('Cant.', col2, headerY);
    doc.text('Precio', col3, headerY);
    doc.text('Subtotal', col4, headerY);
    doc.moveDown(0.5);
    doc.moveTo(PAGE_MARGIN, doc.y).lineTo(612 - PAGE_MARGIN, doc.y).strokeColor(COLORS.border).stroke();
    doc.moveDown(0.3);

    doc.fontSize(9).fillColor(COLORS.dark);
    for (const item of items) {
      ensureSpace(doc, 16);
      const rowY = doc.y;
      doc.text(item.name, col1, rowY, { width: col2 - col1 - 5 });
      doc.text(String(item.qty), col2, rowY);
      doc.text(formatCurrency(item.unitPrice), col3, rowY);
      doc.text(formatCurrency(item.subtotal), col4, rowY);
      doc.moveDown(0.4);
    }

    doc.moveDown(0.3);
    doc.moveTo(PAGE_MARGIN, doc.y).lineTo(612 - PAGE_MARGIN, doc.y).strokeColor(COLORS.border).stroke();
    doc.moveDown(0.5);

    if (totals.discount > 0) {
      doc.fontSize(9).fillColor(COLORS.dark).text(`Subtotal: ${formatCurrency(totals.subtotal)}`, { align: 'right' });
      doc.text(`Descuento: -${formatCurrency(totals.discount)}`, { align: 'right' });
    }
    doc.text(`IVA: ${formatCurrency(totals.tax)}`, { align: 'right' });
    doc.fontSize(14).fillColor(COLORS.primary).text(`Total: ${formatCurrency(totals.total)}`, { align: 'right' });
    doc.moveDown(0.8);
  }

  doc.fontSize(10).fillColor(COLORS.dark).text('Quedamos atentos a sus comentarios.', { align: 'left' });

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
