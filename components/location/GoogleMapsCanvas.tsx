"use client";
import { useEffect } from "react";
import { APIProvider, Map as GoogleMap, Marker, useMap } from "@vis.gl/react-google-maps";
import { resolveMapsAdapter } from "@/packages/maps/src";
import type { MapCoordinate, MapEvent, MapMarker, MapPolygon, MapPolyline, MapsRuntimeConfig } from "@/packages/maps/src";

function MapOverlays({ routes, polygons, onMapEvent }: { routes: MapPolyline[]; polygons: MapPolygon[]; onMapEvent?: (event: MapEvent) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const lines: google.maps.Polyline[] = [];
    const areas: google.maps.Polygon[] = [];
    for (const route of routes) {
      if (route.coordinates.length < 2) continue;
      const line = new google.maps.Polyline({ map, path: route.coordinates, geodesic: true,
        strokeColor: "#348CB2", strokeOpacity: 0.88, strokeWeight: 4 });
      line.addListener("click", () => onMapEvent?.({type:"route_press",routeId:route.id}));
      lines.push(line);
    }
    for (const polygon of polygons) {
      if (polygon.coordinates.length < 3) continue;
      const area = new google.maps.Polygon({ map, paths: polygon.coordinates,
        strokeColor: "#348CB2", strokeOpacity: 0.9, strokeWeight: 2,
        fillColor: "#348CB2", fillOpacity: 0.12 });
      area.addListener("click", () => onMapEvent?.({type:"geofence_press",geofenceId:polygon.id}));
      areas.push(area);
    }
    return () => { lines.forEach(line => line.setMap(null)); areas.forEach(area => area.setMap(null)); };
  }, [map, routes, polygons, onMapEvent]);
  return null;
}

function MapViewportEvents({ onMapEvent }: { onMapEvent?: (event: MapEvent) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !onMapEvent) return;
    const listener = map.addListener("idle", () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      if (!center) return;
      const northEast = bounds?.getNorthEast();
      const southWest = bounds?.getSouthWest();
      onMapEvent({
        type: "viewport_change",
        viewport: {
          center: { lat: center.lat(), lng: center.lng() },
          zoom: map.getZoom(),
          ...(northEast && southWest ? { bounds: {
            north: northEast.lat(), east: northEast.lng(),
            south: southWest.lat(), west: southWest.lng(),
          }} : {}),
        },
      });
    });
    return () => listener.remove();
  }, [map, onMapEvent]);
  return null;
}

export function GoogleMapsCanvas({ config, center, markers, routes, polygons, height = 420, onMapEvent }: {
  config: MapsRuntimeConfig; center: MapCoordinate; markers: MapMarker[];
  routes: MapPolyline[]; polygons: MapPolygon[]; height?: number;
  onMapEvent?: (event: MapEvent) => void;
}) {
  if (!resolveMapsAdapter("web", config) || !config.apiKey) return (
    <div className="flex items-center justify-between gap-4 border-y border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-6"
      style={{ minHeight: height }} role="status" aria-label="Status aktivasi peta lokasi">
      <div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">Google Maps belum diaktifkan</p>
        <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-secondary)]">
          {config.fallbackReason} Data koordinat, geofence, dan route tetap tersedia melalui SalesX-Ai.
          Map tiles tidak dimuat sampai public browser key yang dibatasi domain dikonfigurasi.
        </p>
      </div>
    </div>
  );
  return <div style={{ height, width: "100%" }} role="region" aria-label="Peta lokasi SalesX-Ai">
    <APIProvider apiKey={config.apiKey} language={config.language} region={config.region}>
      <GoogleMap center={center} defaultZoom={12} mapId={config.mapId}
        gestureHandling="greedy" style={{ width: "100%", height: "100%" }}>
        <MapViewportEvents onMapEvent={onMapEvent} />
        <MapOverlays routes={routes} polygons={polygons} onMapEvent={onMapEvent} />
        {markers.map(marker => <Marker key={marker.id} position={marker.position}
          title={marker.title} opacity={marker.tone === "stale" ? 0.55 : 1}
          onClick={() => onMapEvent?.({type:"marker_press",markerId:marker.id,coordinate:marker.position})} />)}
      </GoogleMap>
    </APIProvider>
  </div>;
}
