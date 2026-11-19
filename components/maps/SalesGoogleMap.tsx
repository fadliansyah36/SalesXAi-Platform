'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Navigation, AlertCircle, MapPin } from 'lucide-react';
import type { Outlet } from '@/lib/salesx-data';
import { formatRupiah } from '@/lib/salesx-data';

interface RouteDisplayProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  travelMode?: 'DRIVING' | 'TWO_WHEELER' | 'WALKING';
  onRouteComputed?: (summary: {
    distanceKm: string;
    durationMins: string;
  }) => void;
}

function RoutePolylineLayer({
  origin,
  destination,
  travelMode = 'DRIVING',
  onRouteComputed,
}: RouteDisplayProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  const { lat: originLat, lng: originLng } = origin;
  const { lat: destLat, lng: destLng } = destination;

  useEffect(() => {
    if (!routesLib || !map) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    let cancelled = false;
    const request = {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng },
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    (
      routesLib.Route as unknown as {
        computeRoutes: (req: unknown) => Promise<{ routes: any[] }>;
      }
    )
      .computeRoutes(request)
      .then(({ routes }) => {
        if (cancelled || !routes || routes.length === 0) return;
        const primaryRoute = routes[0];
        const newPolylines: google.maps.Polyline[] =
          primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#348CB2',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }
        onRouteComputed?.({
          distanceKm: ((primaryRoute.distanceMeters ?? 0) / 1000).toFixed(1),
          durationMins: Math.max(
            1,
            Math.round((primaryRoute.durationMillis ?? 0) / 60000)
          ).toString(),
        });
      })
      .catch((err) => {
        console.error('Routes API computeRoutes error:', err);
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [
    routesLib,
    map,
    originLat,
    originLng,
    destLat,
    destLng,
    travelMode,
    onRouteComputed,
  ]);

  return null;
}

function OutletMarkerItem({
  outlet,
  isSelected,
  onSelect,
}: {
  outlet: Outlet;
  isSelected: boolean;
  onSelect: (outlet: Outlet) => void;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: outlet.lat, lng: outlet.lng }}
        title={outlet.name}
        onClick={() => onSelect(outlet)}
      >
        <Pin
          background={outlet.isPriority ? '#F97316' : '#348CB2'}
          borderColor={outlet.isPriority ? '#C2410C' : '#123A54'}
          glyphColor="#FFFFFF"
          scale={isSelected ? 1.25 : 1.0}
        />
      </AdvancedMarker>
      {isSelected && marker && (
        <InfoWindow anchor={marker} onCloseClick={() => onSelect(outlet)}>
          <div className="min-w-[190px] p-1 text-slate-900">
            <p className="text-sm font-bold">{outlet.name}</p>
            <p className="text-xs text-slate-600 mt-0.5">{outlet.address}</p>
            <p className="text-xs font-medium text-[#236D91] mt-1 tabular-nums">
              Order Terakhir: {formatRupiah(outlet.lastOrderTotal)}
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${outlet.lat},${outlet.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#348CB2] hover:underline"
            >
              <span>Buka di Peta Perangkat</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface SalesGoogleMapProps {
  currentPos: { lat: number; lng: number };
  currentPosLabel?: string;
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  onSelectOutlet: (outlet: Outlet) => void;
  showRouteToSelected?: boolean;
  heightClass?: string;
}

export function SalesGoogleMap({
  currentPos,
  currentPosLabel = 'Posisi Saat Ini',
  outlets,
  selectedOutlet,
  onSelectOutlet,
  showRouteToSelected = true,
  heightClass = 'h-[340px] md:h-[400px]',
}: SalesGoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [routeSummary, setRouteSummary] = useState<{
    distanceKm: string;
    durationMins: string;
  } | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(
    selectedOutlet?.id ?? null
  );

  if (!apiKey) {
    return (
      <div
        className={`w-full ${heightClass} rounded-2xl border border-[var(--color-border)] bg-[#E5F4F8] dark:bg-[#111C2D] p-6 flex flex-col items-center justify-center text-center`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#348CB2]/15 text-[#348CB2] mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Peta Google Maps Siap Dihubungkan
        </p>
        <p className="mt-1 max-w-md text-xs text-[var(--color-text-secondary)]">
          Koordinat aktif saat ini ({currentPosLabel}):{' '}
          <span className="font-mono tabular-nums">
            {currentPos.lat.toFixed(6)}, {currentPos.lng.toFixed(6)}
          </span>
          . Aktifkan API key Google Maps pada pengaturan proyek untuk menampilkan
          peta interaktif secara langsung.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div
        className={`relative w-full ${heightClass} overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]`}
      >
        <APIProvider apiKey={apiKey} language="id" region="ID">
          <GoogleMap
            mapId="DEMO_MAP_ID"
            defaultZoom={13}
            defaultCenter={currentPos}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Current Sales Position Marker */}
            <AdvancedMarker
              position={currentPos}
              title={currentPosLabel}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#10B981] text-white shadow-md">
                <Navigation className="h-4 w-4" />
              </div>
            </AdvancedMarker>

            {outlets.map((outlet) => (
              <OutletMarkerItem
                key={outlet.id}
                outlet={outlet}
                isSelected={
                  (selectedMarkerId || selectedOutlet?.id) === outlet.id
                }
                onSelect={(item) => {
                  setSelectedMarkerId(item.id);
                  onSelectOutlet(item);
                }}
              />
            ))}

            {showRouteToSelected && selectedOutlet && (
              <RoutePolylineLayer
                origin={currentPos}
                destination={{
                  lat: selectedOutlet.lat,
                  lng: selectedOutlet.lng,
                }}
                travelMode="DRIVING"
                onRouteComputed={setRouteSummary}
              />
            )}
          </GoogleMap>
        </APIProvider>
      </div>

      {selectedOutlet && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
            <MapPin className="h-4 w-4 text-[#348CB2] shrink-0" />
            <span className="font-semibold">{selectedOutlet.name}</span>
            <span className="text-[var(--color-text-muted)]">·</span>
            <span className="text-[var(--color-text-secondary)] tabular-nums">
              {routeSummary
                ? `Jarak rute ${routeSummary.distanceKm} km · Estimasi ${routeSummary.durationMins} menit`
                : `Jarak ${selectedOutlet.distanceKm} km`}
            </span>
          </div>
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${currentPos.lat},${currentPos.lng}&destination=${selectedOutlet.lat},${selectedOutlet.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#348CB2] hover:text-[#236D91] whitespace-nowrap"
          >
            <span>Buka di Peta Perangkat</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
