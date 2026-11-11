import Storage from 'expo-sqlite/kv-store';

import { consultarAPI } from '@/servicios/api';
import {
  obtenerToken,
  obtenerUsuarioActual,
} from '@/servicios/autenticacion';
import type { Preferencias, Usuario } from '@/tipos/usuario';

export type PreferenciaTema = Preferencias['tema'];

const TEMA_PENDIENTE_KEY = 'mi-ciudad-theme-account-pending';
type TemasPendientesPorUsuario = Record<string, PreferenciaTema>;

function esPreferenciaTema(value: string | undefined): value is PreferenciaTema {
  return value === 'claro' || value === 'oscuro' || value === 'sistema';
}

let escriturasCuenta = Promise.resolve();

async function actualizarTemaCuenta(tema: PreferenciaTema): Promise<void> {
  await consultarAPI<Usuario>(
    '/yo',
    {
      method: 'PATCH',
      body: JSON.stringify({ preferencias: { tema } }),
    },
    true,
  );
}

async function obtenerTemasPendientes(): Promise<TemasPendientesPorUsuario> {
  const guardados = await Storage.getItemAsync(TEMA_PENDIENTE_KEY);

  if (!guardados) return {};

  try {
    return JSON.parse(guardados) as TemasPendientesPorUsuario;
  } catch {
    return {};
  }
}

async function guardarTemaPendiente(
  usuarioId: string,
  tema: PreferenciaTema,
): Promise<void> {
  const pendientes = await obtenerTemasPendientes();
  pendientes[usuarioId] = tema;
  await Storage.setItemAsync(TEMA_PENDIENTE_KEY, JSON.stringify(pendientes));
}

async function quitarTemaPendiente(usuarioId: string): Promise<void> {
  const pendientes = await obtenerTemasPendientes();
  delete pendientes[usuarioId];
  await Storage.setItemAsync(TEMA_PENDIENTE_KEY, JSON.stringify(pendientes));
}

export function guardarPreferenciaTemaCuenta(
  tema: PreferenciaTema,
): Promise<void> {
  escriturasCuenta = escriturasCuenta
    .catch(() => undefined)
    .then(async () => {
      const token = await obtenerToken();
      const usuario = await obtenerUsuarioActual();

      if (!token || !usuario) return;

      try {
        await actualizarTemaCuenta(tema);
        await quitarTemaPendiente(usuario.id);
      } catch {
        await guardarTemaPendiente(usuario.id, tema);
      }
    });

  return escriturasCuenta;
}

export async function obtenerPreferenciaTemaCuenta(): Promise<PreferenciaTema | null> {
  const token = await obtenerToken();

  if (!token) return null;

  try {
    const usuario = await consultarAPI<Usuario>('/yo', {}, true);
    const tema = usuario.preferencias?.tema;

    return esPreferenciaTema(tema) ? tema : null;
  } catch {
    return null;
  }
}

export async function sincronizarTemaCuentaPendiente(): Promise<void> {
  await escriturasCuenta.catch(() => undefined);

  const token = await obtenerToken();
  const usuario = await obtenerUsuarioActual();

  if (!token || !usuario) return;

  try {
    const pendientes = await obtenerTemasPendientes();
    const tema = pendientes[usuario.id];

    if (!tema || !esPreferenciaTema(tema)) return;

    await actualizarTemaCuenta(tema);
    await quitarTemaPendiente(usuario.id);
  } catch {
    // La elección local se mantiene; se reintentará al volver a abrir «Yo».
  }
}
