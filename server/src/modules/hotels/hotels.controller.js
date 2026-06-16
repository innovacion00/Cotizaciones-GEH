import * as hotelsService from './hotels.service.js';
import { okResponse } from '../../shared/utils/index.js';

export function listCities(_req, res, next) {
  try {
    return okResponse(res, { cities: hotelsService.getCities() });
  } catch (err) {
    return next(err);
  }
}

export function listHotels(req, res, next) {
  try {
    const hotels = hotelsService.getHotelsByCity(req.query.city || '');
    return okResponse(res, { hotels });
  } catch (err) {
    return next(err);
  }
}

export function listRooms(req, res, next) {
  try {
    const rooms = hotelsService.getHotelRooms(req.params.hotelId);
    return okResponse(res, { rooms });
  } catch (err) {
    return next(err);
  }
}

export async function getAvailability(req, res, next) {
  try {
    const { hotelId } = req.params;
    const { checkin, checkout, adults, children_ages } = req.query;
    const childrenAges =
      children_ages && children_ages !== '0'
        ? children_ages.split(',').map((a) => parseInt(a, 10))
        : [];
    const result = await hotelsService.getAvailability({
      hotelId,
      checkin,
      checkout,
      adults: parseInt(adults, 10) || 1,
      childrenAges,
    });
    return okResponse(res, result);
  } catch (err) {
    return next(err);
  }
}
