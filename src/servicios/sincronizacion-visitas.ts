import { consultarAPI, subirImagenAPI } from "@/servicios/api";
import { obtenerIdAPIdeLugar } from "@/servicios/lugares-integrados";
import {
  actualizarFotoVisita,
  marcarVisitaSincronizada,
  type Visita,
} from "@/servicios/visitas";

type VisitaParaEnviar = Pick<
  Visita,
  "id" | "lugarId" | "fechaHora" | "origen" | "nota" | "fotoUri"
>;

/** Envía una visita local a la API y guarda su resultado en el teléfono. */
export async function sincronizarVisita(visita: Visita): Promise<void> {
  // Las visitas de demostración no representan una ubicación verificada.
  if (visita.origen === "demo") return;
  const lugarIdAPI = await obtenerIdAPIdeLugar(visita.lugarId);

  const visitaParaEnviar: VisitaParaEnviar = {
    id: visita.id,
    lugarId: visita.lugarId,
    fechaHora: visita.fechaHora,
    origen: visita.origen,
    nota: visita.nota,
    fotoUri: visita.fotoUri,
  };

  const fotoYaSubida =
    visita.fotoUri && /^https?:\/\//i.test(visita.fotoUri)
      ? visita.fotoUri
      : undefined;

  await consultarAPI<VisitaParaEnviar>(
    "/yo/visitas",
    {
      method: "POST",
      body: JSON.stringify({
        id: visitaParaEnviar.id,
        lugarId: lugarIdAPI,
        fechaHora: visitaParaEnviar.fechaHora,
        origen: visitaParaEnviar.origen,
        nota: visitaParaEnviar.nota,
        ...(fotoYaSubida ? { fotoUri: fotoYaSubida } : {}),
      }),
    },
    true,
  );

  let fotoUriRemota = visita.fotoUri;

  if (fotoUriRemota && !/^https?:\/\//i.test(fotoUriRemota)) {
    fotoUriRemota = await subirImagenAPI(
      fotoUriRemota,
      `${visita.id}.jpg`,
      "image/jpeg",
    );

    // Si falla el PATCH, el próximo intento reutiliza el archivo ya subido.
    actualizarFotoVisita(visita.id, fotoUriRemota);
  }

  await consultarAPI<VisitaParaEnviar>(
    `/yo/visitas/${encodeURIComponent(visita.id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        nota: visita.nota,
        fotoUri: fotoUriRemota,
      }),
    },
    true,
  );

  marcarVisitaSincronizada(visita.id);
}
