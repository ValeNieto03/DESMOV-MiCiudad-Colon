
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import {
    consultarAPI,
    LugarAPI,
    prepararUrlImagen,
    subirImagenAPI,
} from '@/servicios/api';

type EstadoEvento =
    | 'programado'
    | 'suspendido'
    | 'cancelado'
    | 'finalizado';

type EstadoGuardado = 'programado' | 'suspendido' | 'cancelado';

export interface EventoAdmin {
    id: string;
    titulo: string;
    descripcion: string;
    lugarId: string | null;
    direccionLibre: string | null;
    coordenadas?: {
        latitud: number;
        longitud: number;
    } | null;
    inicio: string;
    fin: string | null;
    imagenUrl: string | null;
    precio: number | null;
    estado: EstadoEvento;
}

interface Props {
    eventos: EventoAdmin[];
    lugares: LugarAPI[];
    onRecargar: () => Promise<void>;
}

type ModoFormulario = 'crear' | 'editar' | 'reprogramar';
type TipoUbicacion = 'catalogo' | 'libre';

const COLOR = '#315C49';

function fechaActual(): string {
    const ahora = new Date();

    const anio = ahora.getFullYear();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
}

function separarFecha(iso: string | null): string {
    if (!iso) return '';

    return iso.slice(0, 10);
}

function separarHora(iso: string | null): string {
    if (!iso) return '';

    return iso.slice(11, 16);
}

function crearInstante(fecha: string, hora: string): string {
    return `${fecha}T${hora}:00-03:00`;
}

function formatearFecha(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Argentina/Buenos_Aires',
    });
}

function traducirError(error: unknown): string {
    const codigo =
        error instanceof Error ? error.message : 'ERROR_DESCONOCIDO';

    const mensajes: Record<string, string> = {
        SESION_NO_INICIADA: 'La sesión no está iniciada.',
        SESION_NO_VALIDA: 'La sesión venció. Volvé a iniciar sesión.',
        SIN_PERMISOS: 'No tenés permisos para realizar esta operación.',
        API_NO_DISPONIBLE: 'No se pudo conectar con el servidor.',
        RESPUESTA_INVALIDA: 'El servidor devolvió una respuesta inválida.',
        EVENTO_NO_ENCONTRADO: 'No se encontró el evento.',
        LUGAR_NO_ENCONTRADO: 'El lugar seleccionado no existe.',
        ARCHIVO_NO_SUBIDO: 'La imagen no se pudo subir a la API.',
        VALIDACION_FALLIDA: 'Revisá los datos ingresados.',
    };

    return mensajes[codigo] ?? codigo;
}

export default function EventosAdminPanel({
    eventos,
    lugares,
    onRecargar,
}: Props) {
    const [modo, setModo] = useState<ModoFormulario | null>(null);
    // --------------------------------------------------
    // FILTROS DE EVENTOS
    // --------------------------------------------------

    const [busquedaEvento, setBusquedaEvento] = useState('');

    const [filtroEstado, setFiltroEstado] =
        useState<'todos' | EstadoEvento>('todos');

    const [filtroLugar, setFiltroLugar] = useState('');

    const [fechaDesdeFiltro, setFechaDesdeFiltro] = useState('');

    const [fechaHastaFiltro, setFechaHastaFiltro] = useState('');
    const [eventoEditado, setEventoEditado] =
        useState<EventoAdmin | null>(null);

    const [guardando, setGuardando] = useState(false);
    const [actualizandoEstado, setActualizandoEstado] =
        useState<string | null>(null);

    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');

    const [tipoUbicacion, setTipoUbicacion] =
        useState<TipoUbicacion>('catalogo');

    const [lugarId, setLugarId] = useState('');
    const [direccion, setDireccion] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');

    const [fechaInicio, setFechaInicio] = useState(fechaActual());
    const [horaInicio, setHoraInicio] = useState('20:00');
    const [fechaFin, setFechaFin] = useState('');
    const [horaFin, setHoraFin] = useState('');

    const [precio, setPrecio] = useState('');
    const [estado, setEstado] =
        useState<EstadoGuardado>('programado');

    const [imagenActual, setImagenActual] = useState<string | null>(null);
    const [imagenSeleccionada, setImagenSeleccionada] =
        useState<ImagePicker.ImagePickerAsset | null>(null);

    function limpiarFormulario() {
        setTitulo('');
        setDescripcion('');

        setTipoUbicacion('catalogo');
        setLugarId(lugares[0]?.id ?? '');
        setDireccion('');
        setLatitud('');
        setLongitud('');

        setFechaInicio(fechaActual());
        setHoraInicio('20:00');
        setFechaFin('');
        setHoraFin('');

        setPrecio('');
        setEstado('programado');

        setImagenActual(null);
        setImagenSeleccionada(null);
        setEventoEditado(null);
    }

    // --------------------------------------------------
    // APLICAR FILTROS
    // --------------------------------------------------

    const eventosFiltrados = eventos.filter((evento) => {
        const nombreLugar =
            lugares.find((lugar) => lugar.id === evento.lugarId)?.nombre ?? '';

        const textoBusqueda = [
            evento.titulo,
            evento.descripcion,
        ].join(' ').toLowerCase();

        const textoUbicacion = [
            nombreLugar,
            evento.direccionLibre ?? '',
        ].join(' ').toLowerCase();

        const coincideBusqueda =
            textoBusqueda.includes(busquedaEvento.trim().toLowerCase());

        const coincideLugar =
            textoUbicacion.includes(filtroLugar.trim().toLowerCase());

        const coincideEstado =
            filtroEstado === 'todos' || evento.estado === filtroEstado;

        const fechaEvento = separarFecha(evento.inicio);

        const desdeValida =
            /^\\d{4}-\\d{2}-\\d{2}$/.test(fechaDesdeFiltro);

        const hastaValida =
            /^\\d{4}-\\d{2}-\\d{2}$/.test(fechaHastaFiltro);

        const coincideDesde =
            !desdeValida || fechaEvento >= fechaDesdeFiltro;

        const coincideHasta =
            !hastaValida || fechaEvento <= fechaHastaFiltro;

        return (
            coincideBusqueda &&
            coincideLugar &&
            coincideEstado &&
            coincideDesde &&
            coincideHasta
        );
    });

    function limpiarFiltros() {
        setBusquedaEvento('');
        setFiltroEstado('todos');
        setFiltroLugar('');
        setFechaDesdeFiltro('');
        setFechaHastaFiltro('');
    }

    function abrirNuevoEvento() {
        limpiarFormulario();
        setModo('crear');
    }

    function abrirEdicion(evento: EventoAdmin) {
        limpiarFormulario();

        setEventoEditado(evento);
        setTitulo(evento.titulo);
        setDescripcion(evento.descripcion);

        if (evento.lugarId) {
            setTipoUbicacion('catalogo');
            setLugarId(evento.lugarId);
        } else {
            setTipoUbicacion('libre');
            setDireccion(evento.direccionLibre ?? '');
            setLatitud(
                evento.coordenadas?.latitud !== undefined
                    ? String(evento.coordenadas.latitud)
                    : '',
            );
            setLongitud(
                evento.coordenadas?.longitud !== undefined
                    ? String(evento.coordenadas.longitud)
                    : '',
            );
        }

        setFechaInicio(separarFecha(evento.inicio));
        setHoraInicio(separarHora(evento.inicio));

        setFechaFin(separarFecha(evento.fin));
        setHoraFin(separarHora(evento.fin));

        setPrecio(
            evento.precio !== null ? String(evento.precio) : '',
        );

        setEstado(
            evento.estado === 'finalizado'
                ? 'programado'
                : evento.estado,
        );

        setImagenActual(evento.imagenUrl);
        setModo('editar');
    }

    function abrirReprogramacion(evento: EventoAdmin) {
        limpiarFormulario();

        setEventoEditado(evento);
        setFechaInicio(separarFecha(evento.inicio));
        setHoraInicio(separarHora(evento.inicio));

        setFechaFin(separarFecha(evento.fin));
        setHoraFin(separarHora(evento.fin));

        setModo('reprogramar');
    }

    async function seleccionarImagen() {
        try {
            const permiso =
                await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permiso.granted) {
                Alert.alert(
                    'Permiso necesario',
                    'Necesitamos permiso para acceder a la galería y elegir una imagen.',
                );
                return;
            }

            const resultado = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!resultado.canceled && resultado.assets.length > 0) {
                const imagen = resultado.assets[0];

                console.log('DATOS DE IMAGEN SELECCIONADA:', {
                    uri: imagen.uri,
                    fileName: imagen.fileName,
                    mimeType: imagen.mimeType,
                    fileSize: imagen.fileSize,
                    width: imagen.width,
                    height: imagen.height,
                });

                setImagenSeleccionada(imagen);
            }
        } catch (error) {
            Alert.alert('Error', traducirError(error));
        }
    }

    function validarFormulario(): string | null {
        if (modo === 'reprogramar') {
            if (!fechaInicio || !horaInicio) {
                return 'Ingresá la nueva fecha y hora de inicio.';
            }
        } else {
            if (!titulo.trim()) {
                return 'Ingresá el título del evento.';
            }

            if (!descripcion.trim()) {
                return 'Ingresá la descripción del evento.';
            }

            if (!fechaInicio || !horaInicio) {
                return 'Ingresá la fecha y hora de inicio.';
            }

            if (tipoUbicacion === 'catalogo' && !lugarId) {
                return 'Seleccioná un lugar del catálogo.';
            }

            if (tipoUbicacion === 'libre' && !direccion.trim()) {
                return 'Ingresá la dirección del evento.';
            }
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)) {
            return 'La fecha de inicio debe tener formato AAAA-MM-DD.';
        }

        if (!/^\d{2}:\d{2}$/.test(horaInicio)) {
            return 'La hora de inicio debe tener formato HH:MM.';
        }

        const inicio = crearInstante(fechaInicio, horaInicio);
        const fechaInicioValida = new Date(inicio);

        if (Number.isNaN(fechaInicioValida.getTime())) {
            return 'La fecha de inicio no es válida.';
        }

        if (fechaFin || horaFin) {
            if (!fechaFin || !horaFin) {
                return 'Completá tanto la fecha como la hora de finalización.';
            }

            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaFin)) {
                return 'La fecha de finalización debe tener formato AAAA-MM-DD.';
            }

            if (!/^\d{2}:\d{2}$/.test(horaFin)) {
                return 'La hora de finalización debe tener formato HH:MM.';
            }

            const fin = crearInstante(fechaFin, horaFin);

            if (new Date(fin).getTime() < fechaInicioValida.getTime()) {
                return 'La finalización no puede ser anterior al inicio.';
            }
        }

        if (modo !== 'reprogramar' && precio.trim()) {
            const numero = Number(precio);

            if (!Number.isInteger(numero) || numero < 0) {
                return 'El precio debe ser un número entero igual o mayor a cero.';
            }
        }

        if (
            modo !== 'reprogramar' &&
            tipoUbicacion === 'libre' &&
            (latitud.trim() || longitud.trim())
        ) {
            if (!latitud.trim() || !longitud.trim()) {
                return 'Completá tanto la latitud como la longitud.';
            }

            const lat = Number(latitud.replace(',', '.'));
            const lon = Number(longitud.replace(',', '.'));

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon) ||
                lat < -90 ||
                lat > 90 ||
                lon < -180 ||
                lon > 180
            ) {
                return 'Las coordenadas ingresadas no son válidas.';
            }
        }

        return null;
    }

    async function guardarEvento() {
        const problema = validarFormulario();

        if (problema) {
            Alert.alert('Revisá los datos', problema);
            return;
        }

        if (!modo) return;

        setGuardando(true);

        try {
            const inicio = crearInstante(fechaInicio, horaInicio);

            const fin =
                fechaFin && horaFin
                    ? crearInstante(fechaFin, horaFin)
                    : null;

            if (modo === 'reprogramar') {
                if (!eventoEditado) return;

                await consultarAPI<EventoAdmin>(
                    `/eventos/${encodeURIComponent(eventoEditado.id)}/reprogramar`,
                    {
                        method: 'PATCH',
                        body: JSON.stringify({
                            inicio,
                            fin,
                        }),
                    },
                    true,
                );

                Alert.alert(
                    'Evento reprogramado',
                    'Se actualizó la fecha y el evento quedó en estado programado.',
                );
            } else {
                let imagenUrl = imagenActual;

                if (imagenSeleccionada) {
                    const nombre =
                        imagenSeleccionada.fileName ??
                        `evento-${Date.now()}.${imagenSeleccionada.mimeType?.includes('png') ? 'png' : 'jpg'}`;

                    imagenUrl = await subirImagenAPI(
                        imagenSeleccionada.uri,
                        nombre,
                        imagenSeleccionada.mimeType ?? 'image/jpeg',
                    );
                }

                const coordenadas =
                    tipoUbicacion === 'libre' &&
                        latitud.trim() &&
                        longitud.trim()
                        ? {
                            latitud: Number(latitud.replace(',', '.')),
                            longitud: Number(longitud.replace(',', '.')),
                        }
                        : null;

                const datos = {
                    titulo: titulo.trim(),
                    descripcion: descripcion.trim(),

                    lugarId: tipoUbicacion === 'catalogo' ? lugarId : null,
                    direccionLibre:
                        tipoUbicacion === 'libre' ? direccion.trim() : null,
                    coordenadas,

                    inicio,
                    fin,

                    imagenUrl,
                    precio: precio.trim() ? Number(precio) : null,
                    estado,
                };

                if (modo === 'crear') {
                    await consultarAPI<EventoAdmin>(
                        '/eventos',
                        {
                            method: 'POST',
                            body: JSON.stringify(datos),
                        },
                        true,
                    );

                    Alert.alert('Evento creado', 'El evento se creó correctamente.');
                } else {
                    if (!eventoEditado) return;

                    await consultarAPI<EventoAdmin>(
                        `/eventos/${encodeURIComponent(eventoEditado.id)}`,
                        {
                            method: 'PATCH',
                            body: JSON.stringify(datos),
                        },
                        true,
                    );

                    Alert.alert(
                        'Evento actualizado',
                        'Los cambios se guardaron correctamente.',
                    );
                }
            }

            setModo(null);
            limpiarFormulario();
            await onRecargar();
        } catch (error) {
            Alert.alert('No se pudo guardar', traducirError(error));
        } finally {
            setGuardando(false);
        }
    }

    async function cambiarEstado(
        evento: EventoAdmin,
        nuevoEstado: EstadoGuardado,
    ) {
        if (evento.estado === nuevoEstado) return;

        setActualizandoEstado(evento.id);

        try {
            await consultarAPI<EventoAdmin>(
                `/eventos/${encodeURIComponent(evento.id)}/estado`,
                {
                    method: 'PATCH',
                    body: JSON.stringify({ estado: nuevoEstado }),
                },
                true,
            );

            await onRecargar();
        } catch (error) {
            Alert.alert('No se pudo cambiar el estado', traducirError(error));
        } finally {
            setActualizandoEstado(null);
        }
    }

    function cerrarFormulario() {
        if (guardando) return;

        setModo(null);
        limpiarFormulario();
    }

    function campoFecha(
        etiqueta: string,
        valor: string,
        cambiar: (valor: string) => void,
        placeholder: string,
    ) {
        return (
            <View>
                <Text style={styles.etiqueta}>{etiqueta}</Text>
                <TextInput
                    style={styles.campo}
                    value={valor}
                    onChangeText={cambiar}
                    placeholder={placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>
        );
    }

    function selectorEstado() {
        const opciones: Array<[EstadoGuardado, string]> = [
            ['programado', 'Programado'],
            ['suspendido', 'Suspendido'],
            ['cancelado', 'Cancelado'],
        ];

        return (
            <View style={styles.filaOpciones}>
                {opciones.map(([valor, nombre]) => (
                    <Pressable
                        key={valor}
                        style={[
                            styles.botonOpcion,
                            estado === valor && styles.botonOpcionActivo,
                        ]}
                        onPress={() => setEstado(valor)}
                    >
                        <Text
                            style={[
                                styles.textoOpcion,
                                estado === valor && styles.textoOpcionActivo,
                            ]}
                        >
                            {nombre}
                        </Text>
                    </Pressable>
                ))}
            </View>
        );
    }

    return (
        <View>
            {!modo ? (
                <>
                    <Pressable
                        style={styles.botonPrincipal}
                        onPress={abrirNuevoEvento}
                    >
                        <Text style={styles.textoBoton}>+ Crear nuevo evento</Text>
                    </Pressable>

                    {/* FILTROS DE EVENTOS */}

                    <View style={styles.tarjeta}>
                        <Text style={styles.tituloTarjeta}>
                            Buscar y filtrar eventos
                        </Text>

                        <TextInput
                            style={styles.campo}
                            value={busquedaEvento}
                            onChangeText={setBusquedaEvento}
                            placeholder="Buscar por nombre o descripción..."
                        />

                        <Text style={styles.etiqueta}>Estado</Text>

                        <View style={styles.filaOpciones}>
                            {(
                                [
                                    ['todos', 'Todos'],
                                    ['programado', 'Programados'],
                                    ['suspendido', 'Suspendidos'],
                                    ['cancelado', 'Cancelados'],
                                    ['finalizado', 'Finalizados'],
                                ] as const
                            ).map(([valor, nombre]) => (
                                <Pressable
                                    key={valor}
                                    style={[
                                        styles.botonOpcion,
                                        filtroEstado === valor && styles.botonOpcionActivo,
                                    ]}
                                    onPress={() => setFiltroEstado(valor)}
                                >
                                    <Text
                                        style={[
                                            styles.textoOpcion,
                                            filtroEstado === valor && styles.textoOpcionActivo,
                                        ]}
                                    >
                                        {nombre}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.etiqueta}>Lugar o dirección</Text>

                        <TextInput
                            style={styles.campo}
                            value={filtroLugar}
                            onChangeText={setFiltroLugar}
                            placeholder="Ej.: Termas, Plaza Washington..."
                        />

                        <Text style={styles.etiqueta}>Fecha de inicio del evento</Text>

                        <View style={styles.filaFechas}>
                            <TextInput
                                style={[styles.campo, styles.campoFechaFiltro]}
                                value={fechaDesdeFiltro}
                                onChangeText={setFechaDesdeFiltro}
                                placeholder="Desde AAAA-MM-DD"
                                autoCapitalize="none"
                            />

                            <TextInput
                                style={[styles.campo, styles.campoFechaFiltro]}
                                value={fechaHastaFiltro}
                                onChangeText={setFechaHastaFiltro}
                                placeholder="Hasta AAAA-MM-DD"
                                autoCapitalize="none"
                            />
                        </View>

                        <Text style={styles.textoResultados}>
                            {eventosFiltrados.length} de {eventos.length} eventos
                        </Text>

                        <Pressable
                            style={styles.botonLimpiarFiltros}
                            onPress={limpiarFiltros}
                        >
                            <Text style={styles.textoBotonLimpiar}>
                                Limpiar filtros
                            </Text>
                        </Pressable>
                    </View>

                    {eventos.length === 0 ? (
                        <View style={styles.tarjeta}>
                            <Text style={styles.textoSecundario}>
                                No hay eventos disponibles para mostrar.
                            </Text>
                        </View>
                    ) : eventosFiltrados.length === 0 ? (
                        <View style={styles.tarjeta}>
                            <Text style={styles.textoSecundario}>
                                No encontramos eventos que coincidan con los filtros.
                            </Text>
                        </View>
                    ) : (
                        eventosFiltrados.map((evento) => (
                            <View key={evento.id} style={styles.tarjeta}>
                                <Text style={styles.tituloTarjeta}>
                                    {evento.titulo}
                                </Text>

                                <Text style={styles.textoSecundario}>
                                    {formatearFecha(evento.inicio)}
                                </Text>

                                {evento.direccionLibre ? (
                                    <Text style={styles.textoSecundario}>
                                        {evento.direccionLibre}
                                    </Text>
                                ) : null}

                                <View style={styles.estadoActual}>
                                    <Text style={styles.etiqueta}>Estado actual:</Text>
                                    <Text
                                        style={[
                                            styles.estadoTexto,
                                            evento.estado === 'cancelado' && styles.estadoCancelado,
                                            evento.estado === 'suspendido' && styles.estadoSuspendido,
                                            evento.estado === 'finalizado' && styles.estadoFinalizado,
                                        ]}
                                    >
                                        {evento.estado.toUpperCase()}
                                    </Text>
                                </View>

                                <View style={styles.filaAcciones}>
                                    <Pressable
                                        style={styles.botonSecundario}
                                        onPress={() => abrirEdicion(evento)}
                                    >
                                        <Text style={styles.textoBotonSecundario}>Editar</Text>
                                    </Pressable>

                                    <Pressable
                                        style={styles.botonSecundario}
                                        onPress={() => abrirReprogramacion(evento)}
                                    >
                                        <Text style={styles.textoBotonSecundario}>
                                            Reprogramar
                                        </Text>
                                    </Pressable>
                                </View>

                                <Text style={styles.etiqueta}>Cambiar estado</Text>

                                <View style={styles.filaOpciones}>
                                    {(
                                        [
                                            ['programado', 'Programado'],
                                            ['suspendido', 'Suspendido'],
                                            ['cancelado', 'Cancelado'],
                                        ] as const
                                    ).map(([valor, nombre]) => (
                                        <Pressable
                                            key={valor}
                                            disabled={
                                                actualizandoEstado !== null ||
                                                evento.estado === valor
                                            }
                                            style={[
                                                styles.botonEstado,
                                                evento.estado === valor && styles.botonOpcionActivo,
                                                actualizandoEstado !== null && styles.deshabilitado,
                                            ]}
                                            onPress={() => cambiarEstado(evento, valor)}
                                        >
                                            {actualizandoEstado === evento.id ? (
                                                <ActivityIndicator size="small" color={COLOR} />
                                            ) : (
                                                <Text
                                                    style={[
                                                        styles.textoOpcion,
                                                        evento.estado === valor && styles.textoOpcionActivo,
                                                    ]}
                                                >
                                                    {nombre}
                                                </Text>
                                            )}
                                        </Pressable>
                                    ))}
                                </View>
                            </View>
                        ))
                    )}
                </>
            ) : (
                <View style={styles.tarjeta}>
                    <Text style={styles.tituloTarjeta}>
                        {modo === 'crear'
                            ? 'Nuevo evento'
                            : modo === 'editar'
                                ? 'Editar evento'
                                : 'Reprogramar evento'}
                    </Text>

                    {modo === 'reprogramar' ? (
                        <>
                            <Text style={styles.textoSecundario}>
                                {eventoEditado?.titulo}
                            </Text>

                            <Text style={styles.aviso}>
                                Al guardar, el evento quedará automáticamente como PROGRAMADO,
                                incluso si ya había finalizado.
                            </Text>
                        </>
                    ) : (
                        <>
                            <Text style={styles.etiqueta}>Título *</Text>
                            <TextInput
                                style={styles.campo}
                                value={titulo}
                                onChangeText={setTitulo}
                                placeholder="Nombre del evento"
                                maxLength={200}
                            />

                            <Text style={styles.etiqueta}>Descripción *</Text>
                            <TextInput
                                style={[styles.campo, styles.campoMultilinea]}
                                value={descripcion}
                                onChangeText={setDescripcion}
                                placeholder="Descripción del evento"
                                multiline
                                textAlignVertical="top"
                            />

                            <Text style={styles.etiqueta}>Ubicación *</Text>

                            <View style={styles.filaOpciones}>
                                <Pressable
                                    style={[
                                        styles.botonOpcion,
                                        tipoUbicacion === 'catalogo' && styles.botonOpcionActivo,
                                    ]}
                                    onPress={() => setTipoUbicacion('catalogo')}
                                >
                                    <Text
                                        style={[
                                            styles.textoOpcion,
                                            tipoUbicacion === 'catalogo' && styles.textoOpcionActivo,
                                        ]}
                                    >
                                        Lugar del catálogo
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.botonOpcion,
                                        tipoUbicacion === 'libre' && styles.botonOpcionActivo,
                                    ]}
                                    onPress={() => setTipoUbicacion('libre')}
                                >
                                    <Text
                                        style={[
                                            styles.textoOpcion,
                                            tipoUbicacion === 'libre' && styles.textoOpcionActivo,
                                        ]}
                                    >
                                        Dirección libre
                                    </Text>
                                </Pressable>
                            </View>

                            {tipoUbicacion === 'catalogo' ? (
                                <ScrollView
                                    style={styles.listaLugares}
                                    nestedScrollEnabled
                                >
                                    {lugares.map((lugar) => (
                                        <Pressable
                                            key={lugar.id}
                                            style={[
                                                styles.opcionLugar,
                                                lugarId === lugar.id && styles.opcionLugarActiva,
                                            ]}
                                            onPress={() => setLugarId(lugar.id)}
                                        >
                                            <Text
                                                style={[
                                                    styles.nombreLugar,
                                                    lugarId === lugar.id && styles.nombreLugarActivo,
                                                ]}
                                            >
                                                {lugar.nombre}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            ) : (
                                <>
                                    <Text style={styles.etiqueta}>Dirección *</Text>
                                    <TextInput
                                        style={styles.campo}
                                        value={direccion}
                                        onChangeText={setDireccion}
                                        placeholder="Dirección del evento"
                                    />

                                    <Text style={styles.etiqueta}>Latitud (opcional)</Text>
                                    <TextInput
                                        style={styles.campo}
                                        value={latitud}
                                        onChangeText={setLatitud}
                                        placeholder="-32.2236"
                                        keyboardType="decimal-pad"
                                    />

                                    <Text style={styles.etiqueta}>Longitud (opcional)</Text>
                                    <TextInput
                                        style={styles.campo}
                                        value={longitud}
                                        onChangeText={setLongitud}
                                        placeholder="-58.1427"
                                        keyboardType="decimal-pad"
                                    />
                                </>
                            )}
                        </>
                    )}

                    <Text style={styles.etiqueta}>Fecha de inicio *</Text>
                    <TextInput
                        style={styles.campo}
                        value={fechaInicio}
                        onChangeText={setFechaInicio}
                        placeholder="AAAA-MM-DD"
                        autoCapitalize="none"
                    />

                    <Text style={styles.etiqueta}>Hora de inicio *</Text>
                    <TextInput
                        style={styles.campo}
                        value={horaInicio}
                        onChangeText={setHoraInicio}
                        placeholder="20:00"
                    />

                    <Text style={styles.etiqueta}>Fecha de finalización (opcional)</Text>
                    <TextInput
                        style={styles.campo}
                        value={fechaFin}
                        onChangeText={setFechaFin}
                        placeholder="AAAA-MM-DD"
                        autoCapitalize="none"
                    />

                    <Text style={styles.etiqueta}>Hora de finalización (opcional)</Text>
                    <TextInput
                        style={styles.campo}
                        value={horaFin}
                        onChangeText={setHoraFin}
                        placeholder="23:00"
                    />

                    {modo !== 'reprogramar' ? (
                        <>
                            <Text style={styles.etiqueta}>Precio en pesos (opcional)</Text>
                            <TextInput
                                style={styles.campo}
                                value={precio}
                                onChangeText={setPrecio}
                                placeholder="0"
                                keyboardType="numeric"
                            />

                            <Text style={styles.etiqueta}>Imagen del evento</Text>

                            {imagenSeleccionada ? (
                                <Image
                                    source={{ uri: imagenSeleccionada.uri }}
                                    style={styles.imagen}
                                    resizeMode="cover"
                                />
                            ) : imagenActual ? (
                                <Image
                                    source={{ uri: prepararUrlImagen(imagenActual) }}
                                    style={styles.imagen}
                                    resizeMode="cover"
                                />
                            ) : null}

                            <Pressable
                                style={styles.botonSecundario}
                                onPress={seleccionarImagen}
                            >
                                <Text style={styles.textoBotonSecundario}>
                                    {imagenSeleccionada || imagenActual
                                        ? 'Cambiar imagen'
                                        : 'Elegir imagen de la galería'}
                                </Text>
                            </Pressable>

                            {imagenActual || imagenSeleccionada ? (
                                <Pressable
                                    style={styles.botonQuitarImagen}
                                    onPress={() => {
                                        setImagenActual(null);
                                        setImagenSeleccionada(null);
                                    }}
                                >
                                    <Text style={styles.textoQuitarImagen}>
                                        Quitar imagen
                                    </Text>
                                </Pressable>
                            ) : null}

                            <Text style={styles.etiqueta}>Estado</Text>
                            {selectorEstado()}
                        </>
                    ) : null}

                    <Pressable
                        style={[
                            styles.botonPrincipal,
                            guardando && styles.deshabilitado,
                        ]}
                        disabled={guardando}
                        onPress={guardarEvento}
                    >
                        {guardando ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.textoBoton}>
                                {modo === 'crear'
                                    ? 'Crear evento'
                                    : modo === 'editar'
                                        ? 'Guardar cambios'
                                        : 'Guardar reprogramación'}
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        style={styles.botonCancelar}
                        disabled={guardando}
                        onPress={cerrarFormulario}
                    >
                        <Text style={styles.textoCancelar}>Volver a los eventos</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    tarjeta: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        padding: 16,
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#E5E2D9',
        gap: 10,
    },
    tituloTarjeta: {
        fontSize: 18,
        fontWeight: '700',
        color: '#294C3D',
    },
    textoSecundario: {
        color: '#716F68',
        fontSize: 14,
        lineHeight: 20,
    },
    etiqueta: {
        color: '#4D5149',
        fontSize: 13,
        fontWeight: '700',
        marginTop: 5,
    },
    campo: {
        borderWidth: 1,
        borderColor: '#D8D6CD',
        borderRadius: 9,
        paddingHorizontal: 12,
        paddingVertical: 11,
        color: '#343A34',
        backgroundColor: '#FFFFFF',
        fontSize: 14,
    },
    campoMultilinea: {
        minHeight: 100,
    },
    botonPrincipal: {
        backgroundColor: COLOR,
        borderRadius: 10,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
        marginTop: 10,
    },
    textoBoton: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    botonSecundario: {
        borderWidth: 1,
        borderColor: COLOR,
        borderRadius: 9,
        padding: 11,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    textoBotonSecundario: {
        color: COLOR,
        fontWeight: '700',
        fontSize: 13,
    },
    filaAcciones: {
        flexDirection: 'row',
        gap: 8,
    },
    estadoActual: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    estadoTexto: {
        fontWeight: '800',
        color: COLOR,
        fontSize: 12,
    },
    estadoCancelado: {
        color: '#B04444',
    },
    estadoSuspendido: {
        color: '#A36B20',
    },
    estadoFinalizado: {
        color: '#77736B',
    },
    filaOpciones: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
    },
    botonOpcion: {
        flexGrow: 1,
        borderWidth: 1,
        borderColor: '#D8D6CD',
        borderRadius: 9,
        padding: 10,
        alignItems: 'center',
    },
    botonOpcionActivo: {
        backgroundColor: '#E7EFE9',
        borderColor: COLOR,
    },
    textoOpcion: {
        color: '#5E625B',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    textoOpcionActivo: {
        color: COLOR,
        fontWeight: '800',
    },
    botonEstado: {
        flex: 1,
        minWidth: 90,
        borderWidth: 1,
        borderColor: '#D8D6CD',
        borderRadius: 9,
        padding: 9,
        alignItems: 'center',
    },
    deshabilitado: {
        opacity: 0.5,
    },
    listaLugares: {
        maxHeight: 190,
        borderWidth: 1,
        borderColor: '#E5E2D9',
        borderRadius: 9,
    },
    opcionLugar: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#EEECE6',
    },
    opcionLugarActiva: {
        backgroundColor: '#E7EFE9',
    },
    nombreLugar: {
        color: '#4D5149',
        fontSize: 14,
    },
    nombreLugarActivo: {
        color: COLOR,
        fontWeight: '800',
    },
    imagen: {
        width: '100%',
        height: 180,
        borderRadius: 10,
        backgroundColor: '#EEECE6',
    },
    botonQuitarImagen: {
        padding: 8,
        alignItems: 'center',
    },
    textoQuitarImagen: {
        color: '#B04444',
        fontSize: 13,
        fontWeight: '600',
    },
    aviso: {
        color: '#80602D',
        backgroundColor: '#F8F0DF',
        padding: 12,
        borderRadius: 9,
        lineHeight: 20,
        fontSize: 13,
    },
    botonCancelar: {
        padding: 13,
        alignItems: 'center',
    },
    textoCancelar: {
        color: '#716F68',
        fontWeight: '600',
    },

    // FILTROS DE EVENTOS

    filaFechas: {
        flexDirection: 'row',
        gap: 8,
    },
    campoFechaFiltro: {
        flex: 1,
        minWidth: 0,
        fontSize: 12,
        paddingHorizontal: 8,
    },
    textoResultados: {
        color: COLOR,
        fontSize: 13,
        fontWeight: '700',
        marginTop: 5,
    },
    botonLimpiarFiltros: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 9,
        backgroundColor: '#F1F0EB',
    },
    textoBotonLimpiar: {
        color: '#716F68',
        fontSize: 13,
        fontWeight: '700',
    },
});
