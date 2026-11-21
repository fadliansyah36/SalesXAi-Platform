import { NextRequest, NextResponse } from 'next/server';

const PLACES_SEARCH_ENDPOINT =
  'https://places.googleapis.com/v1/places:searchText';

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.location',
  'places.googleMapsUri',
  'places.websiteUri',
  'places.businessStatus',
  'places.rating',
  'places.userRatingCount',
  'places.primaryTypeDisplayName',
  'nextPageToken',
].join(',');

export async function POST(req: NextRequest) {
  const apiKey = process.env.GOOGLE_MAPS_PLACES_API_KEY || '';
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Google Maps API key belum terkonfigurasi di server. Aktifkan integrasi Google Maps terlebih dahulu.',
      },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const {
      textQuery,
      includedType,
      strictTypeFiltering,
      locationBias,
      pageSize = 10,
      pageToken,
    } = body as {
      textQuery?: string;
      includedType?: string;
      strictTypeFiltering?: boolean;
      locationBias?: { lat: number; lng: number; radiusMeters?: number };
      pageSize?: number;
      pageToken?: string;
    };

    if (typeof textQuery !== 'string' || !textQuery.trim() || textQuery.length > 200) {
      return NextResponse.json(
        { error: 'Kata kunci pencarian bisnis wajib diisi.' },
        { status: 400 }
      );
    }

    const requestBody: Record<string, unknown> = {
      textQuery: textQuery.trim(),
      languageCode: 'id',
      regionCode: 'ID',
      pageSize: Math.min(Math.max(Number(pageSize) || 10, 1), 20),
    };

    if (includedType && includedType !== 'all' && /^[a-z0-9_]{1,64}$/.test(includedType)) {
      requestBody.includedType = includedType;
      if (strictTypeFiltering) {
        requestBody.strictTypeFiltering = true;
      }
    }

    if (
      locationBias &&
      typeof locationBias.lat === 'number' &&
      typeof locationBias.lng === 'number' &&
      Number.isFinite(locationBias.lat) && Number.isFinite(locationBias.lng) &&
      locationBias.lat >= -90 && locationBias.lat <= 90 &&
      locationBias.lng >= -180 && locationBias.lng <= 180
    ) {
      requestBody.locationBias = {
        circle: {
          center: {
            latitude: locationBias.lat,
            longitude: locationBias.lng,
          },
          radius: Math.min(
            Math.max(locationBias.radiusMeters || 10000, 500),
            50000
          ),
        },
      };
    }

    if (pageToken) {
      requestBody.pageToken = pageToken;
    }

    const res = await fetch(PLACES_SEARCH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();

    if (!res.ok) {
      const statusText = data?.error?.status || '';
      const isQuota =
        res.status === 429 ||
        statusText === 'RESOURCE_EXHAUSTED' ||
        (data?.error?.message || '').toLowerCase().includes('quota');

      return NextResponse.json(
        {
          error: isQuota
            ? 'Kuota Google Maps Places API telah tercapai sementara.'
            : data?.error?.message ||
              'Gagal melakukan pencarian Google Maps Places.',
          quotaExceeded: isQuota,
        },
        { status: res.status }
      );
    }

    const places = Array.isArray(data.places) ? data.places : [];
    return NextResponse.json({
      places,
      nextPageToken: data.nextPageToken || null,
    });
  } catch (err) {
    console.error('Places API searchText proxy error:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghubungi Google Maps Places API.' },
      { status: 500 }
    );
  }
}
