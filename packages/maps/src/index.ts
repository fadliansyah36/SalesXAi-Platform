export type MapsPlatform = "web" | "native";
export type MapsProvider = "google" | "none";
export interface MapCoordinate { lat: number; lng: number; }
export interface MapMarker { id: string; position: MapCoordinate; title: string; tone?: "active" | "stale" | "neutral"; }
export interface MapPolyline { id: string; coordinates: MapCoordinate[]; }
export interface MapPolygon { id: string; label?: string; coordinates: MapCoordinate[]; }
export interface MapViewport {
  center: MapCoordinate;
  zoom?: number;
  bounds?: { north: number; south: number; east: number; west: number };
}
export type MapEvent =
  | { type: "marker_press"; markerId: string; coordinate: MapCoordinate }
  | { type: "viewport_change"; viewport: MapViewport }
  | { type: "geofence_press"; geofenceId: string }
  | { type: "route_press"; routeId: string };
export interface MapsFeatureFlags {
  mapTiles: boolean;
  liveLocation: boolean;
  routeHistory: boolean;
  geofenceOverlay: boolean;
  routeCalculation: boolean;
}
export interface MapsProviderAdapter {
  id: "google";
  platform: MapsPlatform;
  isConfigured(config: MapsRuntimeConfig): boolean;
}
export interface MapsRuntimeConfig {
  platform: MapsPlatform; provider: MapsProvider; enabled: boolean; apiKey?: string;
  mapId?: string; language: string; region: string; features: MapsFeatureFlags; fallbackReason: string | null;
}
export type MapsEnvironment = Record<string, string | undefined>;

/** Resolve public, platform-scoped configuration. Server credentials are never accepted here. */
export function resolveMapsRuntimeConfig(platform: MapsPlatform, environment: MapsEnvironment): MapsRuntimeConfig {
  const apiKey = platform === "web" ? environment.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() : undefined;
  const enabled = platform === "web"
    ? Boolean(apiKey)
    : environment.EXPO_PUBLIC_GOOGLE_MAPS_ENABLED?.trim().toLowerCase() === "true";
  return {
    platform, provider: enabled ? "google" : "none", enabled,
    ...(apiKey ? { apiKey } : {}),
    ...(environment.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID?.trim() ? { mapId: environment.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID.trim() } : {}),
    language: environment.GOOGLE_MAPS_LANGUAGE?.trim() || "id",
    region: environment.GOOGLE_MAPS_REGION?.trim() || "ID",
    features: { mapTiles: enabled, liveLocation: true, routeHistory: true, geofenceOverlay: true, routeCalculation: false },
    fallbackReason: enabled ? null : platform === "web"
      ? "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not configured."
      : "Native Google Maps keys and EXPO_PUBLIC_GOOGLE_MAPS_ENABLED are not configured.",
  };
}
export function isValidMapCoordinate(value: MapCoordinate): boolean {
  return Number.isFinite(value.lat) && Number.isFinite(value.lng) &&
    value.lat >= -90 && value.lat <= 90 && value.lng >= -180 && value.lng <= 180;
}
export function distanceMeters(from: MapCoordinate, to: MapCoordinate): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const earthRadiusMeters = 6_371_008.8;
  const dLat = radians(to.lat - from.lat), dLng = radians(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.lat)) * Math.cos(radians(to.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function geometryOf(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  return candidate.type === "Feature" && candidate.geometry && typeof candidate.geometry === "object"
    ? candidate.geometry as Record<string, unknown> : candidate;
}
function coordinatesFromPairs(value: unknown): MapCoordinate[] {
  if (!Array.isArray(value)) return [];
  return value.filter((pair): pair is [number, number] =>
    Array.isArray(pair) && pair.length >= 2 && typeof pair[0] === "number" && typeof pair[1] === "number")
    .map(([lng, lat]) => ({ lat, lng })).filter(isValidMapCoordinate);
}
export function geoJsonLineCoordinates(value: unknown): MapCoordinate[] {
  const geometry = geometryOf(value);
  if (!geometry) return [];
  if (geometry.type === "LineString") return coordinatesFromPairs(geometry.coordinates);
  if (geometry.type === "MultiLineString" && Array.isArray(geometry.coordinates))
    return geometry.coordinates.flatMap(coordinatesFromPairs);
  return [];
}
export function geoJsonPolygonRings(value: unknown): MapCoordinate[][] {
  const geometry = geometryOf(value);
  if (!geometry) return [];
  if (geometry.type === "Polygon" && Array.isArray(geometry.coordinates))
    return geometry.coordinates.map(coordinatesFromPairs).filter(ring => ring.length >= 3);
  if (geometry.type === "MultiPolygon" && Array.isArray(geometry.coordinates))
    return geometry.coordinates.flatMap(polygon => Array.isArray(polygon)
      ? polygon.map(coordinatesFromPairs).filter(ring => ring.length >= 3) : []);
  return [];
}


export const googleMapsWebAdapter: MapsProviderAdapter = {
  id: "google",
  platform: "web",
  isConfigured: (config) => config.platform === "web" && config.provider === "google" && Boolean(config.apiKey),
};
export const googleMapsNativeAdapter: MapsProviderAdapter = {
  id: "google",
  platform: "native",
  isConfigured: (config) => config.platform === "native" && config.provider === "google" && config.enabled,
};
export function resolveMapsAdapter(
  platform: MapsPlatform,
  config: MapsRuntimeConfig,
): MapsProviderAdapter | null {
  const adapter = platform === "web" ? googleMapsWebAdapter : googleMapsNativeAdapter;
  return adapter.isConfigured(config) ? adapter : null;
}

/** Decode Google's encoded polyline into the canonical lat/lng contract. */
export function decodeEncodedPolyline(encoded: string): MapCoordinate[] {
  const points: MapCoordinate[] = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      if (index >= encoded.length) return points;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      if (index >= encoded.length) return points;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;

    const point = { lat: latitude / 1e5, lng: longitude / 1e5 };
    if (isValidMapCoordinate(point)) points.push(point);
  }
  return points;
}
