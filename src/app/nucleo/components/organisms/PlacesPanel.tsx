import { FlatList, View, StyleSheet } from "react-native";
import { AppText } from "@nucleo/components/atoms/AppText";
import { SearchField } from "@nucleo/components/atoms/SearchField";
import { WarningFilter } from "@nucleo/components/molecules/WarningFilter";
import { PlaceListItem } from "@nucleo/components/molecules/PlaceListItem";
import { colors, spacing } from "@nucleo/theme";
import type { Place } from "@nucleo/types/place";

interface Props {
  places: Place[];
  selected: Place | null;
  query: string;
  onlyWarnings: boolean;
  onQueryChange: (q: string) => void;
  onWarningsChange: (v: boolean) => void;
  onSelect: (place: Place) => void;
}

export function PlacesPanel({
  places,
  selected,
  query,
  onlyWarnings,
  onQueryChange,
  onWarningsChange,
  onSelect,
}: Props) {
  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <AppText variant="title">Restaurantes en Ejido</AppText>
        <AppText variant="caption" style={styles.subtitle}>
          Mérida, Venezuela · {places.length} lugares
        </AppText>
        <SearchField
          value={query}
          onChangeText={onQueryChange}
          placeholder="Buscar por nombre..."
        />
        <WarningFilter value={onlyWarnings} onChange={onWarningsChange} />
      </View>
      <FlatList
        data={places}
        keyExtractor={(p) => p.nombre}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <PlaceListItem
            place={item}
            active={selected?.nombre === item.nombre}
            onPress={onSelect}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.panel, flex: 1 },
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subtitle: { marginBottom: 10 },
  list: { padding: spacing.sm },
});
