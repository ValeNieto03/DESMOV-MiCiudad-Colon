import { useThemedStyles } from "@/hooks/use-theme";

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
import { useEffect, useState } from 'react';

import { lugares } from '@/data/lugares';
import type { Place } from '@/data/lugares';
import { obtenerLugaresIntegrados } from '@/servicios/lugares-integrados';
import { useThemeContext } from '@/contexts/theme-context';

export default function LugaresScreen() {
  const themedStyles = useThemedStyles(styles);
  const { colors } = useThemeContext();
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState('Todos');
  const [lugaresDisponibles, setLugaresDisponibles] =
    useState<Place[]>(lugares);
  const [cargando, setCargando] = useState(true);

  const router = useRouter();

  useEffect(() => {
    let activo = true;

    async function cargarLugares() {
      try {
        const resultado = await obtenerLugaresIntegrados();

        if (activo) {
          setLugaresDisponibles(resultado);
        }
      } catch (error) {
        console.warn('No se pudieron cargar los lugares:', error);

        if (activo) {
          setLugaresDisponibles(lugares);
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    cargarLugares();

    return () => {
      activo = false;
    };
  }, []);

  // Creamos las categorías a partir de los lugares disponibles.
  // Así también aparecen las categorías nuevas que llegan desde la API.
  const categorias = [
    'Todos',
    ...Array.from(
      new Set(
        lugaresDisponibles
          .map((lugar) => lugar.categoria)
          .filter((categoria) => categoria.trim().length > 0)
          .sort((a, b) => a.localeCompare(b, 'es')),
      ),
    ),
  ];

  const lugaresFiltrados = lugaresDisponibles.filter((lugar) => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      lugar.nombre.toLowerCase().includes(textoBusqueda) ||
      lugar.descripcion.toLowerCase().includes(textoBusqueda) ||
      lugar.categoria.toLowerCase().includes(textoBusqueda) ||
      lugar.direccion.toLowerCase().includes(textoBusqueda);

    const coincideCategoria =
      categoriaSeleccionada === 'Todos' ||
      lugar.categoria === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });

  return (
    <View style={[themedStyles.screen, { backgroundColor: colors.background }]}>
      <SafeAreaView
        style={[themedStyles.container, { backgroundColor: colors.background }]}
      >
        {/* Encabezado */}
        <View style={themedStyles.header}>
          <Pressable
            style={[themedStyles.backButton, { backgroundColor: colors.backgroundSelected }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={[themedStyles.backIcon, { color: colors.text }]}>‹</Text>
          </Pressable>

          <View style={themedStyles.headerText}>
            <Text style={[themedStyles.smallTitle, { color: colors.primary }]}>GUÍA TURÍSTICA</Text>

            <Text style={[themedStyles.title, { color: colors.text }]}>Lugares</Text>
          </View>
        </View>

        <Text style={[themedStyles.subtitle, { color: colors.textSecondary }]}>
          Descubrí lugares para conocer en Colón
        </Text>

        {/* Buscador */}
        <View
          style={[
            themedStyles.searchContainer,
            {
              backgroundColor: colors.inputBackground,
              borderColor: colors.inputBorder,
            },
          ]}
        >
          <Text style={themedStyles.searchIcon}>🔍</Text>

          <TextInput
            style={[themedStyles.searchInput, { color: colors.text }]}
            placeholder="Buscar lugares..."
            placeholderTextColor={colors.textSecondary}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            accessibilityLabel="Buscar lugares por nombre, descripción, categoría o dirección"
          />
        </View>

        {/* Categorías dinámicas */}
        <View style={themedStyles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={themedStyles.categoriesContent}
          >
            {categorias.map((categoria) => {
              const activa = categoriaSeleccionada === categoria;

              return (
                <Pressable
                  key={categoria}
                  style={[
                    themedStyles.categoryButton,
                    {
                      backgroundColor: colors.backgroundElement,
                      borderColor: colors.border,
                    },
                    activa && {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={() => setCategoriaSeleccionada(categoria)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                >
                  <Text
                    style={[
                      themedStyles.categoryText,
                      { color: activa ? colors.onPrimary : colors.textSecondary },
                    ]}
                  >
                    {categoria}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Cantidad de resultados */}
        <View style={themedStyles.resultsHeader}>
          <Text style={[themedStyles.resultsText, { color: colors.textSecondary }]}>
            {cargando
              ? 'Actualizando lugares...'
              : `${lugaresFiltrados.length} ${lugaresFiltrados.length === 1 ? 'lugar' : 'lugares'
              }`}
          </Text>
        </View>

        {/* Lista de lugares */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={themedStyles.list}
          keyboardShouldPersistTaps="handled"
        >
          {lugaresFiltrados.length > 0 ? (
            lugaresFiltrados.map((lugar) => (
              <Pressable
                key={lugar.id}
                style={[
                  themedStyles.placeCard,
                  {
                    backgroundColor: colors.backgroundElement,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() =>
                  router.push({
                    pathname: '/lugar-detalle',
                    params: { id: lugar.id },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Ver detalles de ${lugar.nombre}`}
              >
                <View
                  style={[themedStyles.placeIcon, { backgroundColor: colors.successBackground }]}
                >
                  <Text style={themedStyles.placeIconText}>
                    {lugar.icono}
                  </Text>
                </View>

                <View style={themedStyles.placeInfo}>
                  <Text style={[themedStyles.placeName, { color: colors.text }]}>
                    {lugar.nombre}
                  </Text>

                  <Text style={[themedStyles.placeCategory, { color: colors.primary }]}>
                    {lugar.categoria}
                  </Text>

                  <Text
                    style={[themedStyles.placeDescription, { color: colors.textSecondary }]}
                    numberOfLines={3}
                  >
                    {lugar.descripcion || 'Descripción no disponible.'}
                  </Text>
                </View>

                <Text style={[themedStyles.arrow, { color: colors.primary }]}>›</Text>
              </Pressable>
            ))
          ) : (
            <View style={themedStyles.emptyContainer}>
              <Text style={themedStyles.emptyIcon}>🔎</Text>

              <Text style={[themedStyles.emptyTitle, { color: colors.text }]}>
                No encontramos lugares
              </Text>

              <Text style={[themedStyles.emptyText, { color: colors.textSecondary }]}>
                Probá con otra búsqueda o seleccioná otra categoría.
              </Text>

              {(busqueda.length > 0 ||
                categoriaSeleccionada !== 'Todos') && (
                  <Pressable
                    style={[themedStyles.clearButton, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      setBusqueda('');
                      setCategoriaSeleccionada('Todos');
                    }}
                  >
                    <Text style={[themedStyles.clearButtonText, { color: colors.onPrimary }]}>
                      Limpiar filtros
                    </Text>
                  </Pressable>
                )}
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
    minHeight: 36,
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

  resultsHeader: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },

  resultsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#77736B',
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

  clearButton: {
    marginTop: 18,
    backgroundColor: '#253A32',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },

  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
