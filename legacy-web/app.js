// Centro aproximado de Ejido, Mérida
const EJIDO_CENTER = [8.5445, -71.2420];

const map = L.map("map", { zoomControl: true }).setView(EJIDO_CENTER, 15);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const PRECISION_COLOR = {
  plus_code: "#2f7d4f",
  exacta: "#2f7d4f",
  coordenadas_gps: "#2f6fa8",
  aproximada: "#c1440e",
};

function makeIcon(precision) {
  const color = PRECISION_COLOR[precision] || "#555";
  return L.divIcon({
    className: "",
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:${color};border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function popupHtml(p) {
  let html = `<div class="popup-name">${escapeHtml(p.nombre)}</div>`;
  html += `<div class="popup-row">⭐ ${p.rating ?? "s/d"}${p.telefono ? " · 📞 " + escapeHtml(p.telefono) : ""}</div>`;
  html += `<div class="popup-row muted">${escapeHtml(p.direccion)}</div>`;
  if (p.horario) html += `<div class="popup-row">🕐 ${escapeHtml(p.horario)}</div>`;
  if (p.nota) html += `<div class="popup-warn">${escapeHtml(p.nota)}</div>`;
  html += `<div class="popup-precision">Ubicación: ${precisionLabel(p.precision)}</div>`;
  return html;
}

function precisionLabel(precision) {
  switch (precision) {
    case "plus_code": return "Plus Code decodificado";
    case "coordenadas_gps": return "Coordenadas GPS del PDF";
    case "aproximada": return "Aproximada (calle / centro comercial)";
    default: return "Exacta";
  }
}

const markers = new Map(); // nombre -> marker
const markerGroup = L.layerGroup().addTo(map);

PLACES.forEach((p) => {
  const marker = L.marker([p.lat, p.lng], { icon: makeIcon(p.precision) });
  marker.bindPopup(popupHtml(p));
  marker.addTo(markerGroup);
  markers.set(p.nombre, marker);
});

// --- Sidebar list ---
const listEl = document.getElementById("place-list");
const searchEl = document.getElementById("search");
const warnFilterEl = document.getElementById("filter-warnings");
const countEl = document.getElementById("count");

function renderList() {
  const query = searchEl.value.trim().toLowerCase();
  const onlyWarnings = warnFilterEl.checked;

  const filtered = PLACES.filter((p) => {
    const matchesQuery = !query || p.nombre.toLowerCase().includes(query);
    const matchesWarn = !onlyWarnings || !!p.nota;
    return matchesQuery && matchesWarn;
  });

  countEl.textContent = filtered.length;
  listEl.innerHTML = "";

  filtered.forEach((p) => {
    const li = document.createElement("li");
    li.className = "place-item";
    li.dataset.nombre = p.nombre;

    const warnBadge = p.nota ? `<span class="warn" title="${escapeHtml(p.nota)}">⚠️</span>` : "";

    li.innerHTML = `
      <div class="name">${escapeHtml(p.nombre)} ${warnBadge}</div>
      <div class="meta">
        <span class="rating">⭐ ${p.rating ?? "s/d"}</span>
        <span>${escapeHtml(p.horario || "horario s/d")}</span>
      </div>
    `;

    li.addEventListener("click", () => {
      map.flyTo([p.lat, p.lng], 17, { duration: 0.6 });
      markers.get(p.nombre).openPopup();
      document.querySelectorAll(".place-item.active").forEach((el) => el.classList.remove("active"));
      li.classList.add("active");
    });

    listEl.appendChild(li);
  });
}

searchEl.addEventListener("input", renderList);
warnFilterEl.addEventListener("change", renderList);

renderList();
