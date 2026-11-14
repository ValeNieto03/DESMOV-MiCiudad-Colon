
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
import { useMemo, useState } from 'react';

import { useCatalogo } from '@/servicios/CatalogoProvider';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function LugaresScreen() {
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] =
    useState('Todos');

  const { lugaresDisponibles, cargandoCatalogo: cargando } =
    useCatalogo();

  const { colors } = useThemeContext();
  const router = useRouter();

  // Creamos las categorías a partir de los lugares disponibles.
  // Así también aparecen las categorías nuevas que llegan desde la API.
  const categorias = useMemo(
    () => [
      'Todos',
      ...Array.from(
        new Set(
          lugaresDisponibles
            .map((lugar) => lugar.categoria)
            .filter((categoria) => categoria.trim().length > 0)
            .sort((a, b) => a.localeCompare(b, 'es')),
        ),
      ),
    ],
    [lugaresDisponibles],
  );

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

  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },

    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      backgroundColor: colors.backgroundSelected,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },

    backIcon: {
      fontSize: 32,
      color: colors.text,
      lineHeight: 36,
    },

    headerText: {
      flex: 1,
    },

    smallTitle: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 1.5,
    },

    title: {
      fontSize: 30,
      fontWeight: '800',
      color: colors.text,
      marginTop: 1,
    },

    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 14,
    },

    searchContainer: {
      height: 48,
      backgroundColor: colors.inputBackground,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.inputBorder,
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
      color: colors.text,
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
      backgroundColor: colors.backgroundElement,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 18,
      paddingHorizontal: 15,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },

    categoryButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },

    categoryText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    categoryTextActive: {
      color: colors.onPrimary,
    },

    resultsHeader: {
      marginBottom: 8,
      paddingHorizontal: 2,
    },

    resultsText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },

    list: {
      paddingBottom: 30,
    },

    placeCard: {
      backgroundColor: colors.backgroundElement,
      borderRadius: 18,
      padding: 14,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },

    placeIcon: {
      width: 54,
      height: 54,
      borderRadius: 16,
      backgroundColor: colors.successBackground,
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
      color: colors.text,
    },

    placeCategory: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '600',
      marginTop: 3,
    },

    placeDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 17,
      marginTop: 4,
    },

    arrow: {
      fontSize: 28,
      color: colors.primary,
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
      color: colors.text,
      textAlign: 'center',
    },

    emptyText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
      lineHeight: 20,
    },

    clearButton: {
      marginTop: 18,
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 18,
    },

    clearButtonText: {
      color: colors.onPrimary,
      fontSize: 13,
      fontWeight: '700',
    },
  });

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.container}>
        {/* Encabezado */}
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Volver"
          >
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.smallTitle}>GUÍA TURÍSTICA</Text>

            <Text style={styles.title}>Lugares</Text>
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
            placeholderTextColor={colors.textSecondary}
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
            accessibilityLabel="Buscar lugares por nombre, descripción, categoría o dirección"
          />
        </View>

        {/* Categorías dinámicas */}
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
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
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

        {/* Cantidad de resultados */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {cargando
              ? 'Actualizando lugares...'
              : `${lugaresFiltrados.length} ${lugaresFiltrados.length === 1 ? 'lugar' : 'lugares'
              }`}
          </Text>
        </View>

        {/* Lista de lugares */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
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
                accessibilityRole="button"
                accessibilityLabel={`Ver detalles de ${lugar.nombre}`}
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

                  <Text
                    style={styles.placeDescription}
                    numberOfLines={3}
                  >
                    {lugar.descripcion || 'Descripción no disponible.'}
                  </Text>
                </View>

                <Text style={styles.arrow}>›</Text>
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

              {(busqueda.length > 0 ||
                categoriaSeleccionada !== 'Todos') && (
                  <Pressable
                    style={styles.clearButton}
                    onPress={() => {
                      setBusqueda('');
                      setCategoriaSeleccionada('Todos');
                    }}
                  >
                    <Text style={styles.clearButtonText}>
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
