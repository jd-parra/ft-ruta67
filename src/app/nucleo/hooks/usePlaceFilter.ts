import { useMemo, useState } from "react";
import { PLACES } from "@nucleo/data/places";

export function usePlaceFilter() {
  const [query, setQuery] = useState("");
  const [onlyWarnings, setOnlyWarnings] = useState(false);

  const places = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PLACES.filter(
      (p) =>
        (!q || p.nombre.toLowerCase().includes(q)) &&
        (!onlyWarnings || !!p.nota)
    );
  }, [query, onlyWarnings]);

  return { places, query, setQuery, onlyWarnings, setOnlyWarnings };
}
