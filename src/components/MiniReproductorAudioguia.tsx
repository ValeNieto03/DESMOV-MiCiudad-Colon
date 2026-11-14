
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { useAudioguia } from '@/servicios/AudioProvider';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function MiniReproductorAudioguia() {
  const pathname = usePathname();

  const { colors } = useThemeContext();
  const styles = crearEstilos(colors);

  const {
    pistaActual,
    estado,
    alternarReproduccion,
    detener,
  } = useAudioguia();

  // En el detalle ya se muestran los controles completos.
  if (!pistaActual || pathname === '/lugar-detalle') {
    return null;
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.informacion}>
        <Text style={styles.etiqueta}>AUDIOGUÍA EN REPRODUCCIÓN</Text>
        <Text style={styles.nombre} numberOfLines={1}>
          {pistaActual.nombre}
        </Text>
      </View>

      <Pressable
        style={styles.boton}
        onPress={alternarReproduccion}
      >
        <Text style={styles.icono}>
          {estado.playing ? '⏸' : '▶'}
        </Text>
      </Pressable>

      <Pressable
        style={styles.botonCerrar}
        onPress={detener}
      >
        <Text style={styles.cerrar}>✕</Text>
      </Pressable>
    </View>
  );
}

function crearEstilos(
  colors: (typeof Colors)[keyof typeof Colors],
) {
  return StyleSheet.create({
    contenedor: {
      minHeight: 64,
      backgroundColor: colors.backgroundElement,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 16,
      paddingVertical: 9,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    informacion: {
      flex: 1,
    },

    etiqueta: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.success,
      letterSpacing: 0.6,
    },

    nombre: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '800',
      marginTop: 3,
    },

    boton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },

    icono: {
      color: colors.onPrimary,
      fontSize: 17,
      fontWeight: '800',
    },

    botonCerrar: {
      width: 32,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cerrar: {
      color: colors.textSecondary,
      fontSize: 19,
    },
  });
}