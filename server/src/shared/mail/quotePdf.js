import PDFDocument from 'pdfkit';
import { getHotelImageUrl, getRoomImageUrl } from './images.js';
import { BANK_ACCOUNTS } from './bankAccounts.js';
import { RESPONSABLES } from './responsables.js';

const LOGO_URL = 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/gehlogo.png';
const LOGO_W = 130;
const LOGO_H = 38.7;

const GOLD = '#876c46';
const DARK = '#333333';
const WHITE = '#FFFFFF';
const MUTED = '#666666';
const PAGE_W = 612;
const PAGE_H = 792;
const M = 50;
const CW = PAGE_W - M * 2;

function fmt$(n) {
  return (n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
}

function fmtDate(ymd) {
  if (!ymd) return '';
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

async function fetchImg(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('webp')) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch { return null; }
}

export function calcPaymentDeadline(checkinYmd) {
  if (!checkinYmd) return null;
  const [y, m, d] = checkinYmd.split('-').map(Number);
  const endPrevMonth = new Date(y, m - 1, 0);
  const twoBefore = new Date(y, m - 1, d - 2);
  return endPrevMonth <= twoBefore ? endPrevMonth : twoBefore;
}

function fmtDeadline(checkinYmd) {
  const d = calcPaymentDeadline(checkinYmd);
  if (!d) return '';
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
}

// El usuario puede fijar manualmente la fecha límite de pago; si no la fijó, se calcula
// automáticamente a partir del check-in como fallback (cotizaciones antiguas sin el campo).
export function resolveDeadlineStr(quote, primaryCheckinYmd) {
  if (quote?.paymentDeadline) return fmtDate(quote.paymentDeadline);
  return fmtDeadline(primaryCheckinYmd);
}

function groupBookings(items) {
  const groups = new Map();
  for (const item of items) {
    const b = item.booking;
    if (!b?.hotelName) continue;
    const key = `${b.hotelId}|${b.checkin}|${b.checkout}`;
    if (!groups.has(key)) groups.set(key, { booking: b, rooms: [], items: [] });
    const g = groups.get(key);
    g.rooms.push({ qty: item.qty || 1, roomName: b.roomName || item.name, roomId: b.roomId });
    g.items.push(item);
  }
  return [...groups.values()];
}

function band(doc, y, h) {
  doc.save().rect(0, y, PAGE_W, h).fill(GOLD).restore();
}

function placeImg(doc, buf, x, y, w, h) {
  try {
    doc.save().rect(x, y, w, h).clip();
    doc.image(buf, x, y, { cover: [w, h], align: 'center', valign: 'center' });
    doc.restore();
  } catch { /* skip unreadable image */ }
}

function sectionTitle(doc, text, y) {
  if (y != null) doc.y = y;
  doc.font('Times-Roman').fontSize(28).fillColor(GOLD).text(text, M, doc.y, { align: 'center', width: CW });
  doc.moveDown(0.8);
}

// ─── Page 1: Cover ───────────────────────────────────────────────────────────
function pageCover(doc, b, hotelImg, logoImg) {
  if (logoImg) {
    try {
      doc.image(logoImg, M, M, { width: LOGO_W, height: LOGO_H });
    } catch { /* skip unreadable logo */ }
  } else {
    doc.font('Helvetica-Bold').fontSize(20).fillColor(GOLD).text('geh', M, M, { continued: true });
    doc.font('Helvetica').text('suites');
    doc.font('Helvetica').fontSize(9).fillColor(GOLD).text('Hotels', M, doc.y - 2);
  }

  doc.save().roundedRect(PAGE_W - M - 185, M, 185, 38, 4).fill('#E8D5A8').restore();
  doc.font('Helvetica-Bold').fontSize(10).fillColor(GOLD);
  doc.text('Un hotel para cada', PAGE_W - M - 178, M + 6, { width: 170, align: 'center' });
  doc.text('plan de viaje', PAGE_W - M - 178, doc.y - 1, { width: 170, align: 'center' });

  doc.font('Times-Roman').fontSize(18).fillColor(GOLD);
  doc.text(`Reserva del ${fmtDate(b.checkin)} al ${fmtDate(b.checkout)}`, M, 270, { align: 'center', width: CW });
  doc.moveDown(0.6);
  doc.font('Helvetica').fontSize(13).fillColor(MUTED);
  doc.text(`${b.hotelName} - ${b.city || 'Colombia'}`, M, doc.y, { align: 'center', width: CW });

  const imgTop = 420;
  band(doc, imgTop, 25);
  if (hotelImg) {
    placeImg(doc, hotelImg, 0, imgTop + 25, PAGE_W, PAGE_H - imgTop - 25);
  }
}

// ─── Page 2: Welcome + Room ──────────────────────────────────────────────────
function pageWelcome(doc, b, clientName, roomImg) {
  doc.addPage();

  band(doc, 0, 110);
  doc.font('Times-Roman').fontSize(22).fillColor(WHITE);
  doc.text('Disfrute una estadía confortable en', M, 28, { align: 'center', width: CW });
  doc.text('nuestras instalaciones', M, doc.y, { align: 'center', width: CW });

  const imgH = 310;
  if (roomImg) {
    placeImg(doc, roomImg, 0, 110, PAGE_W, imgH);
  }

  const greetY = 110 + imgH;
  band(doc, greetY, 120);
  doc.font('Helvetica').fontSize(13).fillColor(WHITE);
  doc.text(`Estimado ${clientName}`, M, greetY + 35, { align: 'center', width: CW });
  doc.moveDown(0.3);
  doc.text(`Gracias por contactar al ${b.hotelName} para gestionar su reserva.`, M, doc.y, { align: 'center', width: CW });
}

const HOTEL_DESCRIPTIONS = {
  '13633': {
    text: 'Ubicado en Cartagena de Indias – Colombia, y teniendo como vecino las hermosas playas del mar caribe, se abre paso en el moderno y reconocido barrio de Marbella nuestro Hotel Aixo Suites; a solo 5 minutos de la mágica e infranqueable Ciudad Amurallada; podrás revivir y encontrar las hazañas de nuestros héroes, lo colonial de sus calles, la belleza de sus cañones, su diversidad gastronómica y las más reconocidas tiendas y bares para tu diversión.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/hotel-aixo-suites',
  },
  '13644': {
    text: 'Ubicado entre el mar Caribe y la bahía de Cartagena de Indias, en el animado distrito comercial y turístico de Bocagrande, este hotel ofrece fácil acceso a todas las atracciones y opciones de entretenimiento que la ciudad moderna y amurallada tiene para ti.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/hotel-avexi-suites',
  },
  '13645': {
    text: 'Azuán Suites By GEH Suites, en Cartagena es un hermoso hotel ubicado en el sector moderno de Bocagrande, gozando de una ubicación estratégica a tan solo 15 minutos del aeropuerto Internacional Rafael Núñez.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/hotel-azuan-suites',
  },
  '17644': {
    text: '¡Ven a disfrutar de unas vacaciones inolvidables en el Hotel Abi Inn! Estamos ubicados en la primera línea del mar, frente a las playas espectaculares de Marbella. Además, estamos a pocos pasos de la ciudad amurallada de Cartagena, una de las ciudades más hermosas de Colombia, con sus callejones empedrados, sus edificios coloniales y su increíble puerto. Ofrecemos 36 habitaciones, para satisfacer todas tus necesidades, desde habitaciones dobles y triples, hasta cuádruples y quíntuples. Nuestro desayuno americano te encantará. Y para relajarte, te invitamos a disfrutar de nuestra piscina. ¡Esperamos verte pronto!',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/hotel-abi-inn',
  },
  '13643': {
    text: 'El Hotel Marina Suites es una hermosa propiedad con 42 habitaciones diseñadas para el descanso y relax, con las comodidades necesarias para el disfrute de tus vacaciones en pareja, amigos, familia o para tus actividades de negocios o eventos en la ciudad.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/hotel-marina-suites',
  },
  '13677': {
    text: 'Hotel Boquilla Suites By GEH Suites, es un acogedor hotel, ubicado en la zona norte y turística de Cartagena a pocos pasos de las reconocidas playas de la Boquilla, las cuales representan la cultura y gastronomía típica de la región por la gran variedad de restaurantes típicos en la zona balnearia.',
    url: '',
  },
  '16255': {
    text: 'Madisson Inn Hotel Luxury By GEH Suites, nos encontramos ubicados en la Carrera 18 No. 93 – 97, barrio El Chicó, Bogotá, Colombia. Con una excelente ubicación en el norte de la Ciudad, a solo 5 minutos del parque de la 93, muy cerca de la zona T donde están localizados los más destacados restaurantes de la ciudad, cerca de las entidades financieras, centros de negocios, zonas de entretenimiento y casinos.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/madisson-inn-hotel-luxury',
  },
  '18004': {
    text: 'Bienvenido al Hotel Windsor House Inn By GEH Suites, ubicado en la calle 95 #9-97, en el moderno barrio Chapinero de Bogotá. Nuestro hotel está estratégicamente situado cerca de los principales atractivos turísticos del norte de Bogotá, lo que lo convierte en el lugar ideal para disfrutar de una estancia inolvidable en la capital colombiana.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/hotel-windsor-house',
  },
  '17491': {
    text: 'El Hotel Rodadero Inn se encuentra ubicado en la ciudad de Santa Marta, uno de los destinos turísticos más hermosos de Colombia. A orillas del mar Caribe, esta ciudad cuenta con una gran variedad de playas, parques y monumentos históricos que cautivarán a todos nuestros visitantes. Estamos ubicados en la Calle 19 # 1B-64 Rodadero, a 2 cuadras de la avenida y a 1 cuadra de la playa. Ofrecemos 39 habitaciones con todas las comodidades.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/hotel-rodadero-inn',
  },
  '19629': {
    text: 'El Hotel Axis Inn by GEH Suites está ubicado estratégicamente a unos pasos de las hermosas playas de El Rodadero, en la ciudad de Santa Marta. Ofrecemos una experiencia inolvidable en un ambiente moderno y confortable, ideal para disfrutar en cualquier época del año. Nuestro hotel cuenta con dos piscinas, habitaciones diseñadas para parejas y familias y salones versátiles para la celebración de todo tipo de eventos.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/axis-inn-by-geh-suites',
  },
  '15740': {
    text: 'En el Hotel Sansiraka, ubicado en la turística zona de El Rodadero, a 13 km de Santa Marta, podrás disfrutar de alojamiento con balcón, Wi-Fi gratuito y una piscina al aire libre. Algunas de nuestras habitaciones cuentan con una acogedora área de estar con TV por cable y balcones privados. Empieza el día con un delicioso desayuno americano y disfruta de bebidas refrescantes en el bar. Relájate tomando el sol en nuestra terraza junto a la piscina o bajo la sombra en nuestros jardines.',
    url: 'https://www.gehsuites.com/es/nuestros-hoteles/sansiraka',
  },
  '21590': {
    text: '',
    url: '',
  },
};

// ─── Page 3: Description ────────────────────────────────────────────────────
function pageDescription(doc, group) {
  doc.addPage();
  const b = group.booking;

  sectionTitle(doc, 'Descripción general');

  doc.font('Helvetica').fontSize(11).fillColor(DARK);
  doc.text('De acuerdo a conversaciones, enviamos cotización detallada de la siguiente manera:', M, doc.y, { width: CW });
  doc.moveDown(0.6);

  const nights = b.nights || 0;
  const nLabel = nights ? `${nights} noche${nights !== 1 ? 's' : ''}` : '';

  const bullets = [
    `Estancia de ${nLabel} del ${fmtDate(b.checkin)} al ${fmtDate(b.checkout)}`,
    'Habitaciones confortables, dotadas con aire acondicionado, cajillas de seguridad, Tv moderno, wifi en todas las áreas del hotel.',
    'Desayuno incluido tipo americano',
    'Check-in 3:00 pm y check-out 12:00 pm',
    'Servicio de guarda equipaje sin costo adicional',
  ];
  for (const t of bullets) {
    doc.font('Helvetica').fontSize(10).fillColor(DARK);
    doc.text(`  -${t}`, M + 10, doc.y, { width: CW - 20 });
    doc.moveDown(0.35);
  }

  const hotelInfo = HOTEL_DESCRIPTIONS[b.hotelId];
  if (hotelInfo?.text) {
    doc.moveDown(0.8);
    doc.font('Helvetica').fontSize(9.5).fillColor(MUTED);
    doc.text(hotelInfo.text, M, doc.y, { width: CW });
  }

  doc.moveDown(1.2);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(DARK).text('Acomodaciones:', M, doc.y, { width: CW });
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(10).fillColor(DARK);
  for (const r of group.rooms) {
    doc.text(`  -${r.roomName}`, M + 10, doc.y, { width: CW - 20 });
    doc.moveDown(0.25);
  }

  doc.moveDown(1);
  if (hotelInfo?.url) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD);
    doc.text('Conocer nuestro hotel', M, doc.y, { link: hotelInfo.url, underline: true, width: CW });
  } else {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(GOLD).text(b.hotelName, M, doc.y, { underline: true, width: CW });
  }
}

// ─── Page 4: Pricing ────────────────────────────────────────────────────────
function pagePricing(doc, items, totals, taxRate, deadlineStr) {
  doc.addPage();
  sectionTitle(doc, 'Tarifas');

  const bandTop = doc.y;
  band(doc, bandTop, 130);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(WHITE);
  doc.text('Información importante:', M, bandTop + 15, { width: CW });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9.5).fillColor(WHITE);
  doc.text('Los valores de las tarifas enviadas en la siguiente cotización estarán vigentes durante los próximos 5 días a partir de la fecha de envío.', M, doc.y, { width: CW });
  doc.moveDown(0.4);
  doc.text('Nota: En caso de solicitar factura a nombre de la empresa, debe enviar el RUT al momento de realizar el check-in y antes de realizar el check-out, de lo contrario, la reserva se facturará a nombre del huésped o titular de la reserva perdiendo el derecho a solicitar modificación o corrección del documento.', M, doc.y, { width: CW });

  doc.y = bandTop + 140;

  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK);
  doc.text(`Fecha límite de pago: ${deadlineStr || ''}`, M, doc.y, { width: CW });
  doc.moveDown(2);

  const tX = M + 40;
  const tW = CW - 80;

  doc.save().rect(tX, doc.y, tW, 5).fill(GOLD).restore();
  doc.y += 10;

  const tableTop = doc.y;
  doc.save().rect(tX, tableTop, tW, 30).lineWidth(0.5).stroke('#CCCCCC').restore();
  doc.font('Helvetica-Bold').fontSize(14).fillColor(DARK);
  doc.text('Tarifas', tX, tableTop + 7, { align: 'center', width: tW });
  doc.y = tableTop + 38;

  const colVal = tX + tW * 0.6;
  const colValW = tW * 0.35;

  for (const item of items) {
    const b = item.booking;
    doc.font('Helvetica').fontSize(10).fillColor(DARK);
    doc.text(b?.roomName || item.name, tX + 10, doc.y, { width: tW - 20 });
    doc.moveDown(0.7);

    const pricePerNight = b?.nights ? Math.round(item.unitPrice / (b.nights * (item.qty || 1))) : item.unitPrice;
    const subtotalNoTax = item.subtotal;

    const rows = [];
    if (b?.nights) {
      rows.push(['Precio de habitación por noche:', fmt$(pricePerNight)]);
    }
    if (b) {
      // Solo las habitaciones llevan IVA; los adicionales no.
      const itemTax = subtotalNoTax * (taxRate ?? 0.19);
      const subtotalWithTax = Math.round(subtotalNoTax + itemTax);
      rows.push(['Precio total sin impuestos:', fmt$(subtotalNoTax)]);
      rows.push(['Precio total con impuestos:', fmt$(subtotalWithTax)]);
    } else {
      rows.push(['Precio total:', fmt$(subtotalNoTax)]);
    }

    for (let i = 0; i < rows.length; i++) {
      const [label, val] = rows[i];
      const isBold = i === rows.length - 1;
      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10).fillColor(isBold ? DARK : MUTED);
      const rowY = doc.y;
      doc.text(label, tX + 10, rowY, { width: tW * 0.55 });
      doc.font('Helvetica-Bold').fillColor(DARK);
      doc.text(val, colVal, rowY, { width: colValW, align: 'right' });
      doc.y = rowY + 16;
    }
    doc.moveDown(0.6);
  }

  doc.save().rect(tX, doc.y, tW, 5).fill(GOLD).restore();
  doc.y += 20;

  doc.font('Helvetica').fontSize(13).fillColor(DARK);
  doc.text(`One-off Total ${fmt$(totals.total)}`, tX, doc.y, { align: 'right', width: tW });
}

// ─── Page 5: Payment methods ────────────────────────────────────────────────
function pagePayment(doc, bankAccountKey, responsable, signatureImg) {
  doc.addPage();
  sectionTitle(doc, 'Métodos de pago');

  const bandTop = doc.y;
  band(doc, bandTop, 90);
  doc.font('Helvetica-Bold').fontSize(11).fillColor(WHITE);
  doc.text('Información importante:', M, bandTop + 12, { width: CW });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(9.5).fillColor(WHITE);
  doc.text('Si deseas realizar el pago a través de tarjeta de crédito o débito agradecemos que al momento de firmar el documento digite la letra C para crédito o D para débito seguido de su firma.\nEjemplo: C Carlos Garcia', M, doc.y, { width: CW });

  doc.y = bandTop + 100;
  doc.moveDown(1.5);

  doc.font('Helvetica-Bold').fontSize(13).fillColor(GOLD).text('Transferencia bancaria', M, doc.y, { width: CW });
  doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text('Datos bancarios', M, doc.y + 3, { width: CW });
  doc.moveDown(1);

  const bank = bankAccountKey && BANK_ACCOUNTS[bankAccountKey];
  if (bank) {
    for (const a of bank.accounts) {
      doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text(a.banco, M, doc.y, { width: CW });
      doc.font('Helvetica').fontSize(10).fillColor(DARK);
      doc.text(`Titular de cuenta: ${a.titular}`);
      doc.text(`${a.tipo} Nº ${a.numero}`);
      if (a.nit) doc.text(`NIT: ${a.nit}`);
      doc.moveDown(0.6);
    }
  }

  doc.font('Helvetica-Bold').fontSize(10).fillColor(DARK).text('Link de pago (a solicitud del cliente).', M, doc.y, { width: CW });

  if (responsable) {
    doc.moveDown(2);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text('Atendido por', M, doc.y, { width: CW });
    doc.moveDown(0.4);
    if (signatureImg) {
      try {
        doc.image(signatureImg, M, doc.y, { fit: [160, 55] });
        doc.y += 60;
      } catch { /* skip unreadable signature */ }
    }
    doc.font('Helvetica').fontSize(10).fillColor(DARK).text(responsable.label, M, doc.y, { width: CW });
  }
}

// ─── Page 6: Terms ──────────────────────────────────────────────────────────
function pageTerms(doc) {
  doc.addPage();
  sectionTitle(doc, 'Términos y condiciones');

  function subheading(text) {
    doc.font('Helvetica-Bold').fontSize(11).fillColor(DARK).text(text, M, doc.y, { width: CW });
    doc.moveDown(0.3);
  }
  function bullet(text) {
    doc.font('Helvetica').fontSize(9.5).fillColor(DARK).text(`  -${text}`, M + 10, doc.y, { width: CW - 20 });
    doc.moveDown(0.25);
  }
  function para(text) {
    doc.font('Helvetica').fontSize(9.5).fillColor(DARK).text(text, M, doc.y, { width: CW });
    doc.moveDown(0.5);
  }

  subheading('Cancelaciones');
  bullet('En caso de cancelar o modificar su reserva deberá notificar con 72 horas de anticipación a la fecha de entrada al hotel, para no recibir penalización.');
  bullet('Si el hotel no recibe información de cancelación o modificación de su alojamiento, dentro de las 72 horas, el hotel podrá realizar la penalización parcial o total del monto de su reserva.');
  doc.moveDown(0.5);

  subheading('Tener en cuenta');
  para('El NO envío del comprobante en la fecha estipulada o anterior a esta, puede causar la apertura de disponibilidad o venta de la habitación sin previo aviso, por lo tanto, es de suma importancia hacer el envío de la foto o escáner del comprobante por el presente medio como prueba de garantía.');
  doc.moveDown(0.3);

  subheading('Grupos mínimo 30 personas');
  bullet('Deben notificar cualquier tipo de modificación antes de ingresar al hotel.');
  bullet('En caso de cancelar una reserva de grupo deberá notificar 72 horas de anticipación a la fecha de entrada al hotel, para no recibir penalización.');
  doc.moveDown(0.5);

  subheading('Estadía con menores de edad:');
  bullet('La cadena hotelera GEH Suites protege a los niños, niñas y adolescentes de la explotación sexual y comercial Ley 679 de 2001.');
  bullet('Recuerde; todo niño que viaje debe contar con su documento de identidad (Registro civil o tarjeta de identidad)');
  bullet('Si los niños que viajan no son hijos de los adultos que los representan deben contar con un permiso de los padres, autenticado en una notaría.');
  doc.moveDown(0.5);

  subheading('Turismo sostenible');
  bullet('El tráfico, comercio, consumo, colección y cualquier tipo de actividad que genere un impacto negativo en la flora y fauna está prohibida por la Ley 1333 de 2009. Quienes realicen estas actividades ilícitas incurrirán en prisión de 4 a 9 años y multas hasta de 35.000 SMLV de acuerdo a la Ley 1453 de 2011.');
  bullet('Está prohibido el tráfico y comercialización ilegal de bienes de interés cultural de acuerdo a lo establecido en la Ley 1185 de 2008');
  doc.moveDown(1);

  const footY = Math.max(doc.y, PAGE_H - 130);
  band(doc, footY, PAGE_H - footY);
  doc.font('Times-Roman').fontSize(26).fillColor(WHITE);
  doc.text('¿Preguntas?', M, footY + 15, { align: 'center', width: CW });
  doc.font('Helvetica').fontSize(11).fillColor(WHITE);
  doc.text('Contáctame', M, doc.y + 2, { align: 'center', width: CW });
  doc.moveDown(0.2);
  doc.text('Whatsapp y Llamadas +57 3336025021', M, doc.y, { align: 'center', width: CW });
}

export function buildPdfFilename(quote) {
  const primaryHotel = (quote.items || []).find((i) => i.booking?.hotelName)?.booking?.hotelName;
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}_${String(now.getMonth() + 1).padStart(2, '0')}_${now.getFullYear()}`;
  return primaryHotel
    ? `COTIZACIÓN DE RESERVA ${primaryHotel.toUpperCase()}  ${dateStr}.pdf`
    : `Cotizacion ${dateStr}.pdf`;
}

// ─── Main ────────────────────────────────────────────────────────────────────
export async function buildQuotePdf({ quote }) {
  const clientName = quote.client?.name || 'Cliente';
  const items = quote.items || [];
  const totals = quote.totals || {};
  const taxRate = quote.taxRate ?? 0.19;
  const groups = groupBookings(items);

  const primary = groups[0];
  const responsableKey = primary?.items[0]?.booking?.responsableKey
    || items.find((i) => i.booking?.responsableKey)?.booking?.responsableKey;
  const responsable = responsableKey && RESPONSABLES[responsableKey];

  const imageBuffers = new Map();
  const toFetch = [];

  for (const g of groups) {
    const hUrl = getHotelImageUrl(g.booking.hotelId, g.booking.hotelName);
    if (hUrl) toFetch.push({ key: `h:${g.booking.hotelId}`, url: hUrl });
    for (const r of g.rooms) {
      const rUrl = getRoomImageUrl(g.booking.hotelId, r.roomId);
      if (rUrl) toFetch.push({ key: `r:${g.booking.hotelId}:${r.roomId}`, url: rUrl });
    }
  }
  if (responsable?.signatureUrl) toFetch.push({ key: 'signature', url: responsable.signatureUrl });

  const [logoImg, ...fetched] = await Promise.all([
    fetchImg(LOGO_URL),
    ...toFetch.map(({ url }) => fetchImg(url)),
  ]);
  for (let i = 0; i < toFetch.length; i++) {
    if (fetched[i]) imageBuffers.set(toFetch[i].key, fetched[i]);
  }

  const doc = new PDFDocument({ size: 'LETTER', margins: { top: M, bottom: M, left: M, right: M } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  if (primary) {
    const hImg = imageBuffers.get(`h:${primary.booking.hotelId}`);
    const rKey = `r:${primary.booking.hotelId}:${primary.rooms[0]?.roomId}`;
    const rImg = imageBuffers.get(rKey);
    const signatureImg = imageBuffers.get('signature');

    pageCover(doc, primary.booking, hImg, logoImg);
    pageWelcome(doc, primary.booking, clientName, rImg);
    pageDescription(doc, primary);
    const bankKey = primary.items[0]?.booking?.bankAccountKey
      || items.find((i) => i.booking?.bankAccountKey)?.booking?.bankAccountKey;
    const deadlineStr = resolveDeadlineStr(quote, primary.booking.checkin);
    pagePricing(doc, items, totals, taxRate, deadlineStr);
    pagePayment(doc, bankKey, responsable, signatureImg);
    pageTerms(doc);
  } else {
    sectionTitle(doc, 'Cotización');
    doc.font('Helvetica').fontSize(11).fillColor(DARK);
    doc.text(`Estimado ${clientName},`, M, doc.y, { width: CW });
    doc.moveDown(0.5);
    if (items.length) {
      pagePricing(doc, items, totals, taxRate, resolveDeadlineStr(quote, null));
    }
  }

  doc.end();
  return new Promise((resolve) => { doc.on('end', () => resolve(Buffer.concat(chunks))); });
}
