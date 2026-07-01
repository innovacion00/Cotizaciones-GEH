export const BANK_ACCOUNTS = {
  aixo: {
    label: 'AIXO',
    accounts: [
      { banco: 'Banco Davivienda', titular: 'Econo Hotel Group', tipo: 'Cuenta Corriente', numero: '057169988813', nit: '901116843-1' },
      { banco: 'Banco Bancolombia', titular: 'Econo Hotel Group', tipo: 'Cuenta Corriente', numero: '09800001143', nit: '901116843-1' },
    ],
  },
  marina_madisson: {
    label: 'MARINA / MADISSON',
    accounts: [
      { banco: 'Banco Davivienda', titular: 'DT HOTELES & INN S.A.S', tipo: 'Cuenta Corriente', numero: '0571-6999 0330', nit: '900.725.984-9' },
      { banco: 'Banco Bancolombia', titular: 'DT HOTELES & INN SAS', tipo: 'Cuenta Corriente', numero: '098-000011-52', nit: '900.725.984-9' },
    ],
  },
  azuan_avexi_rodadero_axis: {
    label: 'AZUAN / AVEXI / RODADERO / AXIS',
    accounts: [
      { banco: 'Banco Davivienda', titular: 'Caribe Hoteles & suites S.A.S', tipo: 'Cuenta Corriente', numero: '057169989969', nit: '900 801 256-0' },
      { banco: 'Banco Bancolombia', titular: 'Caribe Hoteles & suites S.A.S', tipo: 'Cuenta Corriente', numero: '098-0000-1054', nit: '900 801 256-0' },
    ],
  },
  abi_sansiraka: {
    label: 'ABI / SANSIRAKA',
    accounts: [
      { banco: 'Banco Bancolombia', titular: 'SMART STAY SAS', tipo: 'Cuenta Corriente', numero: '08500008723', nit: '901691840-2' },
      { banco: 'Banco Davivienda', titular: 'SMART STAY SAS', tipo: 'Cuenta Corriente', numero: '057169987054', nit: '901691840-2' },
    ],
  },
  windsor: {
    label: 'WINDSOR',
    accounts: [
      { banco: 'Banco Bancolombia', titular: 'SOCIEDAD HOTELERA FAM SAS', tipo: 'Cuenta Corriente', numero: '085-000088-34', nit: '901718424' },
      { banco: 'Banco Davivienda', titular: 'SOCIEDAD HOTELERA FAM SAS', tipo: 'Cuenta Corriente', numero: '108969947457', nit: '901718424' },
    ],
  },
  boquilla: {
    label: 'BOQUILLA',
    accounts: [
      { banco: 'Bancolombia', titular: 'JARSY ESLYN BARBOZA CALVO', tipo: 'Cuenta de Ahorros', numero: '09800008957' },
    ],
  },
  playa_salguero: {
    label: 'PLAYA SALGUERO',
    accounts: [
      { banco: 'Bancolombia', titular: 'EVELYN RIOS', tipo: 'Cuenta de Ahorros', numero: '098-0000-19-82' },
    ],
  },
};

export const HOTEL_TO_BANK = {
  '13633': 'aixo',
  '13643': 'marina_madisson',
  '16255': 'marina_madisson',
  '13645': 'azuan_avexi_rodadero_axis',
  '13644': 'azuan_avexi_rodadero_axis',
  '17491': 'azuan_avexi_rodadero_axis',
  '19629': 'azuan_avexi_rodadero_axis',
  '17644': 'abi_sansiraka',
  '15740': 'abi_sansiraka',
  '18004': 'windsor',
  '13677': 'boquilla',
  '21590': 'playa_salguero',
};

export function getDefaultBankKey(hotelId) {
  return HOTEL_TO_BANK[hotelId] || null;
}
