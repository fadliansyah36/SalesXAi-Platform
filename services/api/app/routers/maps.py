from __future__ import annotations

import asyncio
import json
from typing import Literal
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.errors import APIError
from app.config import get_settings
from app.security.dependencies import TenantContext, require_api_action

router = APIRouter(tags=["maps"])


class MapCoordinate(BaseModel):
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)


class MapRouteComputeRequest(BaseModel):
    origin: MapCoordinate
    destination: MapCoordinate
    intermediates: list[MapCoordinate] = Field(default_factory=list, max_length=25)
    travel_mode: Literal["DRIVE", "BICYCLE", "WALK", "TWO_WHEELER"] = "DRIVE"

class MapPlacesLocationBias(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    radius_meters: int = Field(default=10000, ge=500, le=50000, alias="radiusMeters")


class MapPlacesSearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    text_query: str = Field(min_length=1, max_length=200, alias="textQuery")
    included_type: str | None = Field(default=None, pattern=r"^[a-z0-9_]{1,64}$", alias="includedType")
    strict_type_filtering: bool = Field(default=False, alias="strictTypeFiltering")
    location_bias: MapPlacesLocationBias | None = Field(default=None, alias="locationBias")
    page_size: int = Field(default=10, ge=1, le=20, alias="pageSize")
    page_token: str | None = Field(default=None, min_length=1, max_length=2048, alias="pageToken")

    @field_validator("text_query")
    @classmethod
    def validate_text_query(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("textQuery must not be blank")
        return normalized



def _google_places_search(payload: MapPlacesSearchRequest, api_key: str, language: str, region: str) -> dict:
    body: dict = {
        "textQuery": payload.text_query,
        "languageCode": language,
        "regionCode": region,
        "pageSize": payload.page_size,
    }
    if payload.included_type:
        body["includedType"] = payload.included_type
        if payload.strict_type_filtering:
            body["strictTypeFiltering"] = True
    if payload.location_bias:
        body["locationBias"] = {
            "circle": {
                "center": {
                    "latitude": payload.location_bias.lat,
                    "longitude": payload.location_bias.lng,
                },
                "radius": payload.location_bias.radius_meters,
            }
        }
    if payload.page_token:
        body["pageToken"] = payload.page_token

    request = Request(
        "https://places.googleapis.com/v1/places:searchText",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": ",".join([
                "places.id", "places.displayName", "places.formattedAddress",
                "places.nationalPhoneNumber", "places.internationalPhoneNumber",
                "places.location", "places.googleMapsUri", "places.websiteUri",
                "places.businessStatus", "places.rating", "places.userRatingCount",
                "places.primaryTypeDisplayName", "nextPageToken",
            ]),
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=10) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        try:
            provider_error = json.loads(detail).get("error", {})
        except (TypeError, ValueError):
            provider_error = {}
        status_text = str(provider_error.get("status") or "")
        if exc.code == 429 or status_text == "RESOURCE_EXHAUSTED":
            raise APIError(429, "maps_places_quota_exceeded", "Google Maps Places quota is temporarily exhausted.") from exc
        raise APIError(502, "maps_places_provider_error", "Google Places API rejected the search request.") from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise APIError(502, "maps_places_provider_unavailable", "Google Places API is temporarily unavailable.") from exc

    places = result.get("places")
    return {
        "places": places if isinstance(places, list) else [],
        "nextPageToken": result.get("nextPageToken"),
    }

def _google_route(payload: MapRouteComputeRequest, api_key: str) -> dict:
    body: dict = {
        "origin": {"location": {"latLng": {"latitude": payload.origin.lat, "longitude": payload.origin.lng}}},
        "destination": {"location": {"latLng": {"latitude": payload.destination.lat, "longitude": payload.destination.lng}}},
        "travelMode": payload.travel_mode,
        "polylineQuality": "OVERVIEW",
    }
    if payload.intermediates:
        body["intermediates"] = [
            {"location": {"latLng": {"latitude": point.lat, "longitude": point.lng}}}
            for point in payload.intermediates
        ]
    request = Request(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        data=json.dumps(body).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "X-Goog-Api-Key": api_key,
            "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=12) as response:
            result = json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        raise APIError(502, "maps_provider_error", "Google Routes API rejected the route request.") from exc
    except (URLError, TimeoutError, OSError, ValueError) as exc:
        raise APIError(502, "maps_provider_unavailable", "Google Routes API is temporarily unavailable.") from exc
    routes = result.get("routes") or []
    if not routes:
        raise APIError(404, "maps_route_not_found", "No route is available for the supplied coordinates.")
    route = routes[0]
    encoded = (route.get("polyline") or {}).get("encodedPolyline")
    if not encoded:
        raise APIError(502, "maps_route_response_invalid", "Google Routes API returned no route geometry.")
    return {
        "provider": "google",
        "distance_m": int(route.get("distanceMeters") or 0),
        "duration": str(route.get("duration") or ""),
        "encoded_polyline": encoded,
    }


@router.get("/maps/config")
async def maps_config(tenant: TenantContext = Depends(require_api_action("maps.config.read"))):
    del tenant
    settings = get_settings()
    return {
        "provider": settings.maps_provider,
        "server_routes_enabled": settings.google_maps_routes_enabled,
        "server_places_enabled": settings.google_maps_places_enabled,
        "language": settings.google_maps_language,
        "region": settings.google_maps_region,
    }


@router.post("/maps/places/search")
async def search_places(
    payload: MapPlacesSearchRequest,
    tenant: TenantContext = Depends(require_api_action("maps.places.search")),
):
    del tenant
    settings = get_settings()
    api_key = (
        settings.google_maps_places_api_key.get_secret_value()
        if settings.google_maps_places_enabled and settings.google_maps_places_api_key
        else ""
    )
    if not api_key:
        raise APIError(503, "maps_provider_not_configured", "Google Places credentials are not configured.")
    return await asyncio.to_thread(
        _google_places_search, payload, api_key,
        settings.google_maps_language, settings.google_maps_region,
    )


@router.post("/organizations/{organization_id}/maps/routes/compute")
async def compute_route(
    organization_id: UUID,
    payload: MapRouteComputeRequest,
    tenant: TenantContext = Depends(require_api_action("maps.routes.compute")),
):
    if tenant.organization_id != organization_id:
        raise APIError(403, "tenant_scope_mismatch", "Map route access is restricted to the active organization.")
    settings = get_settings()
    api_key = (
        settings.google_maps_server_api_key.get_secret_value()
        if settings.google_maps_routes_enabled and settings.google_maps_server_api_key
        else ""
    )
    if not api_key:
        raise APIError(503, "maps_provider_not_configured", "Google Maps server route credentials are not configured.")
    return await asyncio.to_thread(_google_route, payload, api_key)
