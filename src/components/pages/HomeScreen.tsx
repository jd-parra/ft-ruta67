import { useRef, useState } from "react";
import { MapTemplate } from "@/components/templates/MapTemplate";
import { PlaceMap, type PlaceMapHandle } from "@/components/organisms/PlaceMap";
import { Legend } from "@/components/organisms/Legend";
import { PlacesPanel } from "@/components/organisms/PlacesPanel";
import { usePlaceFilter } from "@/hooks/usePlaceFilter";
import type { Place } from "@/types/place";

export function HomeScreen() {
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
