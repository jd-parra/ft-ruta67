import { useRef, useState } from "react";
import { MapTemplate } from "@nucleo/components/templates/MapTemplate";
import { PlaceMap, type PlaceMapHandle } from "@nucleo/components/organisms/PlaceMap";
import { Legend } from "@nucleo/components/organisms/Legend";
import { PlacesPanel } from "@nucleo/components/organisms/PlacesPanel";
import { usePlaceFilter } from "@nucleo/hooks/usePlaceFilter";
import type { Place } from "@nucleo/types/place";

export function MapaScreen() {
  const mapRef = useRef<PlaceMapHandle>(null);
  const [selected, setSelected] = useState<Place | null>(null);
  const { places, query, setQuery, onlyWarnings, setOnlyWarnings } = usePlaceFilter();

  const handleSelect = (place: Place) => {
    setSelected(place);
    mapRef.current?.focusOn(place);
  };

  return (
    <MapTemplate
      map={
        <>
          <PlaceMap ref={mapRef} places={places} onSelect={setSelected} />
          <Legend />
        </>
      }
      panel={
        <PlacesPanel
          places={places}
          selected={selected}
          query={query}
          onlyWarnings={onlyWarnings}
          onQueryChange={setQuery}
          onWarningsChange={setOnlyWarnings}
          onSelect={handleSelect}
        />
      }
    />
  );
}
