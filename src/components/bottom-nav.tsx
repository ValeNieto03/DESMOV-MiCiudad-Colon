import { useThemeContext } from "@/contexts/theme-context";
import { obtenerRolActual } from "@/servicios/autenticacion";
import { router, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Rol = "admin" | "turista" | null;

export default function BottomNav() {
  const pathname = usePathname();
  const [rol, setRol] = useState<Rol>(null);
  const [verificandoRol, setVerificandoRol] = useState(true);
  const { colors } = useThemeContext();

  useEffect(() => {
    let activo = true;

    async function cargarRol() {
      setVerificandoRol(true);

      try {
        const rolActual = await obtenerRolActual();

        if (activo) {
          setRol(rolActual);
        }
      } catch {
        if (activo) {
          setRol(null);
        }
      } finally {
        if (activo) {
          setVerificandoRol(false);
        }
      }
    }

    cargarRol();

    return () => {
      activo = false;
    };
  }, [pathname]);

  // No mostrar la barra en las pantallas de autenticación.
  if (pathname === "/login" || pathname === "/registro" || verificandoRol) {
    return null;
  }

  const opciones = [
    {
      titulo: "Mapa",
      icono: "🗺️",
      ruta: "/",
    },
    {
      titulo: "Mi recorrido",
      icono: "🧭",
      ruta: "/mi-recorrido",
    },
    {
      titulo: "Mi perfil",
      icono: "👤",
      ruta: "/yo",
    },
    rol === "admin"
      ? {
          titulo: "Administración",
          icono: "⚙️",
          ruta: "/administracion",
        }
      : {
          titulo: "Agenda",
          icono: "📅",
          ruta: "/agenda",
        },
  ];

  return (
    <View
      style={[
        styles.contenedor,
        {
          backgroundColor: colors.backgroundElement,
          borderTopColor: colors.backgroundSelected,
        },
      ]}
    >
      {opciones.map((opcion) => {
        const activo =
          pathname === opcion.ruta ||
          (opcion.ruta !== "/" && pathname.startsWith(`${opcion.ruta}/`));

        return (
          <Pressable
            key={opcion.ruta}
            style={styles.opcion}
            onPress={() => router.push(opcion.ruta as any)}
          >
            <Text style={styles.icono}>{opcion.icono}</Text>

            <Text
              style={[
                styles.texto,
                activo && styles.textoActivo,
                {
                  color: activo ? colors.text : colors.textSecondary,
                },
              ]}
              numberOfLines={1}
            >
              {opcion.titulo}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    height: 70,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8E5DD",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 5,
  },
  opcion: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  icono: {
    fontSize: 20,
  },
  texto: {
    fontSize: 10,
    color: "#77736B",
    fontWeight: "600",
  },
  textoActivo: {
    color: "#253A32",
    fontWeight: "800",
  },
});
