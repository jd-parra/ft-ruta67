import { Marker, Callout } from "react-native-maps";
import { View, StyleSheet } from "react-native";
import { AppText } from "@/components/atoms/AppText";
import { Dot } from "@/components/atoms/Dot";
import { colors, precisionColor, precisionLabel } from "@/theme";
import type { Place } from "@/types/place";

interface Props {
  place: Place;
  onPress: (place: Place) => void;
}

export function PlaceMarker({ place, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: place.lat, longitude: place.lng }}
      anchor={{ x: 0.5, y: 0.5 }}
      onPress={() => onPress(place)}
    >
      <Dot color={precisionColor[place.precision]} size={18} bordered />
      <Callout tooltip={false}>
        <View style={styles.callout}>
          <AppText variant="bold">{place.nombre}</AppText>
          <AppText>
            ⭐ {place.rating ?? "s/d"}
            {place.telefono ? ` · 📞 ${place.telefono}` : ""}
          </AppText>
          <AppText variant="caption">{place.direccion}</AppText>
          {place.horario && <AppText>🕐 {place.horario}</AppText>}
          {place.nota && <AppText style={styles.warn}>{place.nota}</AppText>}
          <AppText variant="caption">
            Ubicación: {precisionLabel[place.precision]}
          </AppText>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  callout: { width: 230, gap: 2 },
  warn: { color: colors.warn, fontSize: 12 },
});
