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
  audio?: any;
  transcripcion?: string;
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
    audio: require('../../assets/audios/plaza-washington.mp3'),

    transcripcion: `Bienvenidos a la Plaza Washington, uno de los espacios históricos más importantes de la ciudad de Colón, Entre Ríos.

Esta plaza se encuentra en el casco histórico de la ciudad, entre las calles 12 de Abril, Presbítero Cot, General Urquiza y José Hernández.

Su historia está relacionada con los primeros años de Colón. En 1863, cuando se estableció la piedra fundamental de la ciudad, este sector ya ocupaba un lugar central en la vida de la comunidad.

El nombre Washington fue elegido en homenaje a George Washington y quedó establecido durante los primeros años de la ciudad.

La plaza está ubicada junto a la Plaza Artigas y forma parte de uno de los sectores más tradicionales de Colón.

Al recorrer la Plaza Washington podemos observar sus senderos, sus espacios verdes y una importante cantidad de árboles que le dan un ambiente tranquilo y agradable.

En el centro de la plaza se encuentra un mástil donde flamea la Bandera Argentina. También podemos encontrar monumentos y elementos que recuerdan a figuras importantes de la historia nacional.

Entre ellos se encuentra un busto del General Manuel Belgrano, creador de la Bandera Argentina.

La plaza también conserva esculturas realizadas en madera y diferentes espacios destinados al descanso.

Su ubicación permite además observar algunos de los edificios históricos y administrativos que rodean este sector del centro de Colón.

La Plaza Washington también tiene un significado especial para la historia de la ciudad.

Actualmente, continúa siendo escenario de actos y ceremonias. Cada 12 de abril, fecha en que se conmemora la fundación de Colón, se realizan actividades en el sector de las plazas Washington y Artigas.

En los últimos años también se han realizado trabajos de puesta en valor para mejorar sus bancos, canteros, desagües y espacios de encuentro, procurando conservar su identidad y su trazado histórico.

Durante nuestra visita podemos recorrer sus senderos, descansar bajo los árboles y observar algunos de los elementos que forman parte de la historia de Colón.

Si estamos recorriendo el centro de la ciudad, la Plaza Washington es una parada ideal para conocer un poco más sobre el origen y la identidad de Colón.

Esperamos que hayas disfrutado de este recorrido por la Plaza Washington.`,

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
    audio: require('../../assets/audios/termas-colon.mp3'),

    transcripcion: `Bienvenidos a las Termas de Colón, uno de los principales atractivos turísticos de la ciudad de Colón, Entre Ríos.

El complejo termal se encuentra muy cerca del río Uruguay y ocupa aproximadamente cuatro hectáreas y media. Sus instalaciones comenzaron a funcionar en el año 1996 y desde entonces se convirtieron en uno de los lugares elegidos por visitantes y habitantes de la ciudad para descansar y disfrutar del agua termal.

El agua utilizada por las termas proviene del Acuífero Guaraní y posee características mineralizadas. Esto permite disfrutar de diferentes piscinas con temperaturas y características particulares.

Durante nuestro recorrido vamos a conocer algunos de los espacios y servicios que ofrece este complejo.

El complejo cuenta con diferentes sectores de piscinas termales, tanto al aire libre como cubiertas.

Las temperaturas del agua varían según cada piscina. Algunas se encuentran aproximadamente entre los treinta y dos y treinta y cinco grados, mientras que otras presentan temperaturas superiores.

También hay sectores destinados a diferentes edades y necesidades, incluyendo espacios para niños y áreas con hidromasaje.

Las piscinas permiten disfrutar de un momento de relajación mientras se contempla el entorno natural que caracteriza a Colón.

La disponibilidad de algunos sectores puede variar según la temporada, el mantenimiento o las condiciones del complejo. Por eso, antes de visitar las termas, es recomendable consultar la información actualizada.

Además de las piscinas, las Termas de Colón cuentan con diferentes servicios para que los visitantes puedan pasar una jornada completa.

El complejo dispone de espacios gastronómicos, estacionamiento y servicios como alquiler de batas, sillas y lockers. También cuenta con asistencia médica para situaciones de emergencia.

Actualmente, el horario informado por el complejo es de nueve de la mañana a ocho de la noche, todos los días, aunque puede modificarse según la temporada.

Las Termas de Colón son una de las experiencias que podés disfrutar durante tu visita a la ciudad.

Después de relajarte en sus aguas termales, podés continuar recorriendo otros atractivos de Colón, como sus playas, el Parque Quirós, el puerto y diferentes sitios históricos y culturales.

Gracias por acompañarnos en este recorrido. Esperamos que disfrutes tu visita a Colón.`,

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
    audio: require('../../assets/audios/parque-quiros.mp3'),

    transcripcion: `Bienvenidos al Parque Dr. Herminio Quirós, uno de los espacios verdes más representativos de Colón, Entre Ríos.

El parque se encuentra en una de las zonas más elevadas de la ciudad, entre el boulevard Ferrari y la calle Andrade, y se extiende hacia la Costanera.

Por su ubicación, es uno de los principales miradores naturales de Colón. Desde sus sectores elevados podemos contemplar el río Uruguay y parte del paisaje costero.

La historia del parque está relacionada con Herminio Juan Quirós, una importante figura de la historia de Colón. Nació en 1873, fue abogado, diputado nacional y gobernador de Entre Ríos.

También impulsó importantes obras para la ciudad, entre ellas el Parque Escolar, la Costanera y la Estación Fluvial.

El Parque Escolar Dr. Herminio Quirós fue fundado en 1927 y desde sus comienzos estuvo relacionado con la educación, el deporte y la recreación.

Con el paso del tiempo, se convirtió en un lugar tradicional de encuentro para vecinos y visitantes.

Además de su valor histórico, el parque se destaca por sus espacios naturales y recreativos. Sus amplios sectores verdes, árboles y senderos permiten disfrutar de un paseo tranquilo y de diferentes actividades al aire libre.

A lo largo del parque encontramos espacios destinados al deporte y la recreación, que son utilizados tanto por los habitantes de Colón como por quienes visitan la ciudad.

Uno de los atractivos más destacados es su relación con la Costanera. Al recorrer sus caminos y sectores elevados, podemos encontrar diferentes puntos desde donde apreciar el río Uruguay y disfrutar del paisaje.

El Parque Dr. Herminio Quirós también forma parte de la identidad turística de Colón. Su ubicación, su historia y sus espacios verdes lo convierten en uno de los lugares más visitados de la ciudad.

Durante una visita, podemos recorrer sus senderos, descansar bajo los árboles, practicar actividades recreativas o simplemente disfrutar de la tranquilidad y de las vistas hacia el río.

Si estamos recorriendo Colón, este parque es una parada ideal para conocer parte de la historia local y, al mismo tiempo, disfrutar de uno de los paisajes naturales más característicos de la ciudad.

Esperamos que hayas disfrutado de este recorrido por el Parque Dr. Herminio Quirós.`,

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
    audio: require('../../assets/audios/playa-inkier.mp3'),
    transcripcion: `Bienvenidos a Playa Inkier, uno de los espacios de playa que podemos disfrutar durante una visita a la ciudad de Colón, Entre Ríos.

La playa se encuentra sobre la costa del río Uruguay y forma parte del sector costero que caracteriza a la ciudad.

Colón es conocida por sus playas de arena y por sus espacios junto al río, que durante la temporada de verano reciben a vecinos y visitantes.

Playa Inkier es un lugar pensado principalmente para disfrutar del paisaje, descansar y realizar actividades al aire libre.

Desde la costa podemos observar el río Uruguay y disfrutar de un entorno natural que combina el agua, la arena y la vegetación característica de la zona.

Durante los días de verano, las playas de Colón se convierten en uno de los principales espacios de recreación de la ciudad.

En Playa Inkier podemos disfrutar de una jornada al aire libre, caminar por la costa, descansar y contemplar el paisaje del río.

Como ocurre con otros balnearios, las condiciones de uso y los servicios disponibles pueden variar según la temporada. Por eso, antes de visitar la playa, es recomendable consultar la información actualizada sobre horarios, servicios y condiciones del lugar.

Además de disfrutar de la playa, podemos continuar nuestro recorrido por otros atractivos cercanos de Colón, como el Parque Quirós, el puerto y las diferentes zonas de la Costanera.

La costa de Colón forma parte importante de la identidad turística de la ciudad. El río Uruguay no solo ofrece espacios para disfrutar del verano, sino que también permite apreciar diferentes paisajes durante todo el año.

Si estamos recorriendo Colón, una visita a Playa Inkier puede ser una buena oportunidad para hacer una pausa, disfrutar del aire libre y conocer uno de los espacios costeros de la ciudad.

Recordá consultar las indicaciones y recomendaciones vigentes antes de ingresar al agua.

Esperamos que hayas disfrutado de este recorrido por Playa Inkier y que continúes descubriendo los paisajes y atractivos de Colón.`,
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
    audio: require('../../assets/audios/puerto-colon.mp3'),
    transcripcion: `Bienvenidos al Puerto de Colón, uno de los espacios tradicionales de la ciudad de Colón, Entre Ríos.

El puerto se encuentra junto al río Uruguay y forma parte del paisaje costero de la ciudad.

Desde este sector podemos acercarnos al río, contemplar el paisaje y observar una zona que durante muchos años estuvo relacionada con la actividad portuaria y la vida cotidiana de Colón.

La ubicación del puerto también permite conectarlo con otros espacios turísticos de la ciudad, como la Costanera, las playas y el Parque Quirós.

Actualmente, este sector es también un lugar elegido para caminar, descansar y disfrutar del entorno del río.

El río Uruguay tiene un papel muy importante en la historia y en la identidad de Colón.

Desde los primeros años de la ciudad, su cercanía al río influyó en el desarrollo de las actividades comerciales, los desplazamientos y las comunicaciones de la zona.

Al recorrer el puerto podemos observar cómo la ciudad se encuentra estrechamente relacionada con su paisaje costero.

Además de su valor histórico, el sector ofrece un espacio para disfrutar del aire libre y contemplar diferentes vistas del río Uruguay.

Dependiendo de la época del año y de las actividades que se desarrollen en la zona, el movimiento del puerto puede variar.

Durante nuestro recorrido por Colón, visitar el puerto también nos permite comprender mejor la relación entre la ciudad y el río Uruguay.

Desde aquí podemos continuar caminando hacia otros sectores de la Costanera, disfrutar de los espacios verdes y acercarnos a diferentes puntos desde donde observar el paisaje.

El puerto es, de esta manera, parte de un recorrido que combina naturaleza, historia y espacios tradicionales de la ciudad.

Si estamos visitando Colón, podemos aprovechar este lugar para hacer una pausa, disfrutar del paisaje y conocer un poco más sobre la importancia que tuvo y continúa teniendo el río para la comunidad.

Esperamos que hayas disfrutado de este recorrido por el Puerto de Colón.`,
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
    audio: require('../../assets/audios/molino-forclaz.mp3'),
    transcripcion: `Bienvenidos al Museo Provincial Molino Forclaz, uno de los sitios históricos y culturales más importantes de la zona de Colón y San José, en Entre Ríos.

El lugar conserva un conjunto de construcciones relacionadas con la vida de una familia de inmigrantes que llegó a la Colonia San José durante el siglo diecinueve.

Juan Bautista Forclaz, de origen suizo, llegó a estas tierras en 1859 junto con otros inmigrantes europeos.

La familia Forclaz se dedicó a la molienda de granos y comenzó utilizando un molino a malacate, un sistema que funcionaba mediante la fuerza de mulas.

Con el crecimiento de la colonia aumentó también la cantidad de granos que necesitaban ser procesados. Por este motivo, la familia decidió construir un molino de mayor capacidad.

Entre los años 1888 y 1890 se construyó el conocido molino de viento, inspirado en los molinos que los inmigrantes conocían de Europa.

La construcción fue encabezada por Juan Forclaz y contó con la colaboración de familiares y vecinos de la zona.

El molino fue diseñado para utilizar la fuerza del viento y permitir una molienda más productiva.

Sin embargo, el proyecto no funcionó como se esperaba. En esta región los vientos no tenían la intensidad necesaria para que el molino pudiera trabajar de manera eficiente.

Después de varios intentos, la familia volvió a utilizar el antiguo sistema de molienda a malacate, movido por mulas.

Aunque el molino de viento no cumplió con el objetivo para el que había sido construido, con el paso del tiempo se convirtió en un importante testimonio de la historia de los primeros colonos.

El conjunto histórico que podemos visitar actualmente incluye el molino de viento, la antigua vivienda familiar, galpones utilizados para guardar herramientas de labranza, el molino de malacate y un aljibe.

Estas construcciones permiten conocer cómo era una chacra de inmigrantes de la Colonia San José y acercarnos a la vida cotidiana de aquella época.

El Molino Forclaz fue declarado Monumento Histórico Nacional en 1985 y posteriormente fue reconocido como Patrimonio Histórico Arquitectónico de la Provincia de Entre Ríos.

En 2013 fue declarado Museo Provincial Molino Forclaz.

Actualmente, el museo ofrece visitas guiadas y, en determinadas fechas, visitas teatralizadas que recrean escenas de la vida de la familia Forclaz y de los primeros colonos.

Recorrer el Molino Forclaz es una oportunidad para conocer una parte de la historia de la inmigración en Entre Ríos.

Cada construcción, cada herramienta y cada espacio del predio permite imaginar el trabajo cotidiano de las familias que llegaron a estas tierras buscando construir una nueva vida.

El molino de viento, que en su momento representó un gran proyecto, terminó convirtiéndose en un símbolo del esfuerzo, la perseverancia y también de las dificultades que enfrentaron los primeros colonos.

Durante nuestra visita podemos recorrer el predio, conocer el interior del molino y descubrir cómo funcionaban los antiguos sistemas de molienda.

Si estamos recorriendo Colón y sus alrededores, el Molino Forclaz es una parada ideal para acercarnos a la historia y al patrimonio de la región.

Esperamos que hayas disfrutado de este recorrido por el Molino Forclaz.`,
    telefono: '+54 9 3447 577133',
    web: 'https://molinoforclaz.com/',
    latitud: -32.2172,
    longitud: -58.18665,
  },

  {
    id: 'museo-historico-colon',
    nombre: 'Museo Histórico Regional de Colón',
    categoria: 'Historia y cultura',
    icono: '🏛️',
    descripcion:
      'Museo dedicado a conservar y difundir parte de la historia y el patrimonio de la ciudad de Colón y la región.',
    direccion: '12 de Abril 461, Colón, Entre Ríos',
    horario: 'Consultar horarios',
    precio: 'Entrada gratuita',
    imagen: require('../../assets/images/lugares/museo-historico-colon.jpg'),
    audio: require('../../assets/audios/museo-historico-colon.mp3'),
    transcripcion: `Bienvenidos al Museo Histórico Regional de Colón, un espacio dedicado a conservar y difundir parte de la historia de la ciudad y de la región.

El museo se encuentra en la calle 12 de Abril 461, en una zona histórica del centro de Colón.

A través de sus objetos, documentos, fotografías y diferentes elementos patrimoniales, podemos conocer aspectos de la vida de las personas que habitaron esta región y comprender cómo fue creciendo la ciudad.

La historia de Colón está estrechamente relacionada con la inmigración, la Colonia San José y el desarrollo de las comunidades que se establecieron junto al río Uruguay.

Para conocer los orígenes de la ciudad debemos remontarnos al siglo diecinueve, cuando comenzaron a formarse las primeras comunidades de colonos en esta zona.

La historia de Villa Colón quedó formalmente establecida en 1862, cuando la Legislatura de Entre Ríos autorizó al Poder Ejecutivo Provincial a fundar una villa junto a la Colonia San José.

El 12 de abril de 1863 se colocó la piedra fundamental, con la presencia del gobernador Justo José de Urquiza. Esta fecha es considerada el momento fundacional de la ciudad de Colón.

Con el paso de los años, la ciudad fue creciendo y desarrollando diferentes actividades relacionadas con la agricultura, la navegación, el comercio y la vida comunitaria.

El museo permite acercarnos a ese proceso histórico mediante diferentes objetos y testimonios que ayudan a comprender cómo era la vida cotidiana de otras épocas.

El Museo Histórico Regional también cumple una función educativa y cultural. Sus actividades permiten acercar la historia local a vecinos, estudiantes y visitantes.

En sus muestras podemos encontrar diferentes testimonios del pasado de Colón y conocer acontecimientos, personajes y formas de vida que forman parte de la identidad de la ciudad.

El museo también participa en actividades culturales y encuentros regionales, promoviendo la conservación y difusión del patrimonio histórico de Colón.

Si estamos recorriendo la ciudad y queremos conocer algo más que sus playas y paisajes, visitar el Museo Histórico Regional es una oportunidad para descubrir la historia que existe detrás de cada lugar.

Esperamos que hayas disfrutado de este recorrido por el Museo Histórico Regional de Colón.`,
    latitud: -32.223487,
    longitud: -58.141733,
  },

  {
    id: 'costanera-colon',
    nombre: 'Costanera de Colón',
    categoria: 'Río y paseo',
    icono: '🌊',
    descripcion:
      'Paseo costero junto al río Uruguay, ideal para caminar, descansar y disfrutar del paisaje de Colón.',
    direccion: 'Av. Gdor. Quiros, Colón, Entre Ríos',
    horario: 'Espacio público',
    precio: 'Entrada libre',
    imagen: require('../../assets/images/lugares/costanera-colon.jpeg'),
    audio: require('../../assets/audios/costanera-colon.mp3'),
    transcripcion: `Bienvenidos a la Costanera de Colón, uno de los paseos más característicos de la ciudad de Colón, Entre Ríos.

La costanera se encuentra junto al río Uruguay y forma parte de uno de los espacios más importantes para disfrutar del paisaje y de la vida al aire libre.

Desde este sector podemos observar el río, caminar junto a la costa y disfrutar de diferentes vistas del paisaje de Colón.

La relación entre la ciudad y el río es muy importante para la historia de Colón. Desde sus comienzos, la cercanía con el río Uruguay influyó en las actividades comerciales, la navegación y el desarrollo de la comunidad.

Actualmente, la Costanera es un lugar elegido tanto por los habitantes de la ciudad como por los turistas.

A lo largo de la Costanera podemos encontrar diferentes espacios para caminar, descansar y disfrutar del aire libre.

El paseo permite apreciar distintos sectores del río Uruguay y observar cómo el paisaje cambia según la hora del día y las condiciones del río.

Durante los meses de verano, esta zona adquiere un movimiento especial debido a la llegada de turistas y a las actividades recreativas que se realizan en la ciudad.

La Costanera también se encuentra cerca de otros lugares importantes de Colón, como el Puerto, el Parque Quirós y diferentes sectores de playa.

Por eso, recorrerla puede formar parte de un paseo más amplio por la zona costera de la ciudad.

Además de su valor turístico, la Costanera es un espacio utilizado habitualmente por los vecinos para caminar, hacer ejercicio, reunirse y disfrutar de momentos tranquilos frente al río.

La Costanera también nos permite acercarnos a la identidad turística de Colón y comprender la importancia que tiene el río Uruguay para la ciudad.

A lo largo del paseo podemos disfrutar de diferentes paisajes, observar las embarcaciones y contemplar el entorno natural que acompaña a la costa.

Si estamos visitando Colón, recorrer la Costanera es una buena manera de conocer uno de los espacios más tradicionales de la ciudad y disfrutar de una caminata junto al río.

Desde aquí podemos continuar nuestro recorrido hacia el puerto, las playas o el Parque Quirós, combinando naturaleza, paisaje y diferentes lugares de interés.

La Costanera puede disfrutarse durante todo el año, aunque la actividad turística aumenta especialmente durante la temporada de verano.

Esperamos que hayas disfrutado de este recorrido por la Costanera de Colón y que continúes descubriendo los paisajes y atractivos de nuestra ciudad.`,
    latitud: -32.218679,
    longitud: -58.132982,
  },
];