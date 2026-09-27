import { useContext, type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { colors } from "@nucleo/theme";

interface Props {
  titulo?: string;
  subtitulo?: string;
  /** Muestra la flecha para volver. */
  onAtras?: () => void;
  /** Botón a la derecha del título (p. ej. cerrar sesión). */
  derecha?: ReactNode;
  children: ReactNode;
  /** Contenido fijo abajo (botón principal). */
  pie?: ReactNode;
  refrescando?: boolean;
  onRefrescar?: () => void;
}

/** Plantilla común: área segura, encabezado, scroll con "tirar para refrescar" y pie opcional. */
export function Pantalla({ titulo, subtitulo, onAtras, derecha, children, pie, refrescando, onRefrescar }: Props) {
  // La app va de borde a borde: fuera de las pestañas, la barra de Android tapa lo de abajo.
  // Dentro de las pestañas ese espacio ya lo deja la barra de pestañas.
  const dentroDeTabs = useContext(BottomTabBarHeightContext) !== undefined;
  const insets = useSafeAreaInsets();
  const abajo = dentroDeTabs ? 0 : insets.bottom;

  return (
    <SafeAreaView style={styles.raiz} edges={["top"]}>
      <KeyboardAvoidingView style={styles.raiz} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={[styles.contenido, !pie && { paddingBottom: 32 + abajo }]}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefrescar ? (
              <RefreshControl refreshing={!!refrescando} onRefresh={onRefrescar} colors={[colors.primario]} tintColor={colors.primario} />
            ) : undefined
          }
        >
          {(titulo || onAtras || derecha) && (
            <View style={styles.encabezado}>
              {onAtras && (
                <Pressable onPress={onAtras} hitSlop={12} accessibilityRole="button" accessibilityLabel="Volver" style={styles.atras}>
                  <Ionicons name="chevron-back" size={24} color={colors.primarioOscuro} />
                </Pressable>
              )}
              <View style={styles.titulos}>
                {titulo && <AppText variant="titulo">{titulo}</AppText>}
                {subtitulo && <AppText style={styles.subtitulo}>{subtitulo}</AppText>}
              </View>
              {derecha}
            </View>
          )}
          {children}
        </ScrollView>
        {pie && <View style={[styles.pie, { paddingBottom: 20 + abajo }]}>{pie}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colors.fondo },
  contenido: { padding: 20, gap: 16, paddingBottom: 32 },
  encabezado: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  atras: { marginLeft: -6 },
  titulos: { flex: 1, gap: 2 },
  subtitulo: { color: colors.textoSuave },
  pie: { paddingHorizontal: 20, paddingTop: 12, backgroundColor: colors.fondo, borderTopWidth: 1, borderTopColor: colors.borde },
});
