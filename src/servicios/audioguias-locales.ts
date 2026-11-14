
import { Directory, File, Paths } from 'expo-file-system';

const carpetaAudioguias = new Directory(
    Paths.document,
    'audioguias',
);

function obtenerNombreArchivo(lugarId: string): string {
    const idSeguro = lugarId.replace(/[^a-zA-Z0-9_-]/g, '_');

    return `${idSeguro}.mp3`;
}

/**
 * Descarga una audioguía de la API y la guarda
 * en el almacenamiento interno de la aplicación.
 *
 * Si ya existe, reutiliza el archivo descargado.
 * Si falla la descarga, devuelve la URL remota
 * para permitir la reproducción cuando haya conexión.
 */
export async function obtenerAudioLocal(
    url: string,
    lugarId: string,
): Promise<{ uri: string }> {
    const archivo = new File(
        carpetaAudioguias,
        obtenerNombreArchivo(lugarId),
    );

    try {
        // Crear la carpeta si todavía no existe.
        if (!carpetaAudioguias.exists) {
            carpetaAudioguias.create({
                idempotent: true,
            });
        }

        // Si ya está descargada, reutilizarla.
        if (archivo.exists) {
            console.log(
                'AUDIOGUIA YA DISPONIBLE LOCALMENTE:',
                lugarId,
                archivo.uri,
            );

            return { uri: archivo.uri };
        }

        console.log(
            'DESCARGANDO AUDIOGUIA:',
            lugarId,
            url,
        );

        // Descargar el MP3 en el almacenamiento interno.
        const archivoDescargado = await File.downloadFileAsync(
            url,
            archivo,
            {
                idempotent: true,
            },
        );

        console.log(
            'AUDIOGUIA DESCARGADA:',
            lugarId,
            archivoDescargado.uri,
        );

        return {
            uri: archivoDescargado.uri,
        };
    } catch (error) {
        console.error(
            'NO SE PUDO DESCARGAR AUDIOGUIA:',
            lugarId,
            error,
        );

        // Eliminar un posible archivo incompleto.
        try {
            if (archivo.exists) {
                archivo.delete();
            }
        } catch (errorEliminar) {
            console.error(
                'NO SE PUDO ELIMINAR EL ARCHIVO INCOMPLETO:',
                errorEliminar,
            );
        }

        // Mantener la posibilidad de reproducir desde Internet.
        return { uri: url };
    }
}
