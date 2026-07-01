/** Imágenes de fachada por hotel (hotelId del API Autocore). */
export const HOTEL_IMAGES = {
  '13633': 'https://images.trvl-media.com/lodging/22000000/21350000/21343600/21343503/e5e1ec59.jpg?impolicy=resizecrop&rw=575&rh=575&ra=fill',
  '13645': 'https://www.gehsuites.com/recursos/imagenes/hotels/hotel-azuan-suites.jpg',
  '13644': 'https://media-cdn.tripadvisor.com/media/photo-s/1a/fe/a1/45/hotel-avexi-suites.jpg',
  '13643': 'https://www.gehsuites.com/recursos/imagenes/hotels/hotel-marina-suites.jpg',
  '17644': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/fachada_hotelabi.jpg',
  '13677': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/fachada_boquilla.jpg',
  '18004': 'https://images.trvl-media.com/lodging/95000000/94320000/94314400/94314363/7ba08d14.jpg?impolicy=resizecrop&rw=575&rh=575&ra=fill',
  '16255': 'https://www.gehsuites.com/recursos/imagenes/hotels/hotel-madisson-inn.jpg',
  '17491': 'https://www.gehsuites.com/recursos/imagenes/hotels/hotel-rodadero-inn.jpg',
  '19629': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Hotel-axis.jpg',
  '15740': 'https://www.gehsuites.com/recursos/imagenes/hotels/hotel-sansiraka.jpg',
  '21590': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/fachada_salguero.jpg',
};

/** Fallback por nombre normalizado (hoteles aún no en el catálogo). */
const HOTEL_IMAGES_BY_NAME = {
  marques: 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/lobby_marques.jpg',
};

function normalizeHotelName(name) {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/^hotel\s+/i, '')
    .replace(/\s+hotel$/i, '')
    .trim();
}

export function getHotelImageUrl(hotelId, hotelName) {
  if (hotelId && HOTEL_IMAGES[hotelId]) return HOTEL_IMAGES[hotelId];
  const key = normalizeHotelName(hotelName);
  return HOTEL_IMAGES_BY_NAME[key] || null;
}
