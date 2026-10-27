
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  comprobarConexionAPI,
  obtenerCategoriasAPI,
  obtenerLugaresAPI,
  type LugarAPI,
} from '@/servicios/api';

export default function PruebaAPIScreen() {
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState('');
  const [lugares, setLugares] = useState<LugarAPI[]>([]);
  const [cantidadCategorias, setCantidadCategorias] = useState(0);

  async function probarAPI() {
    setCargando(true);
    setResultado('');

    try {
      const salud = await comprobarConexionAPI();
      const categorias = await obtenerCategoriasAPI();
      const lugaresObtenidos = await obtenerLugaresAPI();

      setLugares(lugaresObtenidos);
      setCantidadCategorias(categorias.length);

      setResultado(
        `Conexión correcta.\n` +
        `Estado: ${salud.estado}\n` +
        `Versión: ${salud.version}\n` +
        `Categorías: ${categorias.length}\n` +
        `Lugares recibidos: ${lugaresObtenidos.length}`,
      );
    } catch (error) {
      setResultado(
        error instanceof Error
          ? `No se pudo consultar la API.\n${error.message}`
          : 'Ocurrió un error desconocido.',
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    probarAPI();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Prueba de la API</Text>

        <Text style={styles.description}>
          Comprobamos la conexión y consultamos las categorías y los lugares
          de Mi Ciudad.
        </Text>

        <Pressable
          style={styles.button}
          onPress={probarAPI}
          disabled={cargando}
        >
          <Text style={styles.buttonText}>
            {cargando ? 'Consultando...' : 'Volver a probar'}
          </Text>
        </Pressable>

        {cargando && <ActivityIndicator size="large" />}

        <View style={styles.resultCard}>
          <Text style={styles.result}>{resultado}</Text>
        </View>

        <Text style={styles.subtitle}>Lugares recibidos</Text>

        {lugares.map((lugar) => (
          <View key={lugar.id} style={styles.placeCard}>
            <Text style={styles.placeName}>{lugar.nombre}</Text>
            <Text style={styles.placeDescription}>
              {lugar.descripcionCorta ?? lugar.descripcion}
            </Text>
            <Text style={styles.coordinates}>
              {lugar.coordenadas.latitud}, {lugar.coordenadas.longitud}
            </Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Categorías recibidas: {cantidadCategorias}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },
  content: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: '#243D32',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5D625B',
  },
  button: {
    backgroundColor: '#285943',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  resultCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  result: {
    fontSize: 15,
    lineHeight: 23,
    color: '#243D32',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#243D32',
    marginTop: 6,
  },
  placeCard: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    gap: 6,
  },
  placeName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#243D32',
  },
  placeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#5D625B',
  },
  coordinates: {
    fontSize: 12,
    color: '#777777',
  },
  footer: {
    color: '#5D625B',
    marginBottom: 20,
  },
});
