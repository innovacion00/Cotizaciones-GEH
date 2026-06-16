export const HOTELS = {
  // Cartagena
  '13645': { city: 'Cartagena', name: 'Hotel Azuan', rooms: [
    { roomId: '83534', roomName: 'Habitacion Doble Standard' },
    { roomId: '83533', roomName: 'Habitacion Cuadruple Standard' },
    { roomId: '83533', roomName: 'Habitacion triple Standard' },
  ]},
  '13633': { city: 'Cartagena', name: 'Hotel Aixo', rooms: [
    { roomId: '83422', roomName: 'Habitacion Doble Standard con vista al mar' },
    { roomId: '83421', roomName: 'Habitacion Cuadruple standard con vista a la ciudad' },
    { roomId: '83419', roomName: 'Habitacion cuadruple superior con vista al mar' },
    { roomId: '83420', roomName: 'Habitación Doble Standard con Vista a la Ciudad' },
  ]},
  '13644': { city: 'Cartagena', name: 'Hotel Avexi', rooms: [
    { roomId: '83532', roomName: 'Habitacion Doble Standard' },
    { roomId: '83529', roomName: 'Habitacion Cuadruple Standard' },
    { roomId: '83529', roomName: 'Habitacion triple Standard' },
  ]},
  '13643': { city: 'Cartagena', name: 'Hotel Marina', rooms: [
    { roomId: '83528', roomName: 'Habitacion Doble Standard' },
    { roomId: '83527', roomName: 'Habitacion Cuadruple Standard' },
    { roomId: '83527', roomName: 'Habitacion triple Standard' },
  ]},
  '14364': { city: 'Cartagena', name: 'Hotel Bocagrande', rooms: [] },
  '17644': { city: 'Cartagena', name: 'Hotel Abi', rooms: [
    { roomId: '125839', roomName: 'Familiar quintuple' },
    { roomId: '125838', roomName: 'Cuadruple estandar' },
    { roomId: '125837', roomName: 'Triple estandar' },
    { roomId: '125836', roomName: 'Doble estandar' },
  ]},
  '13677': { city: 'Cartagena', name: 'Hotel Boquilla', rooms: [] },

  // Bogota
  '18004': { city: 'Bogota', name: 'Hotel Windsor', rooms: [] },
  '16255': { city: 'Bogota', name: 'Hotel Madisson', rooms: [] },

  // Santa marta
  '17491': { city: 'Santa marta', name: 'Hotel Rodadero', rooms: [
    { roomId: '121966', roomName: 'Doble estándar' },
    { roomId: '125833', roomName: 'Cuadruple estandar' },
    { roomId: '125832', roomName: 'Triple estandar' },
  ]},
  '19629': { city: 'Santa marta', name: 'Hotel Axis', rooms: [
    { roomId: '145577', roomName: 'Quíntuple' },
    { roomId: '145576', roomName: 'Cuádruple' },
    { roomId: '145573', roomName: 'Triple estándar' },
    { roomId: '145571', roomName: 'Doble estandar' },
  ]},
  '15740': { city: 'Santa marta', name: 'Hotel Sansiraka', rooms: [
    { roomId: '104182', roomName: 'TRIPLE' },
    { roomId: '104181', roomName: 'JUNIOR SUITE' },
  ]},
  '21590': { city: 'Santa marta', name: 'Playa Salguero Hotel', rooms: [] },
};

export const CITIES = [...new Set(Object.values(HOTELS).map((h) => h.city))];
