import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type ShipmentStatus = "Processing" | "Departed" | "Delivered";

interface TrackingMapProps {
  status: ShipmentStatus;
  destinationCity?: string;
  destinationCoords?: [number, number];
}

const LOCATIONS = {
  orugodawatta: { coords: [6.9608, 79.8878] as [number, number], label: "Orugodawatta Hub" },
  bia: { coords: [7.1808, 79.8841] as [number, number], label: "BIA Airport" },
};

const DEFAULT_DESTINATION = {
  coords: [51.47, -0.4543] as [number, number],
  label: "London (LHR)",
};

function greatCirclePoints(
  start: [number, number],
  end: [number, number],
  numPoints = 100
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(start[0]), lon1 = toRad(start[1]);
  const lat2 = toRad(end[0]), lon2 = toRad(end[1]);
  const d = 2 * Math.asin(
    Math.sqrt(
      Math.pow(Math.sin((lat1 - lat2) / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon1 - lon2) / 2), 2)
    )
  );
  const points: [number, number][] = [];
  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    points.push([toDeg(Math.atan2(z, Math.sqrt(x * x + y * y))), toDeg(Math.atan2(y, x))]);
  }
  return points;
}

function createPulsingDot(color: string, size: number = 14) {
  return L.divIcon({
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      box-shadow:0 0 0 0 ${color};
      animation:pulseRing 2s ease-out infinite;
    "></div>`,
    className: "leaflet-pulsing-dot",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createPlaneIcon() {
  return L.divIcon({
    html: `<div style="font-size:28px;filter:drop-shadow(0 0 8px rgba(212,175,55,0.8));line-height:1;">✈️</div>`,
    className: "leaflet-plane-icon",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

function createLabelIcon(label: string, active: boolean) {
  return L.divIcon({
    html: `<div style="
      background:${active ? "rgba(212,175,55,0.95)" : "rgba(0,31,63,0.9)"};
      color:${active ? "#001f3f" : "#d4af37"};
      padding:4px 10px;border-radius:6px;
      font-size:11px;font-weight:600;font-family:'Space Grotesk',sans-serif;
      white-space:nowrap;border:1px solid rgba(212,175,55,0.4);
      box-shadow:0 2px 10px rgba(0,0,0,0.4);
    ">${label}</div>`,
    className: "leaflet-label-icon",
    iconSize: [0, 0],
    iconAnchor: [-12, 8],
  });
}

// Inject pulsing animation CSS
const STYLE_ID = "leaflet-tracking-styles";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes pulseRing {
      0% { box-shadow: 0 0 0 0 currentColor; opacity: 1; }
      100% { box-shadow: 0 0 0 18px transparent; opacity: 0; }
    }
    .leaflet-pulsing-dot div { color: inherit; }
    .leaflet-plane-icon { transition: transform 0.1s linear; }
    .leaflet-label-icon, .leaflet-pulsing-dot, .leaflet-plane-icon {
      background: none !important; border: none !important;
    }
  `;
  document.head.appendChild(style);
}

export function TrackingMap({ status, destinationCity, destinationCoords }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  const destination = useMemo(
    () => ({
      coords: destinationCoords ?? DEFAULT_DESTINATION.coords,
      label: destinationCity ?? DEFAULT_DESTINATION.label,
    }),
    [destinationCity, destinationCoords]
  );

  useEffect(() => {
    injectStyles();
    if (!mapRef.current) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
    }).setView([25, 40], 3);

    mapInstance.current = map;

    // Dark aviation tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: "topright" }).addTo(map);

    const { orugodawatta, bia } = LOCATIONS;

    // Ground segment: Orugodawatta → BIA
    L.polyline([orugodawatta.coords, bia.coords], {
      color: status === "Processing" ? "#d4af37" : "#335577",
      weight: 2,
      dashArray: "6 4",
      opacity: 0.7,
    }).addTo(map);

    // Flight arc: BIA → Destination
    const arcPoints = greatCirclePoints(bia.coords, destination.coords);

    // Gradient effect: draw arc in segments with varying opacity
    const segmentCount = 5;
    const segSize = Math.floor(arcPoints.length / segmentCount);
    for (let i = 0; i < segmentCount; i++) {
      const start = i * segSize;
      const end = Math.min(start + segSize + 1, arcPoints.length);
      const opacity = 0.3 + (i / segmentCount) * 0.7;
      L.polyline(arcPoints.slice(start, end), {
        color: status === "Delivered" ? "#00cc66" : "#d4af37",
        weight: 2.5,
        opacity,
        dashArray: status === "Departed" ? "8 6" : undefined,
      }).addTo(map);
    }

    // Orugodawatta marker
    const isProcessing = status === "Processing";
    L.marker(orugodawatta.coords, {
      icon: createPulsingDot(isProcessing ? "#d4af37" : "#557799", isProcessing ? 16 : 10),
    }).addTo(map);
    L.marker(orugodawatta.coords, {
      icon: createLabelIcon("Orugodawatta Hub", isProcessing),
    }).addTo(map);

    // BIA marker
    L.marker(bia.coords, {
      icon: createPulsingDot("#557799", 8),
    }).addTo(map);
    L.marker(bia.coords, {
      icon: createLabelIcon("BIA Airport", false),
    }).addTo(map);

    // Destination marker
    const isDelivered = status === "Delivered";
    L.marker(destination.coords, {
      icon: createPulsingDot(isDelivered ? "#00cc66" : "#557799", isDelivered ? 16 : 10),
    }).addTo(map);
    L.marker(destination.coords, {
      icon: createLabelIcon(destination.label, isDelivered),
    }).addTo(map);

    // Animated airplane for in-transit
    if (status === "Departed") {
      let idx = 0;
      const planeMarker = L.marker(arcPoints[0], { icon: createPlaneIcon() }).addTo(map);
      const animInterval = setInterval(() => {
        idx = (idx + 1) % arcPoints.length;
        planeMarker.setLatLng(arcPoints[idx]);
        // Rotate plane toward next point
        if (idx < arcPoints.length - 1) {
          const next = arcPoints[idx + 1];
          const curr = arcPoints[idx];
          const angle = (Math.atan2(next[1] - curr[1], next[0] - curr[0]) * 180) / Math.PI;
          const el = planeMarker.getElement();
          if (el) el.style.transform += ` rotate(${-angle + 45}deg)`;
        }
      }, 80);

      map.once("remove", () => clearInterval(animInterval));
    }

    // Fit bounds
    const allCoords = [orugodawatta.coords, bia.coords, destination.coords];
    map.fitBounds(L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1]))), {
      padding: [50, 50],
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [status, destination]);

  return (
    <div className="rounded-xl overflow-hidden border border-gold/20 shadow-lg">
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: "linear-gradient(135deg, #001f3f 0%, #002b5c 100%)" }}
      >
        <h3 className="font-display font-semibold text-sm" style={{ color: "#d4af37" }}>
          ✦ Live Flight Tracker
        </h3>
        <span className="text-xs font-mono" style={{ color: "rgba(212,175,55,0.7)" }}>
          {status === "Processing" && "● Processing at Hub"}
          {status === "Departed" && "◉ In Flight"}
          {status === "Delivered" && "✓ Delivered"}
        </span>
      </div>
      <div ref={mapRef} style={{ height: 420, width: "100%", background: "#0d1117" }} className="z-0" />
    </div>
  );
}
