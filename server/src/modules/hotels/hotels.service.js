import { env } from '../../config/env.js';
import { HOTELS, CITIES } from './hotels.constants.js';
import { AppError } from '../../shared/errors/AppError.js';

function normalizeRateName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function isExcludedRate(roomName) {
  const n = normalizeRateName(roomName);
  return n.includes('b2b') || n.includes('no reembolsable');
}

/** Tarifa pública estándar reembolsable (no B2B, no NR). */
function isStandardRate(roomName) {
  if (isExcludedRate(roomName)) return false;
  const n = normalizeRateName(roomName);
  return n.includes('[tarifa estandar]') || n.includes('[standard]');
}

function pickStandardProduct(products) {
  if (!products?.length) return null;
  return products.find((p) => isStandardRate(p.roomName)) ?? null;
}

function mapProductPricing(product) {
  return {
    rateId: product.rateId,
    boardTypeDescription: product.boardTypeDescription,
    refundable: product.refundable,
    cancellationPolicy: product.cancellationPolicy,
    currency: product.currency,
    trm: product.trm,
    amountBeforeTax: product.baseRate.amountBeforeTax,
    amountAfterTax: product.baseRate.amountAfterTax,
  };
}

export function getCities() {
  return CITIES;
}

export function getHotelsByCity(city) {
  return Object.entries(HOTELS)
    .filter(([, h]) => h.city === city)
    .map(([hotelId, h]) => ({ hotelId, name: h.name }));
}

export function getHotelRooms(hotelId) {
  const hotel = HOTELS[hotelId];
  if (!hotel) throw new AppError('Hotel no encontrado', 404, 'NOT_FOUND');
  return hotel.rooms;
}

export async function getAvailability({ hotelId, checkin, checkout, adults, childrenAges }) {
  const hotel = HOTELS[hotelId];
  if (!hotel) throw new AppError('Hotel no encontrado', 404, 'NOT_FOUND');

  const checkinDate = new Date(checkin);
  const checkoutDate = new Date(checkout);
  const nights = Math.round((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
  if (nights < 1) throw new AppError('La fecha de checkout debe ser posterior al checkin', 422, 'INVALID_DATES');

  // DECISION: children_ages se envía como '0' cuando no hay menores, o como lista separada por comas ej. '1,10'
  const childrenAgesParam = !childrenAges || childrenAges.length === 0 ? '0' : childrenAges.join(',');

  const url = new URL('/v2/bookings/availability', env.AUTOCORE_BOOKING_URL);
  url.searchParams.set('hotel_id', hotelId);
  url.searchParams.set('checkin', checkin);
  url.searchParams.set('nights', nights);
  url.searchParams.set('adults', adults || 1);
  url.searchParams.set('children_ages', childrenAgesParam);

  const res = await fetch(url.toString(), {
    headers: {
      access_key: env.AUTOCORE_BOOKING_ACCESS_KEY,
      secret_key: env.AUTOCORE_BOOKING_SECRET_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new AppError(`Error consultando disponibilidad (${res.status}): ${text}`, 502, 'BOOKING_API_ERROR');
  }

  const data = await res.json();

  // Indexar habitaciones disponibles por roomId con tarifa estándar reembolsable
  const pricingByRoomId = {};
  for (const room of data.available_rooms || []) {
    const standardProduct = pickStandardProduct(room.products);
    if (standardProduct) {
      pricingByRoomId[String(room.roomId)] = {
        count: room.count,
        ...mapProductPricing(standardProduct),
      };
    }
  }

  return {
    hotelId,
    hotelName: hotel.name,
    city: hotel.city,
    checkin,
    checkout,
    nights,
    adults: adults || 1,
    childrenAges: childrenAges || [],
    rooms: hotel.rooms.map((room) => {
      const pricing = pricingByRoomId[String(room.roomId)];
      return {
        roomId: room.roomId,
        roomName: room.roomName,
        available: !!pricing,
        pricing: pricing || null,
      };
    }),
  };
}
