import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { IconoCirculo } from "@componentes/atoms/IconoCirculo";
import { CATEGORIAS, formatearBs } from "@componentes/formato";
import { colors, radius, sombra } from "@nucleo/theme";
import type { EstadoSubida as Subida, Tarjeta } from "@hooks/useCobrador";
import type { Tramo } from "@nucleo/types/paquete";

interface Props {
  tarjeta: Tarjeta;
  tramos: Tramo[];
  eligiendo: boolean;
  procesando: boolean;
  onCorregir: () => void;
  onElegirTramo: (tramoCodigo: number) => void;
  onCancelarCorreccion: () => void;
  onComoGeneral: () => void;
}

/** Resultado del toque (3 s): verde si cobró, rojo si no. */
export function TarjetaResultado(p: Props) {
  const { res } = p.tarjeta;

  if (!res.ok) {
    return (
      <View style={[styles.tarjeta, { borderColor: colors.error }]}>
        <View style={styles.cabecera}>
          <IconoCirculo nombre="close" color={colors.blanco} fondo={colors.error} tamano={48} />
          <View style={styles.flex}>
            <AppText style={[styles.titulo, { color: colors.error }]}>{res.mensaje}</AppText>
            <AppText variant="etiqueta">{res.codigo}</AppText>
          </View>
        </View>
      </View>
    );
  }

  const categoria = CATEGORIAS[res.categoriaAplicada];
  return (
    <View style={[styles.tarjeta, { borderColor: colors.exito }]}>
      <View style={styles.cabecera}>
        <IconoCirculo nombre="checkmark" color={colors.blanco} fondo={colors.exito} tamano={48} />
        <View style={styles.flex}>
          <AppText style={[styles.monto, { color: colors.exito }]}>
            {res.cobro.monto === 0 ? "Gratis" : formatearBs(res.cobro.monto)}
          </AppText>
          <AppText style={styles.titulo}>{p.tarjeta.nombre ?? "Pasajero"}</AppText>
        </View>
      </View>

      <View style={styles.datos}>
        <Dato icono={categoria.icono} texto={categoria.nombre} />
        <Dato icono="git-branch-outline" texto={res.tramo.nombre} />
      </View>

      <EstadoSubida {...p} />

      {p.procesando ? (
        <AppText variant="etiqueta">Corrigiendo…</AppText>
      ) : p.eligiendo ? (
        <View style={styles.acciones}>
          <AppText variant="etiqueta">Cobrar de nuevo con otra ruta:</AppText>
          {p.tramos
            .filter((t) => t.codigo !== res.tramo.codigo)
            .map((t) => (
              <Boton key={t.codigo} titulo={t.nombre} onPress={() => p.onElegirTramo(t.codigo)} />
            ))}
          <Boton titulo="Cancelar" secundario onPress={p.onCancelarCorreccion} />
        </View>
      ) : (
        <View style={styles.acciones}>
          <Boton titulo="Corregir" secundario icono="create-outline" onPress={p.onCorregir} />
          {res.categoriaAplicada !== "general" && (
            <Boton titulo="Cobrar como general" secundario icono="person-outline" onPress={p.onComoGeneral} />
          )}
        </View>
      )}
    </View>
  );
}

function Dato({ icono, texto }: { icono: keyof typeof Ionicons.glyphMap; texto: string }) {
  return (
    <View style={styles.dato}>
      <Ionicons name={icono} size={16} color={colors.primarioOscuro} />
      <AppText style={styles.datoTexto}>{texto}</AppText>
    </View>
  );
}

const SUBIDA: Record<Subida, { icono: keyof typeof Ionicons.glyphMap; color: string; texto: string }> = {
  subiendo: { icono: "cloud-upload-outline", color: colors.textoSuave, texto: "Subiendo…" },
  pendiente: { icono: "cloud-offline-outline", color: colors.aviso, texto: "Sin conexión: se subirá después" },
  ok: { icono: "cloud-done-outline", color: colors.exito, texto: "Registrado" },
  rechazado: { icono: "alert-circle-outline", color: colors.error, texto: "El servidor lo rechazó" },
};

function EstadoSubida({ tarjeta }: Props) {
  if (tarjeta.mensajeSubida && tarjeta.subida !== "rechazado") {
    return <AppText style={{ color: colors.error }}>{tarjeta.mensajeSubida}</AppText>;
  }
  const s = SUBIDA[tarjeta.subida];
  const texto = tarjeta.subida === "rechazado" ? `${s.texto}: ${tarjeta.mensajeSubida ?? ""}` : s.texto;
  return (
    <View style={styles.dato}>
      <Ionicons name={s.icono} size={16} color={s.color} />
      <AppText variant="etiqueta" style={{ color: s.color, opacity: 1 }}>{texto}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 2, borderRadius: radius.lg, padding: 16, gap: 12, backgroundColor: colors.blanco, ...sombra },
  cabecera: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1, gap: 2 },
  monto: { fontSize: 40, fontWeight: "800", lineHeight: 46 },
  titulo: { fontSize: 17, fontWeight: "600" },
  datos: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dato: { flexDirection: "row", alignItems: "center", gap: 6 },
  datoTexto: { color: colors.primarioOscuro, fontWeight: "600" },
  acciones: { gap: 8 },
});
