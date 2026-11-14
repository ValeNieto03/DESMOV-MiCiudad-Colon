
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioSource,
} from 'expo-audio';

type AudioguiaActual = {
  lugarId: string;
  nombre: string;
};

type AudioguiaContextType = {
  audioguiaActual: AudioguiaActual | null;
  estado: ReturnType<typeof useAudioPlayerStatus>;
  iniciar: (
    fuente: AudioSource,
    lugarId: string,
    nombre: string,
  ) => void;
  alternar: (
    fuente: AudioSource,
    lugarId: string,
    nombre: string,
  ) => void;
  pausar: () => void;
  reanudar: () => void;
  detener: () => void;
  irA: (segundos: number) => Promise<void>;
};

const AudioguiaContext =
  createContext<AudioguiaContextType | null>(null);

type Props = {
  children: ReactNode;
};

export function AudioguiaProvider({ children }: Props) {
  // Esta es la única instancia de audio de toda la aplicación.
  const player = useAudioPlayer(null, {
    updateInterval: 200,
  });

  const estado = useAudioPlayerStatus(player);

  const [audioguiaActual, setAudioguiaActual] =
    useState<AudioguiaActual | null>(null);

  const lugarIdRef = useRef<string | null>(null);
  const fuenteRef = useRef<AudioSource>(null);

  // Configurar la sesión para permitir reproducción en segundo plano.
  useEffect(() => {
    async function configurarAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (error) {
        console.warn(
          'No se pudo configurar el audio en segundo plano:',
          error,
        );
      }
    }

    configurarAudio();
  }, []);

  const iniciar = useCallback(
    (
      fuente: AudioSource,
      lugarId: string,
      nombre: string,
    ) => {
      try {
        // Si es otro lugar, detenemos y reemplazamos el audio anterior.
        if (lugarIdRef.current !== lugarId) {
          player.pause();
          player.replace(fuente);

          lugarIdRef.current = lugarId;
          fuenteRef.current = fuente;

          setAudioguiaActual({
            lugarId,
            nombre,
          });
        }

        // Activar los controles de pantalla bloqueada.
        player.setActiveForLockScreen(
          true,
          {
            title: nombre,
            artist: 'Mi Ciudad',
            albumTitle: 'Guía turística de Colón',
          },
          {
            showSeekBackward: true,
            showSeekForward: true,
          },
        );

        player.play();
      } catch (error) {
        console.error(
          'No se pudo iniciar la audioguía:',
          error,
        );
      }
    },
    [player],
  );

  const alternar = useCallback(
    (
      fuente: AudioSource,
      lugarId: string,
      nombre: string,
    ) => {
      if (lugarIdRef.current !== lugarId) {
        iniciar(fuente, lugarId, nombre);
        return;
      }

      if (estado.playing) {
        player.pause();
      } else {
        player.play();
      }
    },
    [estado.playing, iniciar, player],
  );

  const pausar = useCallback(() => {
    player.pause();
  }, [player]);

  const reanudar = useCallback(() => {
    if (lugarIdRef.current !== null) {
      player.play();
    }
  }, [player]);

  const detener = useCallback(() => {
    player.pause();
    player.clearLockScreenControls();

    lugarIdRef.current = null;
    fuenteRef.current = null;

    setAudioguiaActual(null);
  }, [player]);

  const irA = useCallback(
    async (segundos: number) => {
      const duracion = estado.duration;

      if (!Number.isFinite(duracion) || duracion <= 0) {
        return;
      }

      const posicion = Math.max(
        0,
        Math.min(duracion, segundos),
      );

      await player.seekTo(posicion);
    },
    [estado.duration, player],
  );

  return (
    <AudioguiaContext.Provider
      value={{
        audioguiaActual,
        estado,
        iniciar,
        alternar,
        pausar,
        reanudar,
        detener,
        irA,
      }}
    >
      {children}
    </AudioguiaContext.Provider>
  );
}

export function useAudioguia() {
  const contexto = useContext(AudioguiaContext);

  if (!contexto) {
    throw new Error(
      'useAudioguia debe utilizarse dentro de AudioguiaProvider.',
    );
  }

  return contexto;
}