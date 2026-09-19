import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

import { lugares } from '@/data/lugares';

export default function LugaresScreen() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');

  const router = useRouter();

  const categorias = [
    'Todos',
    'Centro',
    'Termas',
    'Naturaleza',
    'Playa',
    'Río y paseo',
    'Patrimonio',
  ];

  const lugaresFiltrados = lugares.filter((lugar) => {
    const coincideBusqueda =
      lugar.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      lugar.descripcion.toLowerCase().includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoriaSeleccionada === 'Todos' ||
      lugar.categoria === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.smallTitle}>
              GUÍA TURÍSTICA
            </Text>

            <Text style={styles.title}>
              Lugares
            </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Descubrí lugares para conocer en Colón
        </Text>

        {/* Buscador */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar lugares..."
            placeholderTextColor="#99958C"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        {/* Categorías */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categorias.map((categoria) => {
              const activa = categoriaSeleccionada === categoria;

              return (
                <Pressable
                  key={categoria}
                  style={[
                    styles.categoryButton,
                    activa && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategoriaSeleccionada(categoria)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      activa && styles.categoryTextActive,
                    ]}
                  >
                    {categoria}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Lista */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        >
          {lugaresFiltrados.length > 0 ? (
            lugaresFiltrados.map((lugar) => (
              <Pressable
                key={lugar.id}
                style={styles.placeCard}
                onPress={() =>
                  router.push({
                    pathname: '/lugar-detalle',
                    params: { id: lugar.id },
                  })
                }
              >
                <View style={styles.placeIcon}>
                  <Text style={styles.placeIconText}>
                    {lugar.icono}
                  </Text>
                </View>

                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>
                    {lugar.nombre}
                  </Text>

                  <Text style={styles.placeCategory}>
                    {lugar.categoria}
                  </Text>

                  <Text style={styles.placeDescription}>
                    {lugar.descripcion}
                  </Text>
                </View>

                <Text style={styles.arrow}>
                  ›
                </Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔎</Text>

              <Text style={styles.emptyTitle}>
                No encontramos lugares
              </Text>

              <Text style={styles.emptyText}>
                Probá con otra búsqueda o seleccioná otra categoría.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F3E8',
  },

  container: {
    flex: 1,
    backgroundColor: '#F7F3E8',
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#DCE9E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  backIcon: {
    fontSize: 32,
    color: '#253A32',
    lineHeight: 36,
  },

  headerText: {
    flex: 1,
  },

  smallTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2F7F8F',
    letterSpacing: 1.5,
  },

  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#253A32',
    marginTop: 1,
  },

  subtitle: {
    fontSize: 14,
    color: '#77736B',
    marginTop: 8,
    marginBottom: 14,
  },

  searchContainer: {
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3E1D8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 12,
  },

  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#30352F',
  },

  categoriesWrapper: {
    height: 40,
    marginBottom: 8,
    justifyContent: 'center',
  },

  categoriesContent: {
    paddingLeft: 2,
    paddingRight: 20,
    alignItems: 'center',
  },

  categoryButton: {
    flexShrink: 0,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8D2C4',
    borderRadius: 18,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  categoryButtonActive: {
    backgroundColor: '#253A32',
    borderColor: '#253A32',
  },

  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#66635D',
  },

  categoryTextActive: {
    color: '#FFFFFF',
  },

  list: {
    paddingBottom: 30,
  },

  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E3E1D8',
  },

  placeIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#E5EFE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 13,
  },

  placeIconText: {
    fontSize: 24,
  },

  placeInfo: {
    flex: 1,
  },

  placeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#30352F',
  },

  placeCategory: {
    fontSize: 12,
    color: '#2F7F8F',
    fontWeight: '600',
    marginTop: 3,
  },

  placeDescription: {
    fontSize: 12,
    color: '#77736B',
    lineHeight: 17,
    marginTop: 4,
  },

  arrow: {
    fontSize: 28,
    color: '#2F7F8F',
    paddingLeft: 8,
  },

  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
  },

  emptyIcon: {
    fontSize: 38,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#253A32',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#77736B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});