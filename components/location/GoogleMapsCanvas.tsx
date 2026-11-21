"use client";
import { useEffect } from "react";
import { APIProvider, Map as GoogleMap, Marker, useMap } from "@vis.gl/react-google-maps";
import { resolveMapsAdapter } from "@/packages/maps/src";
import type { MapCoordinate, MapEvent, MapMarker, MapPolygon, MapPolyline, MapsRuntimeConfig } from "@/packages/maps/src";

function MapOverlays({ routes, polygons }: { routes: MapPolyline[]; polygons: MapPolygon[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const lines: google.maps.Polyline[] = [];
    const areas: google.maps.Polygon[] = [];
    for (const route of routes) {
      if (route.coordinates.length < 2) continue;
      lines.push(new google.maps.Polyline({ map, path: route.coordinates, geodesic: true,
        strokeColor: "#348CB2", strokeOpacity: 0.88, strokeWeight: 4 }));
    }
    for (const polygon of polygons) {
      if (polygon.coordinates.length < 3) continue;
      areas.push(new google.maps.Polygon({ map, paths: polygon.coordinates,
        strokeColor: "#348CB2", strokeOpacity: 0.9, strokeWeight: 2,
        fillColor: "#348CB2", fillOpacity: 0.12 }));
    }
    return () => { lines.forEach(line => line.setMap(null)); areas.forEach(area => area.setMap(null)); };
  }, [map, routes, polygons]);
  return null;
}

export function GoogleMapsCanvas({ config, center, markers, routes, polygons, height = 420, onMapEvent }: {
  config: MapsRuntimeConfig; center: MapCoordinate; markers: MapMarker[];
  routes: MapPolyline[]; polygons: MapPolygon[]; height?: number;
  onMapEvent?: (event: MapEvent) => void;
}) {
  if (!resolveMapsAdapter("web", config) || !config.apiKey) return (
    <div className="flex items-center justify-between gap-4 border-y border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-6"
      style={{ minHeight: height }} role="status">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Google Maps belum diaktifkan</p>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
          {config.fallbackReason} Data koordinat, geofence, dan route tetap tersedia melalui SalesX-Ai.
          Map tiles tidak dimuat sampai public browser key yang dibatasi domain dikonfigurasi.
        </p>
      </div>
    </div>
  );
  return <div style={{ height, width: "100%" }}>
    <APIProvider apiKey={config.apiKey} language={config.language} region={config.region}>
      <GoogleMap defaultCenter={center} defaultZoom={12} mapId={config.mapId}
        gestureHandling="greedy" style={{ width: "100%", height: "100%" }}>
        <MapOverlays routes={routes} polygons={polygons} />
        {markers.map(marker => <Marker key={marker.id} position={marker.position}
          title={marker.title} opacity={marker.tone === "stale" ? 0.55 : 1}
          onClick={() => onMapEvent?.({type:"marker_press",markerId:marker.id,coordinate:marker.position})} />)}
      </GoogleMap>
    </APIProvider>
  </div>;
}
