import { View, StyleSheet } from "react-native";
import { AppText } from "@componentes/atoms/AppText";
import { Boton } from "@componentes/atoms/Boton";
import { formatearBs } from "./ContadorDia";
import { colors, radius } from "@nucleo/theme";
import type { Tarjeta } from "@nucleo/nfc/useCobrador";
import type { Categoria } from "@nucleo/types/auth";
import type { Tramo } from "@nucleo/types/paquete";

const CATEGORIA: Record<Categoria, string> = { general: "General", estudiante: "🎓 Estudiante", exonerado: "👴 Exonerado" };

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
  const color = res.ok ? colors.exito : colors.error;

  return (
    <View style={[styles.tarjeta, { borderColor: color }]}>
      {res.ok ? (
        <>
          <AppText style={[styles.monto, { color }]}>✅ {formatearBs(res.cobro.monto)}</AppText>
          <AppText style={styles.linea}>{p.tarjeta.nombre ?? "Pasajero"}</AppText>
          <AppText style={styles.linea}>{CATEGORIA[res.categoriaAplicada]}</AppText>
          <AppText style={styles.linea}>{res.tramo.nombre}</AppText>
          <EstadoSubida {...p} />

          {p.procesando ? (
            <AppText variant="etiqueta">Corrigiendo…</AppText>
          ) : p.eligiendo ? (
            <View style={styles.acciones}>
              <AppText variant="etiqueta">Cobrar de nuevo con otro tramo:</AppText>
              {p.tramos
                .filter((t) => t.codigo !== res.tramo.codigo)
                .map((t) => (
                  <Boton key={t.codigo} titulo={t.nombre} onPress={() => p.onElegirTramo(t.codigo)} />
                ))}
              <Boton titulo="Cancelar" secundario onPress={p.onCancelarCorreccion} />
            </View>
          ) : (
            <View style={styles.acciones}>
              <Boton titulo="Corregir" secundario onPress={p.onCorregir} />
              {res.categoriaAplicada !== "general" && <Boton titulo="Cobrar como general" secundario onPress={p.onComoGeneral} />}
            </View>
          )}
        </>
      ) : (
        <>
          <AppText style={[styles.monto, { color }]}>❌ {res.mensaje}</AppText>
          <AppText variant="etiqueta">{res.codigo}</AppText>
        </>
      )}
    </View>
  );
}

function EstadoSubida({ tarjeta }: Props) {
  if (tarjeta.mensajeSubida && tarjeta.subida !== "rechazado") {
    return <AppText style={{ color: colors.error }}>{tarjeta.mensajeSubida}</AppText>;
  }
  const texto = {
    subiendo: "Subiendo…",
    pendiente: "Sin conexión: se subirá después",
    ok: "Registrado",
    rechazado: `El servidor lo rechazó: ${tarjeta.mensajeSubida ?? ""}`,
  }[tarjeta.subida];
  return <AppText variant="etiqueta" style={tarjeta.subida === "rechazado" ? { color: colors.error } : undefined}>{texto}</AppText>;
}

const styles = StyleSheet.create({
  tarjeta: { borderWidth: 3, borderRadius: radius.md, padding: 16, gap: 4, backgroundColor: colors.blanco },
  monto: { fontSize: 28, fontWeight: "800" },
  linea: { fontSize: 18 },
  acciones: { gap: 8, marginTop: 8 },
});
