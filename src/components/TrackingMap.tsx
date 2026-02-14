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
  coords: [51.4700, -0.4543] as [number, number], // London Heathrow
  label: "London (LHR)",
};

/** Generate points along a great circle arc */
function greatCirclePoints(
  start: [number, number],
  end: [number, number],
  numPoints = 100
): [number, number][] {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const lat1 = toRad(start[0]);
  const lon1 = toRad(start[1]);
  const lat2 = toRad(end[0]);
  const lon2 = toRad(end[1]);

  const d =
    2 *
    Math.asin(
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
    const lat = toDeg(Math.atan2(z, Math.sqrt(x * x + y * y)));
    const lon = toDeg(Math.atan2(y, x));
    points.push([lat, lon]);
  }
  return points;
}

function createIcon(emoji: string, size: number = 28) {
  return L.divIcon({
    html: `<span style="font-size:${size}px;line-height:1">${emoji}</span>`,
    className: "leaflet-emoji-icon",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

export function TrackingMap({
  status,
  destinationCity,
  destinationCoords,
}: TrackingMapProps) {
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
    if (!mapRef.current) return;

    // Clean up previous map
    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const map = L.map(mapRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView([25, 40], 3);

    mapInstance.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const { orugodawatta, bia } = LOCATIONS;

    // --- Ground segment: Orugodawatta → BIA (straight line) ---
    const groundLine = L.polyline([orugodawatta.coords, bia.coords], {
      color: status === "Processing" ? "hsl(28,85%,53%)" : "hsl(215,55%,40%)",
      weight: 3,
      dashArray: status === "Processing" ? "8 6" : undefined,
    }).addTo(map);

    // --- Flight segment: BIA → Destination (great circle) ---
    const arcPoints = greatCirclePoints(bia.coords, destination.coords);
    const flightLine = L.polyline(arcPoints, {
      color:
        status === "Delivered"
          ? "hsl(155,60%,45%)"
          : status === "Departed"
          ? "hsl(215,55%,50%)"
          : "hsl(220,20%,75%)",
      weight: 3,
      dashArray: status === "Departed" ? "10 8" : undefined,
    }).addTo(map);

    // --- Markers ---

    // Orugodawatta
    const orugodawattaMarker = L.marker(orugodawatta.coords, {
      icon: createIcon("📦", status === "Processing" ? 34 : 24),
    })
      .bindPopup(`<b>${orugodawatta.label}</b><br/>Origin Hub`)
      .addTo(map);

    if (status === "Processing") {
      orugodawattaMarker.openPopup();
    }

    // BIA Airport
    L.marker(bia.coords, {
      icon: createIcon("🛫", 24),
    })
      .bindPopup(`<b>${bia.label}</b><br/>Departure Airport`)
      .addTo(map);

    // Destination
    const destMarker = L.marker(destination.coords, {
      icon: createIcon(status === "Delivered" ? "✅" : "📍", status === "Delivered" ? 34 : 24),
    })
      .bindPopup(`<b>${destination.label}</b><br/>Destination`)
      .addTo(map);

    if (status === "Delivered") {
      destMarker.openPopup();
    }

    // Airplane in-flight
    if (status === "Departed") {
      // Place airplane ~40% along the arc
      const midIdx = Math.floor(arcPoints.length * 0.4);
      const planeCoords = arcPoints[midIdx];

      const planeMarker = L.marker(planeCoords, {
        icon: createIcon("✈️", 32),
      })
        .bindPopup("<b>In Transit</b><br/>Aircraft en route")
        .addTo(map);

      planeMarker.openPopup();
    }

    // Fit bounds
    const allCoords = [orugodawatta.coords, bia.coords, destination.coords];
    map.fitBounds(L.latLngBounds(allCoords.map((c) => L.latLng(c[0], c[1]))), {
      padding: [40, 40],
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [status, destination]);

  return (
    <div className="rounded-2xl border border-border overflow-hidden">
      <div className="bg-card px-6 py-3 border-b border-border flex items-center justify-between">
        <h3 className="font-display font-semibold text-card-foreground text-sm">
          Live Tracking Map
        </h3>
        <span className="text-xs text-muted-foreground">
          {status === "Processing" && "📦 Processing at Hub"}
          {status === "Departed" && "✈️ In Flight"}
          {status === "Delivered" && "✅ Delivered"}
        </span>
      </div>
      <div
        ref={mapRef}
        style={{ height: 380, width: "100%" }}
        className="z-0"
      />
    </div>
  );
}
