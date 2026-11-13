import { useThemeContext } from "@/contexts/theme-context";
import { consultarAPI } from "@/servicios/api";
import { useNetworkState } from "expo-network";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

export default function AvisoDeConexion() {
  const { colors } = useThemeContext();
  const red = useNetworkState();
  const [apiDisponible, setApiDisponible] = useState<boolean | null>(null);
  const sinInternet =
    red.isConnected === false || red.isInternetReachable === false;

  useEffect(() => {
    let activo = true;

    async function verificarAPI() {
      const controlador = new AbortController();
      const tiempoLimite = setTimeout(() => controlador.abort(), 8000);

      try {
        const respuesta = await consultarAPI<{ estado: string }>("/salud", {
          signal: controlador.signal,
        });

        if (activo) setApiDisponible(respuesta.estado === "ok");
      } catch {
        if (activo) setApiDisponible(false);
      } finally {
        clearTimeout(tiempoLimite);
      }
    }

    verificarAPI();
    const intervalo = setInterval(verificarAPI, 15000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, []);

  if (!sinInternet && apiDisponible !== false) return null;

  const mensaje = sinInternet
    ? "No hay conexión a internet. Algunas funciones pueden no estar disponibles."
    : "No se puede conectar con el servidor. Comuniquese con Administración";

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.aviso, { backgroundColor: colors.warningBackground }]}
    >
      <Text style={[styles.texto, { color: colors.text }]}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aviso: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  texto: {
    fontSize: 14,
    textAlign: "center",
  },
});
