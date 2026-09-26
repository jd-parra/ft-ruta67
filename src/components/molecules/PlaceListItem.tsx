import { Pressable, View, StyleSheet } from "react-native";
import { AppText } from "@/components/atoms/AppText";
import { colors, radius } from "@/theme";
import type { Place } from "@/types/place";

interface Props {
  place: Place;
  active: boolean;
  onPress: (place: Place) => void;
}

export function PlaceListItem({ place, active, onPress }: Props) {
  return (
    <Pressable
      onPress={() => onPress(place)}
      style={[styles.item, active && styles.active]}
    >
      <AppText variant="bold">
        {place.nombre} {place.nota ? "⚠️" : ""}
      </AppText>
      <View style={styles.meta}>
        <AppText variant="accent">⭐ {place.rating ?? "s/d"}</AppText>
        <AppText variant="caption" numberOfLines={1} style={styles.flex}>
          {place.horario || "horario s/d"}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    padding: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 4,
  },
  active: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  meta: { flexDirection: "row", gap: 8, marginTop: 2 },
  flex: { flex: 1 },
});
