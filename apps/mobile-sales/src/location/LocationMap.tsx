import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { resolveMapsAdapter, resolveMapsRuntimeConfig } from "../../../../packages/maps/src";
import type { MapCoordinate, MapEvent, MapPolygon, MapPolyline } from "../../../../packages/maps/src";

export function LocationMap({ center, routes = [], polygons = [],
  enabled = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ENABLED === "true", onMapEvent }: {
  center: MapCoordinate | null; routes?: MapPolyline[]; polygons?: MapPolygon[]; enabled?: boolean;
  onMapEvent?: (event: MapEvent) => void;
}) {
  const mapConfig = resolveMapsRuntimeConfig("native", { EXPO_PUBLIC_GOOGLE_MAPS_ENABLED: enabled ? "true" : "false" });
  if (!resolveMapsAdapter("native", mapConfig) || !center) return (
    <View style={styles.fallback} accessibilityRole="summary">
      <Text style={styles.title}>{center ? "Google Maps belum diaktifkan" : "Menunggu koordinat lokasi"}</Text>
      <Text style={styles.body}>{center
        ? "Koordinat tersedia. Map tiles native aktif setelah Android/iOS API key dan feature flag dikonfigurasi."
        : "Peta akan menampilkan posisi setelah izin lokasi diberikan dan koordinat perangkat tersedia."}</Text>
      {center ? <>
        <Text style={styles.coordinate}>{center.lat.toFixed(6)}, {center.lng.toFixed(6)}</Text>
        <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(
          "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(center.lat + "," + center.lng))}>
          <Text style={styles.link}>Buka koordinat di Google Maps</Text>
        </Pressable>
      </> : null}
    </View>
  );
  return <MapView provider={PROVIDER_GOOGLE} style={styles.map}
    initialRegion={{ latitude: center.lat, longitude: center.lng, latitudeDelta: 0.012, longitudeDelta: 0.012 }}
    showsUserLocation showsMyLocationButton toolbarEnabled
    onRegionChangeComplete={region => onMapEvent?.({type:"viewport_change",viewport:{center:{lat:region.latitude,lng:region.longitude}}})}>
    <Marker coordinate={{ latitude: center.lat, longitude: center.lng }} title="Posisi perangkat"
      onPress={() => onMapEvent?.({type:"marker_press",markerId:"device",coordinate:center})} />
    {routes.map(route => <Polyline key={route.id}
      coordinates={route.coordinates.map(point => ({ latitude: point.lat, longitude: point.lng }))}
      strokeColor="#348CB2" strokeWidth={4} />)}
    {polygons.map(polygon => <Polygon key={polygon.id}
      coordinates={polygon.coordinates.map(point => ({ latitude: point.lat, longitude: point.lng }))}
      strokeColor="#348CB2" fillColor="rgba(52,140,178,0.12)" strokeWidth={2} />)}
  </MapView>;
}
const styles = StyleSheet.create({
  map: { width: "100%", height: 220, borderRadius: 14 },
  fallback: { minHeight: 120, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#D7E0E8", backgroundColor: "#F6F8FA", gap: 6 },
  title: { color: "#173247", fontSize: 14, fontWeight: "700" },
  body: { color: "#5A6D7B", fontSize: 12, lineHeight: 18 },
  coordinate: { color: "#173247", fontSize: 12, fontVariant: ["tabular-nums"] },
  link: { color: "#1675A5", fontSize: 12, fontWeight: "700", marginTop: 4 },
});
