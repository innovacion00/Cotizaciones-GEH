const HOTEL_IMAGES = {
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

const ROOM_IMAGES = {
  '83534': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/244639436.jpg?k=6053b3890a7824a3f1a2e30cf862520be80de97644162b30a3e0097d920efafd&o=&hp=1',
  '83533': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/100688038.jpg?k=54490e2560d63e691c5d1cf6b009af33d7931f19ef58f69cfbadcc1d7d7b9e2e&o=&hp=1',
  '83527': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/244687926.jpg?k=145b19423036fee51796d9fc3cf6faeb5d6781a48d68172524d4860e74cce1e7&o=&hp=1',
  '83528': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/244687909.jpg?k=588a0945ee3388cd5a731509f2159507ddc6909d57cf82705c8459bda40af93e&o=&hp=1',
  '83529': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/243543715.jpg?k=7a47cd6af5f8971556ec91581b60c011e0544430470ef73311dd1663eb7dae96&o=&hp=1',
  '83532': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/243552213.jpg?k=6ae2287058f976690f09ec48b1ea9f1b44deb127fc846bc6e9c976e80c3cdece&o=&hp=1',
  '83422': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/243606366.jpg?k=56a1826f8a1cc73a276daa1fca9939e8ded4bd93d437ce8b5cdf108f5182ee9d&o=&hp=1',
  '83419': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/243822212.jpg?k=a952a8491f9d7ef59dde500bb8f4a3848ff65bf59947885a8c865ab120cb99c8&o=&hp=1',
  '83421': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/243822181.jpg?k=4fe61a142fd7b7db782f34e6ea7840c69a1410144320158a8735ff12fc130149&o=&hp=1',
  '83420': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/243604358.jpg?k=204560397c2a8805509a69aa6b658e302d5ac75e6bf0796006feac48e1cb1287&o=&hp=1',
  '90131': 'https://bocagrande-cartagena-de-indias-hotel.hotelmix.es/data/Photos/1920x1080/7442/744293/744293593/Hotel-Bocagrande-By-Geh-Suites-Cartagena-Exterior.JPEG',
  '90130': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/278270762.jpg?k=cfe9e10545681c6490650e349d45ab6c7dea125d24801658e92055501b28e1e1&o=&hp=1',
  '90132': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/278271044.jpg?k=a355c5879bfeb9e27598302ed92b706d247b75751f5b6913e3646dba034a4c89&o=&hp=1',
  '90133': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/278270629.webp?k=5ff367659e2bf52e7d12d2be46a8097d2f841da5412af77427e4b2871298668e&o=',
  '125838': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/465103653.jpg?k=5d5ac95d4cfffcbb34279c6bfceff8f9e83d7ff91667ef35e8b18a2e66b3b810&o=&hp=1',
  '125836': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/465103716.jpg?k=72751312367e83c523a272fa6b3a003b39e4fddec303f9b4ccf90d4fe617f0e6&o=&hp=1',
  '123528': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/465103716.jpg?k=72751312367e83c523a272fa6b3a003b39e4fddec303f9b4ccf90d4fe617f0e6&o=&hp=1',
  '125839': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/465103679.jpg?k=3f562015f90b32aef1908717d3d9c829ca84205b75c2dea10f23a24086cb6c33&o=',
  '125837': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/465103563.jpg?k=c576cf614094adb97aac6fb5efaf9824d0e82cc4475335da439307f9b988c998&o=&hp=1',
  '129033': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20windsor/Doble%20estandar%20twin.jpg',
  '128299': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20windsor/Doble%20Superior.jpg',
  '129035': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20windsor/Doble%20Junior%20Suite.jpg',
  '129036': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20windsor/Doble%20Junior%20Twin.jpg',
  '129037': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20windsor/Suite%20Matrimonial.jpg',
  '129034': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20windsor/Triple%20Estandar%20altillo%20con%20escaleras.jpg',
  '109508': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20madisson/Ejecutiva%20Twin.jpg',
  '109452': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20madisson/Habitacion%20Estandar.jpg',
  '109509': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/383334155.jpg?k=ba1ec414837795ab1103b686854e44de7bed29be732ebe15e4939f48caed974b&o=&hp=1',
  '116068': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20madisson/Familiar%203Pax.jpg',
  '16255:125832': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20madisson/Suite%20Business.jpg',
  '109505': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20madisson/Superior%20con%20terraza.jpg',
  '109507': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20madisson/SUITE%20BUSINESS%202.jpg',
  '125833': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20rodadero/Cuadruple%20estandar.jpg',
  '121966': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20rodadero/Doble%20estandar.jpg',
  '17491:125832': 'https://space-img.sfo3.digitaloceanspaces.com/Hoteles%20y%20habitaciones/habitaciones%20rodadero/Triple%20estandar.jpg',
  '104423': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/277587915.webp?k=be35499f5579b4a7e3023c6f36ea998be04c2e9c436744d6668a29b4ac779e24&o=',
  '104145': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/276804089.webp?k=e98318f7fe089ef70520a3b984f5c08bcf5507fb0d92a1ab56c243473912d928&o=',
  '104422': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/276804078.webp?k=c39084688f6346321275d1563e107f25fb3ff606b136083830a9f1fcd869d0fc&o=',
  '145577': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-Familiar-axis.jpeg',
  '145576': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/109098049.jpg?k=d28963d3d5f71aa4e6fcc2e3864341d453c8d5bd2aeb8875caaf92d9e9b6c63a&o=',
  '145571': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-Doble-axis.jpeg',
  '145573': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-triple-axis2.jpeg',
  '104179': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-Doble-sansiraka.jpeg',
  '104979': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-twin-sansiraka1.jpeg',
  '104181': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-junior-sansiraka.jpeg',
  '104182': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-triple-sansiraka.jpeg',
  '104183': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-cuadruple-sansiraka.jpeg',
  '104184': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/Habitacion-quintuple-sansiraka.jpeg',
  '164101': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/habitacion_cuadruple_salguero.jpg',
  '164100': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/habitacion_triple_salguero.jpg',
  '164099': 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/760635557.jpg?k=4f27fe4927417058fce420af7e61ceb23f36e26733c9f6bf7d0ef98514a43123&o=',
  '83803': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/doble1_boquilla.jpg',
  '83802': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/familiar_boquilla.jpg',
  '83801': 'https://space-img.sfo3.digitaloceanspaces.com/Agencias/cuadruple1_boquilla.jpg',
};

export function getRoomImageUrl(hotelId, roomId) {
  if (!roomId) return null;
  if (hotelId) {
    const composite = ROOM_IMAGES[`${hotelId}:${roomId}`];
    if (composite) return composite;
  }
  return ROOM_IMAGES[roomId] || null;
}
