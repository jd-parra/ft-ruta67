import { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { UrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import { PlaceMarker } from "@nucleo/components/molecules/PlaceMarker";
import { EJIDO_CENTER } from "@nucleo/theme";
import type { Place } from "@nucleo/types/place";

export interface PlaceMapHandle {
  focusOn: (place: Place) => void;
}

interface Props {
  places: Place[];
  onSelect: (place: Place) => void;
}

// Tiles de OpenStreetMap: no requiere API key de Google en Android.
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const PlaceMap = forwardRef<PlaceMapHandle, Props>(function PlaceMap(
  { places, onSelect },
  ref
) {
  const mapRef = useRef<MapView>(null);

  useImperativeHandle(ref, () => ({
    focusOn: (place) =>
      mapRef.current?.animateToRegion(
        {
          latitude: place.lat,
          longitude: place.lng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        600
      ),
  }));

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_DEFAULT}
      mapType="none"
      initialRegion={{ ...EJIDO_CENTER, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
    >
      <UrlTile urlTemplate={OSM_TILES} maximumZ={19} flipY={false} />
      {places.map((p) => (
        <PlaceMarker key={p.nombre} place={p} onPress={onSelect} />
      ))}
    </MapView>
  );
});
