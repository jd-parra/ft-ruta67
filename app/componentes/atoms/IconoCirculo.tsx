import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@nucleo/theme";

interface Props {
  nombre: keyof typeof Ionicons.glyphMap;
  color?: string;
  fondo?: string;
  tamano?: number;
}

/** Icono dentro de un círculo de color (filas de listas, avisos, accesos). */
export function IconoCirculo({ nombre, color = colors.primario, fondo = colors.primarioClaro, tamano = 40 }: Props) {
  return (
    <View style={{ width: tamano, height: tamano, borderRadius: tamano / 2, backgroundColor: fondo, alignItems: "center", justifyContent: "center" }}>
      <Ionicons name={nombre} size={tamano * 0.5} color={color} />
    </View>
  );
}
