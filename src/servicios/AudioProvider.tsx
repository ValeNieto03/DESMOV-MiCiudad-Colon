
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioSource,
} from 'expo-audio';

type PistaAudioguia = {
  id: string;
  nombre: string;
};

type AudioContexto = {
  pistaActual: PistaAudioguia | null;
  estado: ReturnType<typeof useAudioPlayerStatus>;
  reproducirOPausar: (
    fuente: AudioSource,
    pista: PistaAudioguia,
  ) => void;
  alternarReproduccion: () => void;
  irA: (segundos: number) => Promise<void>;
  detener: () => void;
};

const ContextoAudio = createContext<AudioContexto | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  // Esta es la única instancia del reproductor de toda la aplicación.
  const player = useAudioPlayer(null, {
    updateInterval: 200,
  });

  const estado = useAudioPlayerStatus(player);
  const [pistaActual, setPistaActual] =
    useState<PistaAudioguia | null>(null);

  useEffect(() => {
    async function configurarAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
        });
      } catch (error) {
        console.error('No se pudo configurar el audio:', error);
      }
    }

    void configurarAudio();
  }, []);

  const reproducirOPausar = useCallback(
    (fuente: AudioSource, pista: PistaAudioguia) => {
      try {
        const esLaMismaPista = pistaActual?.id === pista.id;

        if (esLaMismaPista) {
          if (estado.playing) {
            player.pause();
          } else {
            player.play();
          }
          return;
        }

        // Primero detenemos la pista anterior.
        player.pause();

        // Después reemplazamos su fuente por la nueva.
        player.replace(fuente);

        setPistaActual(pista);

        // Activamos los controles de Android y de la pantalla bloqueada.
        player.setActiveForLockScreen(true, {
          title: pista.nombre,
          artist: 'Mi Ciudad - Guía turística de Colón',
          albumTitle: 'Audioguías',
        });

        player.play();
      } catch (error) {
        console.error('No se pudo reproducir la audioguía:', error);
      }
    },
    [estado.playing, pistaActual?.id, player],
  );

  const alternarReproduccion = useCallback(() => {
    if (!pistaActual) return;

    if (estado.playing) {
      player.pause();
    } else {
      player.play();
    }
  }, [estado.playing, pistaActual, player]);

  const irA = useCallback(
    async (segundos: number) => {
      const duracion = estado.duration;

      if (!Number.isFinite(duracion) || duracion <= 0) return;

      const posicion = Math.max(0, Math.min(duracion, segundos));
      await player.seekTo(posicion);
    },
    [estado.duration, player],
  );

  const detener = useCallback(() => {
    player.pause();
    player.clearLockScreenControls();
    setPistaActual(null);
  }, [player]);

  const valor = useMemo(
    () => ({
      pistaActual,
      estado,
      reproducirOPausar,
      alternarReproduccion,
      irA,
      detener,
    }),
    [
      pistaActual,
      estado,
      reproducirOPausar,
      alternarReproduccion,
      irA,
      detener,
    ],
  );

  return (
    <ContextoAudio.Provider value={valor}>
      {children}
    </ContextoAudio.Provider>
  );
}

export function useAudioguia() {
  const contexto = useContext(ContextoAudio);

  if (!contexto) {
    throw new Error(
      'useAudioguia debe utilizarse dentro de AudioProvider.',
    );
  }

  return contexto;
}