export type Place = {
  id: string;
  nombre: string;
  categoria: string;
  icono: string;
  descripcion: string;
  direccion: string;
  horario: string;
  precio: string;
  imagen?: any;
  telefono?: string;
  web?: string;
  latitud: number;
  longitud: number;
};

export const lugares: Place[] = [
  {
    id: 'centro-colon',
    nombre: 'Plaza Washington',
    categoria: 'Centro',
    icono: '📍',
    descripcion:
      'Uno de los espacios centrales y tradicionales de Colón, ideal para comenzar a recorrer la ciudad y conocer sus alrededores.',
    direccion: 'Colón, Entre Ríos',
    horario: 'Espacio público',
    precio: 'Entrada libre',
    imagen: require('../../assets/images/lugares/plaza-washington.jpg'),
    latitud: -32.22477,
    longitud: -58.14261,
  },

  {
    id: 'termas-colon',
    nombre: 'Termas de Colón',
    categoria: 'Termas',
    icono: '♨️',
    descripcion:
      'Complejo termal de Colón con piscinas y espacios para disfrutar de una jornada de descanso y recreación.',
    direccion: 'Batalla de Cepeda 100, Colón, Entre Ríos',
    horario: 'Todos los días de 9:00 a 20:00 hs.',
    precio: 'Consultar tarifa',
    imagen: require('../../assets/images/lugares/termas-colon.jpg'),
    telefono: '+54 3447 434761',
    web: 'https://termascolon.gov.ar/',
    latitud: -32.20895,
    longitud: -58.14675,
  },

  {
    id: 'parque-quiros',
    nombre: 'Parque Quirós',
    categoria: 'Naturaleza',
    icono: '🌳',
    descripcion:
      'Espacio verde junto al río Uruguay, ideal para caminar, descansar y disfrutar de la naturaleza.',
    direccion: 'Colón, Entre Ríos',
    horario: 'Espacio público',
    precio: 'Entrada libre',
    imagen: require('../../assets/images/lugares/parque-quiros.jpg'),
    latitud: -32.22623,
    longitud: -58.13261,
  },

  {
    id: 'playa-inkier',
    nombre: 'Playa Inkier',
    categoria: 'Playa',
    icono: '🏖️',
    descripcion:
      'Una de las playas de Colón para disfrutar del río Uruguay, el paisaje y las actividades al aire libre.',
    direccion: 'Colón, Entre Ríos',
    horario: 'Consultar temporada',
    precio: 'Consultar',
    imagen: require('../../assets/images/lugares/playa-inkier.jpg'),
    latitud: -32.22772,
    longitud: -58.12838,
  },

  {
    id: 'puerto-colon',
    nombre: 'Puerto de Colón',
    categoria: 'Río y paseo',
    icono: '⚓',
    descripcion:
      'Zona tradicional de la ciudad ubicada junto al río Uruguay, ideal para pasear y disfrutar del paisaje.',
    direccion: 'Av. Gdor. Quiros 99-149, Colón, Entre Ríos',
    horario: 'Espacio público',
    precio: 'Entrada libre',
    imagen: require('../../assets/images/lugares/puerto-colon.jpg'),
    latitud: -32.21577,
    longitud: -58.13604,
  },

  {
    id: 'molino-forclaz',
    nombre: 'Molino Forclaz',
    categoria: 'Patrimonio',
    icono: '🏛️',
    descripcion:
      'Sitio histórico y patrimonial cercano a Colón que conserva uno de los antiguos molinos de la región.',
    direccion: 'Primeros Colonos s/n, Colón, Entre Ríos',
    horario: 'Consultar horarios',
    precio: '$5.000',
    imagen: require('../../assets/images/lugares/molino-forclaz.jpg'),
    telefono: '+54 9 3447 577133',
    web: 'https://molinoforclaz.com/',
    latitud: -32.2172,
    longitud: -58.18665,
  },
];