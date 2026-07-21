export const RESPONSABLES = {
  angelica_vizcaino: {
    label: 'Angelica Vizcaino',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Angelica%20Vizacaino.png',
  },
  belcy_perez: {
    label: 'Belcy Perez',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Belcy%20P%C3%A9rez.png',
  },
  brianys_cassere: {
    label: 'Brianys Cassere',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Brianys%20Cassere.png',
  },
  daniela_bermudez: {
    label: 'Daniela Bermudez',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Daniela%20Bermudez.png',
  },
  daniela_lopez: {
    label: 'Daniela Lopez',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Daniela%20Lopez.png',
  },
  eimy_jimenez: {
    label: 'Eimy Jimenez',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Eimy%20Jimenez.png',
  },
  eyleen_jimenez: {
    label: 'Eyleen Jimenez',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Eyleen%20Jimenez.png',
  },
  gloria_herrera: {
    label: 'Gloria Herrera',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Gloria%20Herrera.png',
  },
  maria_orozco: {
    label: 'Maria Orozco',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Maria%20Orozco.png',
  },
  dina_guerrero: {
    label: 'Dina Guerrero',
    signatureUrl: 'https://space-img.sfo3.digitaloceanspaces.com/firmas/Dina%20Guerrero.png',
  },
};

export function getResponsableLabel(key) {
  return RESPONSABLES[key]?.label || '';
}
