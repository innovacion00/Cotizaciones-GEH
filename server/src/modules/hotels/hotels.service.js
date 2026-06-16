import { env } from '../../config/env.js';
import { HOTELS, CITIES } from './hotels.constants.js';
import { AppError } from '../../shared/errors/AppError.js';

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

  // Indexar habitaciones disponibles por roomId, filtrando a la tarifa [Tarifa Estándar]
  const pricingByRoomId = {};
  for (const room of data.available_rooms || []) {
    const standardProduct = room.products?.find((p) => p.roomName.includes('[Tarifa Estándar]'));
    if (standardProduct) {
      pricingByRoomId[room.roomId] = {
        count: room.count,
        rateId: standardProduct.rateId,
        boardTypeDescription: standardProduct.boardTypeDescription,
        refundable: standardProduct.refundable,
        cancellationPolicy: standardProduct.cancellationPolicy,
        currency: standardProduct.currency,
        trm: standardProduct.trm,
        amountBeforeTax: standardProduct.baseRate.amountBeforeTax,
        amountAfterTax: standardProduct.baseRate.amountAfterTax,
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
      const pricing = pricingByRoomId[room.roomId];
      return {
        roomId: room.roomId,
        roomName: room.roomName,
        available: !!pricing,
        pricing: pricing || null,
      };
    }),
  };
}
