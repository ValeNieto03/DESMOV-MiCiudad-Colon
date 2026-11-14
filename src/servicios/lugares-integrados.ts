import { lugares } from '@/data/lugares';
import type { Place } from '@/data/lugares';

import {
  obtenerLugaresAPI,
  obtenerCategoriasAPI,
  prepararUrlImagen,
} from './api';

import type { LugarAPI } from './api';
import { obtenerAudioLocal } from './audioguias-locales';
import { Directory, File, Paths } from 'expo-file-system';

type CategoriaAPI = {
  id: string;
  nombre: string;
};

import {
  guardarLugaresLocales,
  obtenerLugaresLocales,
} from './visitas';

// --------------------------------------------------
// DESCARGA Y ALMACENAMIENTO LOCAL DE IMÁGENES
// --------------------------------------------------

function generarHashImagen(url: string): string {
  let hash = 2166136261;

  for (let i = 0; i < url.length; i++) {
    hash ^= url.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

async function descargarImagenLugar(
  lugar: Place,
  directorio: Directory,
): Promise<Place> {
  try {
    const imagen = lugar.imagen;

    // Las imágenes incluidas en la aplicación mediante require()
    // no necesitan descargarse.
    if (
      !imagen ||
      typeof imagen !== 'object' ||
      typeof imagen.uri !== 'string'
    ) {
      return lugar;
    }

    const url = imagen.uri;

    // Solo descargamos imágenes remotas.
    if (!/^https?:\/\//i.test(url)) {
      return lugar;
    }

    const extension =
      url.split(/[?#]/)[0].match(/\.(jpg|jpeg|png|webp)$/i)?.[0] ??
      '.img';

    const idSeguro = lugar.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const hash = generarHashImagen(url);

    const archivo = new File(
      directorio,
      `${idSeguro}-${hash}${extension}`,
    );

    // Reutilizamos la imagen si ya está guardada.
    if (archivo.exists) {
      return {
        ...lugar,
        imagen: { uri: archivo.uri },
      };
    }

    const archivoDescargado = await File.downloadFileAsync(
      url,
      archivo,
      { idempotent: true },
    );

    return {
      ...lugar,
      imagen: { uri: archivoDescargado.uri },
    };
  } catch (error) {
    console.warn(
      `No se pudo guardar localmente la imagen de ${lugar.nombre}:`,
      error,
    );

    return lugar;
  }
}

// --------------------------------------------------
// NORMALIZAR NOMBRES
// --------------------------------------------------

function normalizarNombre(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}
// --------------------------------------------------
// UNIFICAR CATEGORÍAS
// --------------------------------------------------

function normalizarCategoria(categoria: string): string {
  const nombre = normalizarNombre(categoria);

  if (
    [
      'historia y cultura',
      'patrimonio',
      'museos',
      'museo',
      'museos y patrimonio',
    ].includes(nombre)
  ) {
    return 'Museos y patrimonio';
  }

  if (nombre === 'playa' || nombre === 'playas') {
    return 'Playas';
  }

  if (nombre === 'terma' || nombre === 'termas') {
    return 'Termas';
  }

  if (nombre === 'gastronomia') {
    return 'Gastronomía';
  }

  if (
    nombre === 'artesania' ||
    nombre === 'artesanias'
  ) {
    return 'Artesanías';
  }

  if (nombre === 'alojamiento') {
    return 'Alojamiento';
  }

  if (nombre === 'naturaleza') {
    return 'Naturaleza';
  }

  if (nombre === 'rio y paseo') {
    return 'Naturaleza';
  }

  if (nombre === 'centro') {
    return 'Centro';
  }

  return categoria.trim() || 'Otros';
}

// --------------------------------------------------
// INSIGNIAS SEGÚN LA CATEGORÍA
// --------------------------------------------------

function obtenerIconoCategoria(categoria: string): string {
  const categoriaNormalizada =
    normalizarNombre(normalizarCategoria(categoria));

  const iconos: Record<string, string> = {
    'museos y patrimonio': '🏛️',
    playas: '🏖️',
    termas: '♨️',
    gastronomia: '🍽️',
    artesanias: '🎨',
    alojamiento: '🛏️',
    naturaleza: '🌿',
    centro: '📍',
    otros: '📍',
  };

  return iconos[categoriaNormalizada] ?? '📍';
}

// --------------------------------------------------
// EQUIVALENCIAS DE NOMBRES
// --------------------------------------------------

const equivalenciasNombres: Record<string, string> = {
  'parque dr herminio j quiros': 'parque quiros',
  'parque dr herminio quiros': 'parque quiros',
  'costanera gobernador quiros': 'costanera de colon',
  'puerto de colon': 'puerto de colon',
};

// --------------------------------------------------
// BUSCAR SI EL LUGAR YA EXISTE LOCALMENTE
// --------------------------------------------------

function buscarLugarLocal(
  nombreAPI: string
): Place | undefined {
  const nombreNormalizado = normalizarNombre(nombreAPI);

  const coincidenciaExacta = lugares.find(
    (lugar) =>
      normalizarNombre(lugar.nombre) === nombreNormalizado
  );

  if (coincidenciaExacta) {
    return coincidenciaExacta;
  }

  const nombreEquivalente =
    equivalenciasNombres[nombreNormalizado];

  if (!nombreEquivalente) {
    return undefined;
  }

  return lugares.find(
    (lugar) =>
      normalizarNombre(lugar.nombre) === nombreEquivalente
  );
}

// --------------------------------------------------
// OBTENER NOMBRE DE CATEGORÍA
// --------------------------------------------------

function obtenerCategoria(
  categoriaId: string,
  categorias: CategoriaAPI[]
): string {
  const categoria = categorias.find(
    (item) => item.id === categoriaId
  );

  return normalizarCategoria(
    categoria?.nombre ?? 'Otros'
  );
}

// --------------------------------------------------
// CONVERTIR PRECIO
// --------------------------------------------------

function convertirPrecio(
  precio: LugarAPI['precioEntrada'],
  precioAnterior: string
): string {
  if (precio === null || precio === undefined) {
    return precioAnterior;
  }

  if (typeof precio === 'number') {
    return precio === 0 ? 'Gratis' : `$${precio}`;
  }

  return precio;
}

// --------------------------------------------------
// CONVERTIR HORARIOS
// --------------------------------------------------



type HorarioAPI = {
  dia: number;
  abre: string;
  cierra: string;
};


function convertirHorario(
  horarios: (string | HorarioAPI)[] | undefined,
  horarioAnterior: string
): string {
  if (!horarios || horarios.length === 0) {
    return horarioAnterior;
  }

  const dias = [
    'domingo',
    'lunes',
    'martes',
    'miércoles',
    'jueves',
    'viernes',
    'sábado',
  ];

  const horariosTexto = horarios.filter(
    (horario): horario is string =>
      typeof horario === 'string' && horario.trim().length > 0
  );

  const horariosPorDia = horarios.filter(
    (horario): horario is HorarioAPI =>
      typeof horario !== 'string' &&
      horario.abre?.trim().length > 0 &&
      horario.cierra?.trim().length > 0 &&
      horario.dia >= 0 &&
      horario.dia <= 7
  );

  if (horariosPorDia.length === 0) {
    return horariosTexto.length > 0
      ? [...new Set(horariosTexto)].join(' · ')
      : horarioAnterior;
  }

  const grupos = new Map<string, number[]>();

  for (const horario of horariosPorDia) {
    const dia = horario.dia === 7 ? 0 : horario.dia;
    const clave = `${horario.abre.trim()}|${horario.cierra.trim()}`;

    const diasGrupo = grupos.get(clave) ?? [];

    if (!diasGrupo.includes(dia)) {
      diasGrupo.push(dia);
    }

    grupos.set(clave, diasGrupo);
  }

  function formatearDias(diasGrupo: number[]): string {
    const ordenados = [...new Set(diasGrupo)].sort((a, b) => a - b);

    if (ordenados.length === 7) {
      return 'Todos los días';
    }

    const contieneDomingo = ordenados.includes(0);
    const contieneLunes = ordenados.includes(1);
    const contieneMartes = ordenados.includes(2);
    const contieneMiercoles = ordenados.includes(3);
    const contieneJueves = ordenados.includes(4);
    const contieneViernes = ordenados.includes(5);
    const contieneSabado = ordenados.includes(6);

    if (
      contieneDomingo &&
      !contieneLunes &&
      contieneMartes &&
      contieneMiercoles &&
      contieneJueves &&
      contieneViernes &&
      contieneSabado
    ) {
      return 'Domingo y martes a sábado';
    }

    if (
      ordenados.length === 5 &&
      [1, 2, 3, 4, 5].every((dia) => ordenados.includes(dia))
    ) {
      return 'Lunes a viernes';
    }

    if (
      ordenados.length === 2 &&
      contieneDomingo &&
      contieneSabado
    ) {
      return 'Sábados y domingos';
    }

    const nombres = ordenados.map((dia) => dias[dia]);

    if (nombres.length === 1) {
      return nombres[0][0].toUpperCase() + nombres[0].slice(1);
    }

    return nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  }

  const resultado = Array.from(grupos.entries()).map(
    ([clave, diasGrupo]) => {
      const [abre, cierra] = clave.split('|');

      return `${formatearDias(diasGrupo)}: ${abre} a ${cierra}`;
    }
  );

  return [...new Set([...horariosTexto, ...resultado])].join(' · ');
}



// --------------------------------------------------
// OBTENER AUDIO DE LA API
// --------------------------------------------------


async function obtenerAudioAPI(
  lugar: LugarAPI
): Promise<{ uri: string } | undefined> {
  const audioguia = lugar.audioguia;

  const url =
    typeof audioguia === 'string'
      ? audioguia
      : audioguia?.url;

  if (!url) {
    return undefined;
  }

  const urlPreparada = prepararUrlImagen(url);

  console.log(
    'AUDIO RECIBIDO DESDE API:',
    lugar.id,
    urlPreparada
  );

  return await obtenerAudioLocal(
    urlPreparada,
    lugar.id
  );
}

// --------------------------------------------------
// TRANSCRIPCIONES DE AUDIOGUÍAS DE LA API
// --------------------------------------------------

export const transcripcionesAudioguiasAPI: Record<string, string> = {
  // Anfiteatro Municipal
  'lug-009': `Bienvenidos al Anfiteatro Municipal de Colón, un espacio destinado al encuentro, la cultura y los espectáculos al aire libre. Este lugar recibe distintas actividades artísticas y culturales que forman parte de la vida de la ciudad, especialmente durante la temporada turística y las celebraciones locales.

A lo largo del año, el anfiteatro puede convertirse en escenario de presentaciones musicales, espectáculos y eventos que reúnen a vecinos y visitantes. Es un espacio pensado para compartir momentos, disfrutar de la cultura y conocer un poco más sobre las propuestas recreativas de Colón.

Te invitamos a conocer este lugar y disfrutar de las actividades que ofrece la ciudad. ¡Que tengas un hermoso recorrido!`,

  // Balneario Piedras Coloradas
  'lug-003': `Bienvenidos al Balneario Piedras Coloradas, uno de los espacios naturales de Colón, ubicado a orillas del río Uruguay. Este lugar invita a disfrutar del paisaje, descansar y compartir actividades al aire libre en contacto con la naturaleza.

Su entorno costero ofrece un espacio para disfrutar de la playa, contemplar el río y pasar momentos agradables en familia o con amigos. Durante los días de calor, es una alternativa elegida por quienes buscan refrescarse y aprovechar las propuestas recreativas que ofrece la costa colonense.

Te invitamos a recorrer este espacio, disfrutar de sus paisajes y cuidar el entorno natural para que todos puedan seguir disfrutándolo. ¡Que tengas una linda visita!`,

  // Camping Municipal Norte
  'lug-024': `Bienvenidos al Camping Municipal Norte de Colón, un espacio pensado para quienes desean disfrutar de la naturaleza y vivir una experiencia al aire libre durante su visita a la ciudad.

El camping ofrece un entorno para descansar, compartir actividades y disfrutar de una estadía en contacto con el paisaje de la región. Es una alternativa para familias, grupos de amigos y viajeros que eligen acampar y aprovechar el tiempo libre en un ambiente natural.

Desde aquí pueden organizar actividades recreativas, disfrutar de momentos de descanso y descubrir los atractivos turísticos que ofrece Colón y sus alrededores.

Te invitamos a disfrutar de este espacio y a cuidar sus instalaciones y el entorno natural. ¡Que tengas una excelente estadía!`,

  // Casa de Artesanías Regionales
  'lug-011': `Bienvenidos a la Casa de Artesanías Regionales de Colón, un espacio donde pueden descubrir parte de la identidad cultural de Entre Ríos a través del trabajo de sus artesanos. En este local encontrarán una variedad de productos elaborados con técnicas tradicionales, como mates, piezas de cestería, trabajos de platería y dulces regionales. Cada objeto representa una expresión de creatividad, dedicación y conocimiento transmitido a lo largo de generaciones. Recorrer este lugar es una oportunidad para acercarse a las costumbres de nuestra provincia, conocer sus producciones típicas y encontrar un recuerdo especial de la visita a Colón. Los invitamos a disfrutar de esta muestra de tradiciones y talento regional.`,

  // Cervecería Artesanal del Río
  'lug-022': `Bienvenidos a la Cervecería Artesanal del Río, un espacio gastronómico de Colón pensado para disfrutar de buenos momentos y compartir una experiencia diferente. Aquí pueden conocer una propuesta de cerveza de elaboración propia, acompañada de opciones de comida al paso. Su patio ofrece un ambiente agradable para reunirse con amigos, descansar después de recorrer la ciudad o disfrutar de una salida durante la tarde y la noche. Los sábados, la música en vivo aporta un atractivo especial y convierte al lugar en un punto de encuentro para vecinos y visitantes. Los invitamos a descubrir esta propuesta local, disfrutar de sus sabores y compartir un momento agradable durante su estadía en Colón.`,

  // Feria de la Plaza San Martín
  'lug-027': `Bienvenidos a la Feria de la Plaza San Martín, uno de los espacios donde los visitantes pueden acercarse a las producciones artesanales y regionales de Colón. Durante los fines de semana, la plaza reúne a artesanos y productores que ofrecen una variedad de artículos y alimentos elaborados en la zona. Entre sus puestos pueden encontrar miel, dulces, quesos, artesanías y diferentes propuestas de comida. Además de conocer los productos, recorrer la feria permite descubrir el trabajo de pequeños emprendedores y disfrutar de un ambiente de encuentro al aire libre. Es una buena oportunidad para conversar con los productores, conocer sus elaboraciones y llevarse algún recuerdo de la ciudad. Los invitamos a recorrer sus puestos y disfrutar de esta experiencia local.`,

  // Heladería de la Peatonal
  'lug-021': `Bienvenidos a la Heladería de la Peatonal, ubicada en una de las zonas comerciales más transitadas de Colón. Este establecimiento ofrece helados artesanales con diferentes sabores para disfrutar durante un paseo por el centro de la ciudad. Entre sus propuestas se destacan los sabores regionales, como el dulce de leche con nuez pecán, que combina un clásico de nuestra gastronomía con un producto característico de la región. Es una alternativa ideal para hacer una pausa, refrescarse y disfrutar de algo rico después de recorrer los comercios y espacios de la peatonal. Tanto en una salida familiar como en un paseo en pareja o con amigos, los invitamos a conocer esta propuesta y disfrutar de un momento dulce durante su visita a Colón.`,

  // Hostería del Río
  'lug-023': `Bienvenidos a la Hostería del Río, un alojamiento familiar ubicado sobre la Costanera Gobernador Quirós, en la ciudad de Colón, Entre Ríos. Su ubicación permite disfrutar de la cercanía del río Uruguay y de los paisajes característicos de la zona.

La hostería cuenta con doce habitaciones y ofrece desayuno, pileta y estacionamiento para sus huéspedes. Además, dispone de recepción las 24 horas, para brindar atención en cualquier momento del día.

Es una alternativa para quienes buscan descansar y disfrutar de Colón, sus atractivos naturales y sus propuestas turísticas. ¡Esperamos que tengas una excelente estadía!`,

  // Mirador del Puente General Artigas
  'lug-016': `Bienvenidos al Mirador del Puente General Artigas, un lugar privilegiado de la costa de Colón, Entre Ríos. Desde aquí se puede contemplar el puente internacional que conecta la ciudad de Colón con Paysandú, en Uruguay, atravesando el río Uruguay.

El puente fue inaugurado en 1975 y se convirtió en una conexión importante entre ambos países. Además de su valor como vía de comunicación, ofrece un paisaje característico de la región.

Te invitamos a detenerte, disfrutar de la vista del río y observar el movimiento de este paso fronterizo que une a Argentina y Uruguay. ¡Que disfrutes el recorrido!`,

  // Parrilla del Puerto
  'lug-019': `Bienvenidos a Parrilla del Puerto, un espacio gastronómico ubicado en Alejo Peyret 50, frente al antiguo puerto de Colón, Entre Ríos.

Este lugar ofrece una propuesta de cocina tradicional, con carnes preparadas a la parrilla, pescados de río y postres caseros. También cuenta con mesas al aire libre, ideales para disfrutar de una comida mientras se contempla el entorno del puerto.

La gastronomía regional es parte de la identidad de Colón, y los sabores del río Uruguay ocupan un lugar especial en su cocina.

¡Te invitamos a disfrutar de una experiencia con sabores locales y un hermoso paisaje!`,

  // Museo Histórico Regional de San José
  'lug-013': `Bienvenidos al Museo Histórico Regional de San José, ubicado en Urquiza 1127, en la localidad de San José, Entre Ríos.

Este museo conserva la memoria de los primeros pobladores de la colonia, fundada en 1857 por inmigrantes suizos, saboyanos y piamonteses. En sus salas se pueden conocer objetos, documentos y fotografías que permiten acercarse a sus costumbres, sus trabajos y su vida cotidiana.

A través de este patrimonio, el museo invita a descubrir las raíces de la comunidad y la historia de quienes contribuyeron a construir la identidad de la región.

¡Esperamos que disfrutes este recorrido por la historia de San José!`,

  // Termas de Villa Elisa
  'lug-018': `Te damos la bienvenida a Termas Villa Elisa, un complejo termal de Entre Ríos, ubicado a pocos kilómetros de Colón.

Su predio de 41 hectáreas está rodeado de naturaleza y ofrece diez piscinas con distintas temperaturas y características. Hay espacios para relajarse, piscinas con hidrojets, sectores cubiertos y semicubiertos, una piscina con olas y una plaza acuática para los más pequeños.

El complejo también cuenta con áreas verdes, senderos, actividades recreativas, alojamiento, gastronomía y servicios de spa. Es una propuesta ideal para descansar, divertirse en familia y disfrutar de las aguas termales durante una visita a la región.

Termas Villa Elisa invita a hacer una pausa y conectarse con la naturaleza. ¡Que disfrutes tu visita!`,

  // Paseo de Artesanos
  'lug-010': `Te damos la bienvenida al Paseo de Artesanos de Colón, un espacio de encuentro con la creatividad y las tradiciones de la región, ubicado frente al río Uruguay, en la zona de la costanera y la calle 12 de Abril. 
  
A lo largo del paseo encontrarás puestos donde artesanos locales ofrecen piezas elaboradas a mano con materiales como madera, cuero, cerámica y textiles. Cada objeto refleja técnicas, paciencia y dedicación, y permite conocer una parte de la identidad cultural de la comunidad. 

Al recorrer los puestos, podés descubrir adornos, utensilios, accesorios y recuerdos originales. También podés conversar con quienes realizan estos trabajos y conocer cómo nacen sus creaciones. El paseo es una oportunidad para apoyar la producción artesanal local y llevarte un recuerdo diferente de tu visita. En verano, los puestos suelen abrir por la noche y permanecer hasta la madrugada. 

Disfrutá de este recorrido junto a la costanera y descubrí el talento de los artesanos de Colón.`,

  // Playa Norte
  'lug-002': `Te damos la bienvenida a Playa Norte, una de las playas de Colón, ubicada sobre la costanera Gobernador Quirós, en el extremo norte de la ciudad.
  
Este amplio sector de arena fina se encuentra junto al río Uruguay y ofrece un entorno ideal para disfrutar del paisaje y descansar al aire libre. 

A lo largo de la playa encontrarás sombra natural de sauces y proveedurías para acompañar tu visita. Durante el verano, el lugar cuenta con servicio de guardavidas para brindar mayor seguridad a quienes disfrutan del agua. 

Es importante recordar que fuera de temporada no hay guardavidas, por lo que se recomienda tener precaución al ingresar al río. 

Playa Norte invita a disfrutar del sol, la arena y la tranquilidad del paisaje costero de Colón. 

¡Que tengas una hermosa visita!`,

  // Playa Paso Vela
  'lug-017': `Te damos la bienvenida a Playa Paso Vela, un rincón tranquilo de la zona sur de Colón, ubicado junto a la costanera, en el sector de Paso Vela.

Esta playa se caracteriza por sus aguas bajas y su superficie de arena, que crean un entorno agradable para disfrutar en familia, especialmente con chicos.

Durante la temporada, podés encontrar sombra y una proveeduría para acompañar tu visita. Su paisaje invita a descansar, tomar sol y disfrutar del río Uruguay con tranquilidad.

Recordá cuidar el entorno, mantener limpia la playa y prestar atención a las indicaciones de seguridad al ingresar al agua.

Playa Paso Vela es una alternativa ideal para quienes buscan un momento de descanso junto al río. ¡Que disfrutes tu visita!`,

  // Balneario Camping Sur
  'lug-026': `Te damos la bienvenida al sector del antiguo Balneario Camping Sur, ubicado en la zona de la costanera sur de Colón, junto al río Uruguay.

Este espacio formó parte de las propuestas recreativas de la ciudad, ofreciendo un entorno natural para disfrutar del paisaje ribereño.

Actualmente, el balneario permanece cerrado al público debido a procesos de erosión en la barranca, que representan un riesgo para la seguridad de las personas.

Por eso, es importante respetar las restricciones de acceso y las indicaciones de las autoridades.

Aunque hoy no se encuentra habilitado, forma parte de los espacios que cuentan la historia turística y recreativa de Colón.`,

  // Pulpería de la Colonia
  'lug-020': `Te damos la bienvenida a la Pulpería de la Colonia, ubicada sobre la Ruta Provincial 26, en Colonia San José, cerca del antiguo molino.

Este lugar funciona en un almacén de ramos generales convertido en restaurante, y conserva el espíritu de los espacios tradicionales de la vida rural.

Su propuesta gastronómica incluye picadas, quesos de la zona y pastas caseras, con sabores que representan la producción y las costumbres de la colonia.

Es una parada para disfrutar de la comida de campo y conocer un rincón gastronómico de la región.

Te invitamos a recorrer este lugar y descubrir los sabores de Colonia San José.`,
};

// --------------------------------------------------
// CONVERTIR LUGAR DE LA API AL FORMATO DE LA APP
// --------------------------------------------------

const imagenesLocalesAPI: Record<string, any> = {
  'lug-003': require('../../assets/images/lugares/api/lug-003.jpg'),
  'lug-008': require('../../assets/images/lugares/api/lug-008.jpg'),
  'lug-009': require('../../assets/images/lugares/api/lug-009.jpg'),
  'lug-011': require('../../assets/images/lugares/api/lug-011.jpg'),
  'lug-013': require('../../assets/images/lugares/api/lug-013.jpg'),
  'lug-016': require('../../assets/images/lugares/api/lug-016.jpg'),
  'lug-019': require('../../assets/images/lugares/api/lug-019.jpg'),
  'lug-021': require('../../assets/images/lugares/api/lug-021.jpg'),
  'lug-022': require('../../assets/images/lugares/api/lug-022.jpg'),
  'lug-023': require('../../assets/images/lugares/api/lug-023.jpg'),
  'lug-024': require('../../assets/images/lugares/api/lug-024.jpg'),
  'lug-025': require('../../assets/images/lugares/api/lug-025.jpg'),
  'lug-027': require('../../assets/images/lugares/api/lug-027.jpg'),
  'lug-002': require('../../assets/images/lugares/api/lug-002.jpg'),
  'lug-005': require('../../assets/images/lugares/api/lug-005.jpg'),
  'lug-006': require('../../assets/images/lugares/api/lug-006.jpg'),
  'lug-007': require('../../assets/images/lugares/api/lug-007.png'),
  'lug-010': require('../../assets/images/lugares/api/lug-010.jpg'),
  'lug-012': require('../../assets/images/lugares/api/lug-012.png'),
  'lug-017': require('../../assets/images/lugares/api/lug-017.png'),
  'lug-018': require('../../assets/images/lugares/api/lug-018.jpg'),
  'lug-020': require('../../assets/images/lugares/api/lug-020.jpg'),
};

async function convertirLugarAPI(
  lugar: LugarAPI,
  categorias: CategoriaAPI[],
  lugarLocal?: Place
): Promise<Place> {
  const categoria = normalizarCategoria(
    obtenerCategoria(lugar.categoriaId, categorias)
  );

  const imagenAPI = lugar.imagenes
    ?.filter((imagen) => imagen.trim().length > 0)
    .at(-1);

  const imagenRemota = imagenAPI
    ? { uri: prepararUrlImagen(imagenAPI) }
    : undefined;

  console.log(
    'HORARIOS:',
    lugar.nombre,
    JSON.stringify(lugar.horarios)
  );

  return {
    // ID local para navegación y funcionamiento interno.
    id: lugarLocal?.id ?? lugar.id,

    // ID original para las operaciones con el backend.
    apiId: lugar.id,

    // Conservamos el nombre local cuando hay coincidencia.
    nombre: lugarLocal?.nombre ?? lugar.nombre,

    categoria,

    // Los lugares locales conservan su icono.
    // Los lugares nuevos reciben uno según su categoría.
    icono:
      lugarLocal?.icono ??
      obtenerIconoCategoria(categoria),

    descripcion:
      lugar.descripcion?.trim() ||
      lugarLocal?.descripcion ||
      '',

    direccion:
      lugar.direccion?.trim() ||
      lugarLocal?.direccion ||
      'Sin dirección disponible',

    horario: convertirHorario(
      lugar.horarios,
      lugarLocal?.horario ?? 'Consultar horarios'
    ),

    precio: convertirPrecio(
      lugarLocal?.precio ?? lugar.precioEntrada,
      'Consultar precio'
    ),
    // Priorizamos las imágenes locales para permitir el uso sin conexión.
    imagen:
      lugarLocal?.imagen ??
      imagenesLocalesAPI[lugar.id] ??
      imagenRemota,

    // Priorizamos el MP3 incorporado en la aplicación.
    // Si no existe, descargamos la audioguía de la API.
    audio:
      lugarLocal?.audio ??
      (await obtenerAudioAPI(lugar)),

    transcripcion:
      lugarLocal?.transcripcion ??
      transcripcionesAudioguiasAPI[lugar.id] ??
      undefined,

    telefono:
      lugarLocal?.telefono ?? lugar.telefono ?? undefined,

    web:
      lugarLocal?.web ?? lugar.sitioWeb ?? undefined,

    latitud:
      lugarLocal?.latitud ?? lugar.coordenadas.latitud,

    longitud:
      lugarLocal?.longitud ?? lugar.coordenadas.longitud,
  };
}

// --------------------------------------------------
// OBTENER LUGARES INTEGRADOS
// --------------------------------------------------



export async function obtenerLugaresIntegrados(): Promise<Place[]> {
  try {
    const [lugaresAPI, categoriasAPI] = await Promise.all([
      obtenerLugaresAPI(),
      obtenerCategoriasAPI(),
    ]);

    console.log(
      'LUGARES RECIBIDOS DE LA API:',
      lugaresAPI.map((lugar) => ({
        id: lugar.id,
        nombre: lugar.nombre,
        activo: lugar.activo,
        tieneAudioguia: !!lugar.audioguia,
      })),
    );

    const categorias = categoriasAPI as CategoriaAPI[];

    const resultado: Place[] = lugares.map((lugar) => ({
      ...lugar,
      categoria: normalizarCategoria(lugar.categoria),
    }));

    // Asociamos el ID de la API al Parque Quirós local,
    // sin reemplazar sus datos ni incorporarlo nuevamente.
    const parqueQuirosAPI = lugaresAPI.find(
      (lugarAPI) =>
        lugarAPI.id === 'lug-015' &&
        lugarAPI.activo !== false
    );

    if (parqueQuirosAPI) {
      const indiceParqueQuiros = resultado.findIndex(
        (lugar) => lugar.id === 'parque-quiros'
      );

      if (indiceParqueQuiros !== -1) {
        resultado[indiceParqueQuiros] = {
          ...resultado[indiceParqueQuiros],
          apiId: parqueQuirosAPI.id,
        };

        console.log('PARQUE QUIROS ASOCIADO:', {
          idLocal: resultado[indiceParqueQuiros].id,
          apiId: resultado[indiceParqueQuiros].apiId,
          nombre: resultado[indiceParqueQuiros].nombre,
        });
      }
    }

    // Asociamos el ID de la API al Museo Histórico Regional de Colón local,
    // sin reemplazar sus datos ni incorporarlo nuevamente.
    const museoColonAPI = lugaresAPI.find(
      (lugarAPI) =>
        lugarAPI.id === 'lug-028' &&
        lugarAPI.activo !== false
    );

    if (museoColonAPI) {
      const indiceMuseoColon = resultado.findIndex(
        (lugar) => lugar.id === 'museo-historico-colon'
      );

      if (indiceMuseoColon !== -1) {
        resultado[indiceMuseoColon] = {
          ...resultado[indiceMuseoColon],
          apiId: museoColonAPI.id,
        };

        console.log('MUSEO COLON ASOCIADO:', {
          idLocal: resultado[indiceMuseoColon].id,
          apiId: resultado[indiceMuseoColon].apiId,
          nombre: resultado[indiceMuseoColon].nombre,
        });
      }
    }

    // Filtramos los lugares activos y evitamos duplicados.
    const nombresAPIProcesados = new Set<string>();
    const lugaresAPIUnicos: LugarAPI[] = [];

    const lugaresExcluidosAPI = [
      'lug-028',
      'lug-015',
      'lug-014',
    ];

    for (const lugarAPI of lugaresAPI) {
      if (lugarAPI.activo === false) {
        continue;
      }

      if (lugaresExcluidosAPI.includes(lugarAPI.id)) {
        continue;
      }

      const nombreNormalizado = normalizarNombre(
        lugarAPI.nombre
      );

      if (nombresAPIProcesados.has(nombreNormalizado)) {
        continue;
      }

      nombresAPIProcesados.add(nombreNormalizado);
      lugaresAPIUnicos.push(lugarAPI);
    }

    // Convertimos los lugares en grupos de cuatro.
    // Esto permite descargar varias audioguías simultáneamente.
    const lugaresConvertidos: {
      lugarLocal?: Place;
      lugarConvertido: Place;
    }[] = [];

    for (
      let inicio = 0;
      inicio < lugaresAPIUnicos.length;
      inicio += 4
    ) {
      const lote = lugaresAPIUnicos.slice(
        inicio,
        inicio + 4
      );

      const convertidos = await Promise.all(
        lote.map(async (lugarAPI) => {
          const lugarLocal =
            lugarAPI.id === 'lug-031'
              ? lugares.find(
                (lugar) => lugar.id === 'puerto-colon'
              )
              : buscarLugarLocal(lugarAPI.nombre);

          if (lugarAPI.id === 'lug-031') {
            console.log('DIAGNÓSTICO PUERTO:', {
              nombreAPI: lugarAPI.nombre,
              nombreNormalizadoAPI: normalizarNombre(
                lugarAPI.nombre
              ),
              nombresLocales: lugares.map((lugar) => ({
                id: lugar.id,
                nombre: lugar.nombre,
                nombreNormalizado: normalizarNombre(
                  lugar.nombre
                ),
              })),
              lugarLocalEncontrado:
                lugarLocal?.id ?? 'NO ENCONTRADO',
            });
          }

          const lugarConvertido = await convertirLugarAPI(
            lugarAPI,
            categorias,
            lugarLocal
          );

          return {
            lugarLocal,
            lugarConvertido,
          };
        })
      );

      lugaresConvertidos.push(...convertidos);

      console.log(
        `Lugares convertidos: ${lugaresConvertidos.length}/${lugaresAPIUnicos.length}`
      );
    }

    // Incorporamos los lugares convertidos al catálogo.
    for (const {
      lugarLocal,
      lugarConvertido,
    } of lugaresConvertidos) {
      if (lugarLocal) {
        const indice = resultado.findIndex(
          (item) => item.id === lugarLocal.id
        );

        if (indice !== -1) {
          resultado[indice] = lugarConvertido;
        }
      } else {
        resultado.push(lugarConvertido);
      }
    }

    console.log(
      'PUERTOS EN LA LISTA FINAL:',
      resultado
        .filter((lugar) =>
          normalizarNombre(lugar.nombre).includes('puerto')
        )
        .map((lugar) => ({
          id: lugar.id,
          nombre: lugar.nombre,
        }))
    );

    // --------------------------------------------------
    // DESCARGAR IMÁGENES PARA USO SIN CONEXIÓN
    // --------------------------------------------------

    const directorioImagenes = new Directory(
      Paths.document,
      'imagenes-lugares',
    );

    try {
      if (!directorioImagenes.exists) {
        directorioImagenes.create({
          idempotent: true,
          intermediates: true,
        });
      }

      for (
        let inicio = 0;
        inicio < resultado.length;
        inicio += 4
      ) {
        const lote = resultado.slice(inicio, inicio + 4);

        const lugaresConImagenesLocales = await Promise.all(
          lote.map((lugar) =>
            descargarImagenLugar(lugar, directorioImagenes),
          ),
        );

        resultado.splice(
          inicio,
          lugaresConImagenesLocales.length,
          ...lugaresConImagenesLocales,
        );
      }

      console.log(
        'Imágenes del catálogo procesadas para uso sin conexión.',
      );
    } catch (error) {
      console.warn(
        'No se pudo preparar el almacenamiento local de imágenes:',
        error,
      );
    }

    // Guardamos el catálogo y las rutas de imágenes en SQLite.
    guardarLugaresLocales(resultado);

    return resultado;

  } catch (error) {
    console.warn(
      'No se pudieron actualizar los lugares desde la API.',
      error
    );

    // Primero intentamos recuperar la copia guardada en SQLite.
    const lugaresGuardados = obtenerLugaresLocales();

    if (lugaresGuardados.length > 0) {
      console.log(
        `Lugares recuperados desde SQLite: ${lugaresGuardados.length}`
      );

      return lugaresGuardados;
    }

    // Si todavía no hay una copia, utilizamos los datos incluidos
    // en la aplicación.
    console.log('Se utilizarán los lugares locales iniciales.');

    return lugares.map((lugar) => ({
      ...lugar,
      categoria: normalizarCategoria(lugar.categoria),
    }));
  }
}


