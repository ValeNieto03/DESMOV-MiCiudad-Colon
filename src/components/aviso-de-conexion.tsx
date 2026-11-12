import { useThemeContext } from "@/contexts/theme-context";
import { useNetworkState } from "expo-network";
import { StyleSheet, Text, View } from "react-native";

export default function AvisoDeConexion() {
  const { colors } = useThemeContext();
  const red = useNetworkState();
  const sinConexion =
    red.isConnected === false || red.isInternetReachable === false;

  if (!sinConexion) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.aviso, { backgroundColor: colors.warningBackground }]}
    >
      <Text style={[styles.texto, { color: colors.text }]}>
        Sin conexión a internet. Algunas funciones pueden no estar disponibles.
      </Text>
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
